# National ID Encryption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encrypt the `national_id` column in the `users` table using AES-256 (pgcrypto `pgp_sym_encrypt`) with the key stored in Supabase Vault, so national ID numbers are never stored in plaintext.

**Architecture:** A Postgres BEFORE INSERT OR UPDATE trigger transparently encrypts plaintext `national_id` values, prefixing them with `ENC:` so encrypted values are detectable. An admin-only SECURITY DEFINER RPC decrypts on demand. No registration or import code changes are needed because the trigger handles all write paths. The encryption key lives in `vault.secrets`, is never in migration history, and is only accessible to SECURITY DEFINER functions owned by `postgres`.

**Tech Stack:** PostgreSQL pgcrypto (`pgp_sym_encrypt`/`pgp_sym_decrypt`), Supabase Vault (`vault.create_secret`, `vault.decrypted_secrets`), TypeScript/React (adminService + IdentityTab)

---

## File Map

| File                                                                  | Action | Purpose                                                |
| --------------------------------------------------------------------- | ------ | ------------------------------------------------------ |
| `supabase/migrations/20260530000200_national_id_encryption_setup.sql` | Create | Vault key + internal encrypt/decrypt helpers + trigger |
| `supabase/migrations/20260530000201_national_id_migrate_existing.sql` | Create | One-time UPDATE of existing plaintext national_ids     |
| `supabase/migrations/20260530000202_national_id_admin_rpc.sql`        | Create | Admin-only `admin_get_national_id` RPC                 |
| `src/services/adminService.ts`                                        | Modify | Add `getNationalId(regNo)` method                      |
| `src/pages/admin/members/IdentityTab.tsx`                             | Modify | Show masked national ID + admin Reveal button          |

---

### Task 1: Vault Key + Internal Helpers + Trigger

**Files:**

- Create: `supabase/migrations/20260530000200_national_id_encryption_setup.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260530000200_national_id_encryption_setup.sql

-- 1. Create the encryption key in Vault (generated at migration run time, never stored in plaintext here)
SELECT vault.create_secret(
  encode(gen_random_bytes(32), 'base64'),
  'national_id_enc_key',
  'AES passphrase for users.national_id column encryption'
);

-- 2. Internal encrypt helper — SECURITY DEFINER so it can read vault.decrypted_secrets
CREATE OR REPLACE FUNCTION public.encrypt_national_id(p_plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  IF p_plaintext IS NULL OR p_plaintext = '' THEN
    RETURN p_plaintext;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'national_id_enc_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'national_id encryption key not found in Vault';
  END IF;

  -- Prefix with ENC: so we can detect already-encrypted values
  RETURN 'ENC:' || encode(pgp_sym_encrypt(p_plaintext, v_key), 'base64');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.encrypt_national_id(text) FROM authenticated;
-- Only trigger context (runs as postgres owner) needs this; no external grants

-- 3. Internal decrypt helper
CREATE OR REPLACE FUNCTION public.decrypt_national_id(p_ciphertext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  v_key text;
BEGIN
  IF p_ciphertext IS NULL OR p_ciphertext = '' THEN
    RETURN p_ciphertext;
  END IF;

  -- Not encrypted yet (legacy plaintext) — return as-is
  IF NOT starts_with(p_ciphertext, 'ENC:') THEN
    RETURN p_ciphertext;
  END IF;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'national_id_enc_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'national_id encryption key not found in Vault';
  END IF;

  RETURN pgp_sym_decrypt(
    decode(substring(p_ciphertext FROM 5), 'base64'),
    v_key
  )::text;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrypt_national_id(text) FROM authenticated;
-- Only called internally by admin_get_national_id; no external grants

-- 4. Trigger function: auto-encrypt plaintext national_id on write
CREATE OR REPLACE FUNCTION public.trigger_encrypt_national_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
BEGIN
  -- Skip null/empty
  IF NEW.national_id IS NULL OR NEW.national_id = '' THEN
    RETURN NEW;
  END IF;

  -- Skip if already encrypted (idempotent)
  IF starts_with(NEW.national_id, 'ENC:') THEN
    RETURN NEW;
  END IF;

  NEW.national_id := public.encrypt_national_id(NEW.national_id);
  RETURN NEW;
END;
$$;

-- 5. Attach trigger to users table
DROP TRIGGER IF EXISTS trg_encrypt_national_id ON public.users;
CREATE TRIGGER trg_encrypt_national_id
  BEFORE INSERT OR UPDATE OF national_id
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_encrypt_national_id();
```

- [ ] **Step 2: Apply the migration**

```bash
# From the project root
npx supabase db push
```

Expected: migration applies, vault secret created, functions and trigger created with no errors.

- [ ] **Step 3: Verify trigger works with a test query**

Run in Supabase SQL editor (then rollback — this is just a smoke test):

```sql
-- Should return a value starting with ENC:
SELECT public.encrypt_national_id('GHA-1234-5678');
```

Expected: a string like `ENC:jA0E...` (base64 of pgp output).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260530000200_national_id_encryption_setup.sql
git commit -m "feat: add national_id Vault key, encrypt/decrypt helpers, and write trigger"
```

---

### Task 2: Migrate Existing Plaintext Data

**Files:**

- Create: `supabase/migrations/20260530000201_national_id_migrate_existing.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260530000201_national_id_migrate_existing.sql
-- One-time encryption of all existing plaintext national_id values.
-- Rows where national_id is NULL, empty, or already prefixed with ENC: are skipped.

UPDATE public.users
SET national_id = public.encrypt_national_id(national_id)
WHERE national_id IS NOT NULL
  AND national_id <> ''
  AND NOT starts_with(national_id, 'ENC:');
```

- [ ] **Step 2: Check how many rows exist before applying**

Run in Supabase SQL editor (read-only check):

```sql
SELECT COUNT(*) AS plaintext_count
FROM public.users
WHERE national_id IS NOT NULL
  AND national_id <> ''
  AND NOT starts_with(national_id, 'ENC:');
```

Note the count. After migration, running the same query should return 0.

- [ ] **Step 3: Apply the migration**

```bash
npx supabase db push
```

- [ ] **Step 4: Verify all rows are now encrypted**

```sql
-- Should return 0
SELECT COUNT(*) FROM public.users
WHERE national_id IS NOT NULL
  AND national_id <> ''
  AND NOT starts_with(national_id, 'ENC:');

-- Sample: should all start with ENC:
SELECT national_id FROM public.users WHERE national_id IS NOT NULL LIMIT 5;
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260530000201_national_id_migrate_existing.sql
git commit -m "feat: encrypt all existing plaintext national_id values"
```

---

### Task 3: Admin-Only Decrypt RPC

**Files:**

- Create: `supabase/migrations/20260530000202_national_id_admin_rpc.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260530000202_national_id_admin_rpc.sql

-- Admin-only RPC: returns the decrypted national_id for a given registration_number.
-- Callers must be in the public.admins table; all others receive NULL.
CREATE OR REPLACE FUNCTION public.admin_get_national_id(p_reg_no text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted text;
BEGIN
  -- Verify caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT national_id INTO v_encrypted
  FROM public.users
  WHERE registration_number = p_reg_no
  LIMIT 1;

  IF v_encrypted IS NULL OR v_encrypted = '' THEN
    RETURN NULL;
  END IF;

  RETURN public.decrypt_national_id(v_encrypted);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_national_id(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_national_id(text) FROM anon;
-- Grant to authenticated — the SECURITY DEFINER body enforces admin check
GRANT EXECUTE ON FUNCTION public.admin_get_national_id(text) TO authenticated;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

- [ ] **Step 3: Verify the RPC rejects non-admins**

In the Supabase SQL editor (running as a test non-admin user won't be easy here, but you can check that the grant is correct):

```sql
-- Should show authenticated has EXECUTE
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'admin_get_national_id'
  AND routine_schema = 'public';

-- anon should NOT appear in the results
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260530000202_national_id_admin_rpc.sql
git commit -m "feat: add admin_get_national_id RPC with admin-only enforcement"
```

---

### Task 4: Add `getNationalId()` to adminService.ts

**Files:**

- Modify: `src/services/adminService.ts`

- [ ] **Step 1: Read the end of adminService.ts to find the right insertion point**

Find the last method in the `adminService` object and add after it:

```typescript
  async getNationalId(regNo: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('admin_get_national_id', {
      p_reg_no: regNo,
    })
    if (error) {
      console.error('[adminService] getNationalId failed:', error)
      return null
    }
    return data as string | null
  },
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/adminService.ts
git commit -m "feat: add getNationalId RPC call to adminService"
```

---

### Task 5: Update IdentityTab.tsx — Masked National ID + Reveal

**Files:**

- Modify: `src/pages/admin/members/IdentityTab.tsx`

- [ ] **Step 1: Add state and reveal handler**

At the top of the `IdentityTab` function body, add:

```tsx
const [nationalId, setNationalId] = useState<string | null>(null)
const [revealing, setRevealing] = useState(false)

async function handleReveal() {
  setRevealing(true)
  const plain = await adminService.getNationalId(member.id)
  // null means member has no national_id on file — show dash rather than re-enabling the button
  setNationalId(plain !== null ? plain : '—')
  setRevealing(false)
}
```

Add `useState` to the React import at the top of the file:

```tsx
import { Fragment, useState } from 'react'
```

- [ ] **Step 2: Add National ID row to the identity field list**

In the `IdentityTab` JSX, the identity fields are rendered from an array of `[label, value]` pairs. Replace that array with a custom render for the National ID row. Update the dl section to add a National ID entry **after the `['Country', ...]` entry**:

Replace the closing `])}` of the `.map()` array with an additional entry for national ID. Since the national ID needs a custom reveal button, render it outside the simple `.map()` — add it as a separate `<Fragment>` after the `.map()` output:

```tsx
{/* After the closing of the existing .map() block, still inside the <dl>: */}
<dt
  style={{
    fontSize: 9.5,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    fontFamily: "'Public Sans', sans-serif",
    alignSelf: 'center',
  }}
>
  National ID
</dt>
<dd
  style={{
    margin: 0,
    fontSize: 12.5,
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-normal, 400)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}
>
  {nationalId !== null ? (
    nationalId !== '—' ? (
      <>
        <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{nationalId}</span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', cursor: 'pointer' }}
          onClick={() => navigator.clipboard.writeText(nationalId)}
        >
          content_copy
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', cursor: 'pointer' }}
          onClick={() => setNationalId(null)}
        >
          visibility_off
        </span>
      </>
    ) : (
      <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
    )
  ) : (
    <button
      className="btn btn-sm btn-outline"
      style={{ padding: '2px 10px', fontSize: 11 }}
      onClick={handleReveal}
      disabled={revealing}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
        {revealing ? 'hourglass_empty' : 'visibility'}
      </span>
      {revealing ? 'Loading…' : 'Reveal'}
    </button>
  )}
</dd>
```

- [ ] **Step 3: Verify the full updated IdentityTab compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/members/IdentityTab.tsx
git commit -m "feat: add encrypted national ID reveal to member identity tab"
```

---

## Self-Review

### Spec coverage

| Requirement                                           | Task                    |
| ----------------------------------------------------- | ----------------------- |
| pgcrypto AES encryption on national_id                | Task 1                  |
| Key in Supabase Vault, never in migration history     | Task 1                  |
| Existing data migrated                                | Task 2                  |
| All future inserts auto-encrypted (trigger)           | Task 1                  |
| Admin-only decrypt RPC                                | Task 3                  |
| adminService wiring                                   | Task 4                  |
| UI shows masked field + reveal                        | Task 5                  |
| No changes to registrationService or ImportCSVOverlay | ✅ trigger covers these |

### Type consistency

- `adminService.getNationalId(regNo: string): Promise<string | null>` — used as `await adminService.getNationalId(member.id)` where `member.id` is the registration_number string (confirmed from IdentityTab line 37: `member.id.substring(0, 12)` is the reg number display, and `member.id` is used throughout as the reg number)

Wait — checking `IdentityTab` line 207: `onVerify(member.id, member.name)` and from `MemberDetailPanel` context, `member.id` is the `registration_number` in the Member type (not the UUID). Confirmed: `adminService.getNationalId(member.id)` is correct.

### Placeholder scan

No TBDs, TODOs, or incomplete sections found.

### Edge cases covered

- Null/empty national_id → trigger skips, encrypt helper returns as-is
- Already-encrypted value (re-insert/update with same value) → `ENC:` prefix check prevents double-encryption
- Non-admin calling `admin_get_national_id` → `RAISE EXCEPTION 'Permission denied'`
- Member has no national_id → RPC returns NULL, UI shows Reveal button (clicking reveals null, which could show "—")

> **Note on Task 5 null reveal:** If `adminService.getNationalId` returns `null` (member has no national_id on file), the UI will reveal nothing. Consider: after `setNationalId(plain)`, if `plain === null`, show `'—'` instead of leaving the button. Handle this in the component by setting `setNationalId(plain ?? '—')`.
