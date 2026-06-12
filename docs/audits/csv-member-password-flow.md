# CSV Member Password & Authentication Flow

> **Status: Not yet implemented.** `ImportCSVOverlay.tsx` exists but the edge functions, DB columns, and OTP pages in this spec have not been built. The implementation order in Section 8 is the build checklist.

## Problem Statement

Members imported via CSV bulk upload exist in the `users` table but have **no Supabase auth account**. They cannot log into the member dashboard. Each member has a valid phone number but may not have an email address. This document defines how to:

1. Auto-generate a temporary password per member
2. Create their Supabase auth account
3. Deliver the password via SMS
4. Handle forgot-password (phone OTP flow)
5. Let admins reset passwords manually

---

## 1. Password Generation

Generate a **10-character alphanumeric password** on the server. Avoid ambiguous characters (0/O, 1/l/I) to reduce SMS misreading.

```ts
// Charset: uppercase + lowercase + digits, no ambiguous chars
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'

function generateTempPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('')
}
```

The generated password is **temporary** — members are prompted to change it on first login.

---

## 2. Supabase Auth Account Creation (Edge Function)

The Supabase service role key is required to call `auth.admin.createUser()`. This **cannot be done from the frontend** — it must run in a Supabase Edge Function.

### Edge Function: `create-csv-member-accounts`

**Trigger:** Called by the admin's ImportCSVOverlay after the `users` bulk insert succeeds.

**Payload:**

```ts
{
  members: Array<{
    reg_no: string // used as username/identifier
    phone: string // +233XXXXXXXXX format
    name: string
    email?: string // optional
  }>
}
```

**Function logic (pseudocode):**

```ts
for each member in payload:
  1. Check auth.users — skip if account already exists for this phone/email
  2. Generate temp password
  3. Create auth account:
     - If email present: createUser({ email, phone, password, email_confirm: true })
     - If no email:      createUser({ phone, password, phone_confirm: true })
  4. Set user_metadata: { reg_no, name, must_change_password: true }
  5. Store hashed temp password (or a reset token) in users table: temp_password_sent_at
  6. Call SMS provider API → send password to phone
  7. Return result: { reg_no, status: 'created' | 'skipped' | 'error' }
```

**Key Supabase call:**

```ts
const { data, error } = await supabaseAdmin.auth.admin.createUser({
  email: member.email || undefined,
  phone: member.phone,
  password: tempPassword,
  email_confirm: true,
  phone_confirm: true,
  user_metadata: {
    reg_no: member.reg_no,
    name: member.name,
    must_change_password: true,
  },
})
```

### Database column needed

Add to `users` table:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_password_sent_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;
```

---

## 3. SMS Delivery

### Recommended Provider: Africa's Talking

Africa's Talking is the primary SMS gateway for Ghana with local sender IDs and competitive rates.

**Setup:**

- Account at africastalking.com
- Request Ghana shortcode/sender ID (e.g. `THEBASE`)
- Store credentials in Supabase Edge Function secrets:
  - `AT_API_KEY`
  - `AT_USERNAME`

**Send SMS (inside Edge Function):**

```ts
// Africa's Talking REST API (Deno-compatible — do not use the Node.js africastalking npm package)
const response = await fetch('https://api.africastalking.com/version1/messaging', {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    apiKey: Deno.env.get('AT_API_KEY')!,
  },
  body: new URLSearchParams({
    username: Deno.env.get('AT_USERNAME')!,
    to: member.phone, // must be in +233XXXXXXXXX format
    message: `Welcome to The Base Movement!\n\nYour login:\nPhone: ${member.phone}\nTemp Password: ${tempPassword}\n\nLogin at thebase.com/login and change your password immediately.\n- The Base`,
    from: 'THEBASE',
  }),
})
```

**Fallback provider:** Twilio (higher cost, global coverage, useful for Diaspora members with non-Ghana numbers).

### Phone Number Normalisation

Before sending, normalise all phone numbers to E.164 format:

```ts
function toE164Ghana(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}
```

---

## 4. Frontend: ImportCSVOverlay Changes

After the bulk `users` insert succeeds, call the Edge Function:

```ts
const { error } = await supabase.functions.invoke('create-csv-member-accounts', {
  body: {
    members: importedRows.map((r) => ({
      reg_no: r.reg_no,
      phone: r.phone,
      name: r.full_name,
      email: r.email || undefined,
    })),
  },
})
```

Show the admin a result summary:

- N accounts created, passwords sent via SMS
- M skipped (already had accounts)
- K failed (show reg numbers for manual follow-up)

---

## 5. Forgot Password Flow (Phone OTP)

Members who don't have email cannot use the standard email-reset link. The reset flow must use **phone OTP**.

### Flow

```
Member clicks "Forgot Password"
  ↓
Enter phone number (+ reg number for identity confirmation)
  ↓
System sends 6-digit OTP via SMS (valid 10 min)
  ↓
Member enters OTP on /verify-otp page
  ↓
If valid → member sets new password
  ↓
auth.updateUser({ password: newPassword })
```

### Implementation

**OTP generation + storage:**

- Generate 6-digit OTP using `crypto.getRandomValues()` (not `Math.random()` — not cryptographically secure):
  ```ts
  const buf = crypto.getRandomValues(new Uint32Array(1))
  const otp = String((buf[0] % 900000) + 100000)
  ```
- Store in a `password_reset_otps` table (or use Supabase Phone Auth built-in OTP if phone auth is enabled)
- Set expiry: `expires_at = now() + interval '10 minutes'`

```sql
CREATE TABLE IF NOT EXISTS password_reset_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Edge Function: `send-otp`**

```ts
// Validate phone exists in users table
// Generate OTP, insert into password_reset_otps
// Send SMS with OTP
// Return { sent: true }
```

**Edge Function: `verify-otp-and-reset`**

```ts
// Validate OTP exists, not expired, not used
// Mark OTP as used
// Call supabaseAdmin.auth.admin.updateUserById({ password: newPassword })
// Return { success: true }
```

### Alternative: Use Supabase Phone Auth

If Supabase Phone Auth is configured (Twilio integration in dashboard), Supabase handles OTP natively:

```ts
await supabase.auth.signInWithOtp({ phone: '+233XXXXXXXXX' })
// Then verify:
await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
```

This is the cleaner path if Twilio is set up — avoids a custom OTP table.

---

## 6. First-Login Password Change

When `must_change_password: true` is set in `user_metadata`, the member dashboard should intercept the session and redirect to a "Change Your Password" page before showing any content.

**In DashboardLayout or route guard:**

```ts
const {
  data: { user },
} = await supabase.auth.getUser()
if (user?.user_metadata?.must_change_password) {
  navigate('/dashboard/change-password', { replace: true })
}
```

**Change Password page:**

```ts
await supabase.auth.updateUser({ password: newPassword })
// Then clear the flag:
await supabase.auth.updateUser({ data: { must_change_password: false } })
```

---

## 7. Admin Password Reset (Dashboard)

Admins need a "Reset Password" action on the member detail panel (VerificationsQueue or Members page).

### Flow

1. Admin opens member profile
2. Clicks "Reset Password"
3. System generates new temp password
4. Calls Edge Function `admin-reset-password`:
   - `auth.admin.updateUserById(userId, { password: newTempPassword })`
   - Sets `must_change_password: true` in metadata
   - Updates `temp_password_sent_at = now()`
   - Sends SMS to member's phone with new temp password
5. Admin sees confirmation: "New password sent to +233XXXXXXXXX"

**Edge Function: `admin-reset-password`**

```ts
// payload: { user_id: string, phone: string, name: string }
const tempPassword = generateTempPassword()
await supabaseAdmin.auth.admin.updateUserById(user_id, {
  password: tempPassword,
  user_metadata: { must_change_password: true },
})
// Send SMS with tempPassword
```

---

## 8. Implementation Order

| Step | Task                                                         | Where                                |
| ---- | ------------------------------------------------------------ | ------------------------------------ |
| 1    | Add `temp_password_sent_at`, `must_change_password` columns  | Supabase migration                   |
| 2    | Create `create-csv-member-accounts` Edge Function            | `supabase/functions/`                |
| 3    | Set up Africa's Talking account + secrets in Supabase        | Dashboard → Edge Function Secrets    |
| 4    | Update `ImportCSVOverlay` to call Edge Function after insert | Frontend                             |
| 5    | Create `send-otp` + `verify-otp-and-reset` Edge Functions    | `supabase/functions/`                |
| 6    | Add Forgot Password page + OTP verify page                   | `src/pages/`                         |
| 7    | Add first-login redirect guard in DashboardLayout            | `src/components/DashboardLayout.tsx` |
| 8    | Add "Reset Password" action on admin member detail panel     | Admin frontend                       |
| 9    | Create `admin-reset-password` Edge Function                  | `supabase/functions/`                |

---

## 9. Security Notes

- Temp passwords are never stored in plaintext — only in the Supabase auth layer (bcrypt hashed)
- `temp_password_sent_at` is just a timestamp for audit — not the password itself
- OTPs expire in 10 minutes and are single-use
- Admin reset requires the admin to be authenticated with the `admin` role (RLS)
- All Edge Functions validate the calling user's JWT before accepting requests
- Phone numbers are treated as PII — never log them in plaintext in function logs
