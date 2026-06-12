# SendGrid Newsletter / Mailing List Sync — Implementation Audit

**Date:** 2026-06-01  
**Status:** ✅ Implemented — requires `SENDGRID_API_KEY` secret to activate  
**Corresponds to:** `TODO_REMAINING.md` → Mobilization & Communication → Newsletter / Mailing List Sync

---

## What Was Built

Three pieces that together keep a SendGrid marketing contacts list in sync with the member database:

1. **`sync-sendgrid-contact`** — Supabase Edge Function: upserts a single member contact
2. **`sync-sendgrid-bulk`** — Supabase Edge Function: batch-syncs all members (admin-triggered)
3. **Auto-sync hook in `notify-leads`** — every new verified member is synced on registration
4. **Admin UI** — "Sync SendGrid" button on the Member Directory header with result toast

---

## Architecture

```
Member registers
  └── notify-leads (edge fn)
        ├── sends welcome email (existing)
        └── fires sync-sendgrid-contact (new, fire-and-forget)
              └── PUT /v3/marketing/contacts  →  SendGrid

Admin clicks "Sync SendGrid"
  └── Members.tsx
        └── supabase.functions.invoke('sync-sendgrid-bulk')
              └── fetches all users with email from DB
              └── batches 1,000 contacts per PUT request
              └── PUT /v3/marketing/contacts  →  SendGrid
              └── returns { total, batches, job_ids }
```

---

## Edge Functions

### `sync-sendgrid-contact`

Upserts a single member contact. Called from `notify-leads` on every new registration.

**Body (JSON):**

```json
{
  "email": "member@example.com",
  "first_name": "Kofi",
  "last_name": "Mensah",
  "reg_no": "TBM-00123",
  "region": "Greater Accra",
  "constituency": "Ayawaso West Wuogon",
  "platform": "GHANA",
  "status": "Active"
}
```

**Response:** `{ "success": true, "job_id": "abc123" }` (SendGrid returns 202 Accepted; job is async)

### `sync-sendgrid-bulk`

Fetches all `users` with a non-null email and syncs them in batches of 1,000.

**Response:** `{ "total": 4200, "batches": 5, "job_ids": ["..."] }`

---

## SendGrid Dashboard Setup (Required Before Activation)

### 1. Get API Key

SendGrid → Settings → API Keys → Create API Key  
Required permissions: **Marketing** → **Full Access**

Set in Supabase Dashboard → Settings → Edge Function Secrets:

```
SENDGRID_API_KEY=SG.xxxxx
```

### 2. Create a Contact List (Optional but Recommended)

SendGrid → Marketing → Contacts → Lists → Create List  
Name it "The Base Movement Members"

Copy the List ID and set:

```
SENDGRID_LIST_ID=<your-list-id>
```

If not set, contacts are added to **All Contacts** (still synced, just not in a named list).

### 3. Create Custom Fields (Required for metadata)

SendGrid → Marketing → Contacts → Custom Fields → Add Custom Field

Create these five fields (all type: **Text**):

| Field Name          | Used For                    |
| ------------------- | --------------------------- |
| `reg_no`            | Member registration number  |
| `region`            | Ghana region                |
| `constituency`      | Constituency                |
| `platform`          | GHANA or DIASPORA           |
| `membership_status` | Active / Approved / Pending |

> ⚠️ SendGrid custom field names must match exactly. If you rename them in SendGrid,
> update `custom_fields` in both `sync-sendgrid-contact/index.ts` and `sync-sendgrid-bulk/index.ts`.

---

## Frontend Integration

**`src/pages/admin/Members.tsx`**

- Added `handleSyncSendGrid()` — calls `sync-sendgrid-bulk` via `supabase.functions.invoke()`
- Added `isSyncingSendGrid` and `syncResult` state
- Inline result banner below header (green for success, red for error)

**`src/pages/admin/members/MembersHeader.tsx`**

- New "Sync SendGrid" button (outline style, disabled while syncing or when list is empty)

---

## Auto-Sync on Registration

`notify-leads/index.ts` now calls `sync-sendgrid-contact` after sending the welcome email.
The call is fire-and-forget (`fetch()` without `await`) — it never blocks the registration flow
or affects the welcome email delivery.

---

## Security Notes

- `SENDGRID_API_KEY` lives only in Supabase Edge Function secrets — never in the frontend
- `sync-sendgrid-bulk` is only callable from the admin panel (inherits `AdminLayout` auth guard)
  and requires a valid Supabase session token
- Custom fields expose region/constituency — no PII beyond what's already in the DB

---

## Deployment

```bash
# Deploy both new functions
supabase functions deploy sync-sendgrid-contact
supabase functions deploy sync-sendgrid-bulk

# Re-deploy notify-leads (updated to include contact sync)
supabase functions deploy notify-leads

# Set secrets
supabase secrets set SENDGRID_API_KEY=SG.xxxxx
supabase secrets set SENDGRID_LIST_ID=<your-list-id>   # optional
```

---

## Remaining / Future

- [ ] Run initial bulk sync from admin panel after deploying to populate the list
- [ ] Consider a nightly `pg_cron` job that calls `sync-sendgrid-bulk` to catch any drift
- [ ] Consider syncing `status` changes (member approved / suspended) as custom field updates
