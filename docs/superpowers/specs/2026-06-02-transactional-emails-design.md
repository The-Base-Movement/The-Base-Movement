# Transactional Emails Design

**Goal:** Wire up all five branded email templates so every key member lifecycle event triggers a real email via SendGrid.

**Architecture:** Extend the existing per-function pattern — one edge function per email type, all sharing `_shared/email-templates.ts`. Fix two cross-cutting issues (Outlook header layout, wrong sender address) in the shared file and existing functions. Add one new edge function (`send-welcome-email`), one new scheduler function (`poll-closing-scheduler`), one DB migration, and one daily cron.

**Tech Stack:** Supabase Edge Functions (Deno), SendGrid v3 `/mail/send`, `_shared/email-templates.ts`, pg_cron (Supabase Dashboard)

---

## Current State

| Email            | Template                     | Edge function                   | Called from app                    |
| ---------------- | ---------------------------- | ------------------------------- | ---------------------------------- |
| Welcome          | ✅ `welcomeEmail()`          | ❌ missing                      | ❌                                 |
| Donation receipt | ✅ `donationReceiptEmail()`  | ✅ `send-donation-receipt`      | ✅ `adminService.verifyDonation()` |
| Broadcast        | ✅ `broadcastEmail()`        | ✅ `broadcast-dispatcher`       | ✅ `tacticalService`               |
| Poll closing     | ✅ `pollClosingEmail()`      | ✅ `send-poll-notification`     | ❌ manual only                     |
| CSV import       | ✅ `csvImportWelcomeEmail()` | ✅ `create-csv-member-accounts` | ✅ bulk import flow                |

**Cross-cutting issues in existing functions:**

1. `emailHeader()` in `_shared/email-templates.ts` uses `display:flex` — invisible in Outlook Win32.
2. All existing functions send `from: { email: 'brastyphler17@gmail.com' }` — must use the verified SendGrid domain `noreply@thebasemovement.creativeutil.com`.

---

## Work Items

### 1. Fix `_shared/email-templates.ts` — Outlook header layout

Replace the `display:flex` div in `emailHeader()` with a 2-cell `<table>` layout. This fix propagates automatically to donation receipt, broadcast, poll closing, and CSV import emails since they all import from this file.

**Before:**

```html
<div
  style="background:#181d19;padding:20px 28px;display:flex;align-items:center;justify-content:space-between"
>
  <div style="display:flex;align-items:center;gap:10px">
    <div style="width:28px;height:28px;...">B</div>
    <span>The Base Movement</span>
  </div>
  <span>${tag}</span>
</div>
```

**After:** 2-cell `<table>` with `role="presentation"`, `border="0"`, `cellpadding="0"`, `cellspacing="0"`. Left cell: logo block + name. Right cell: tag label, `text-align:right`. Same visual output; Outlook-safe.

### 2. Fix sender address in three existing functions

Change `from.email` from `brastyphler17@gmail.com` to `noreply@thebasemovement.creativeutil.com` in:

- `supabase/functions/send-donation-receipt/index.ts`
- `supabase/functions/send-poll-notification/index.ts`
- `supabase/functions/broadcast-dispatcher/index.ts`

Name stays `'The Base Movement'` in all cases.

### 3. New: `send-welcome-email` edge function

**File:** `supabase/functions/send-welcome-email/index.ts`

**`verify_jwt: false`** — called server-side by `adminService` with service role key.

**Input:** `POST { userId: string }`

**Logic:**

1. Fetch `full_name, email, registration_number, chapter` from `users` where `id = userId`.
2. If `email` is null or empty, log a warning and return `{ skipped: true }` — no error.
3. Query `COUNT(*)` of `users` where `status = 'Active'` for the `totalMembers` value.
4. Build HTML with `welcomeEmail({ name, regNo, chapter, dashboardUrl, cardDownloadUrl, totalMembers })`.
   - `name`: first word of `full_name`
   - `dashboardUrl`: `https://nevermind-beta.vercel.app/dashboard`
   - `cardDownloadUrl`: `https://nevermind-beta.vercel.app/dashboard` (same — no dedicated card URL yet)
   - `totalMembers`: formatted with `toLocaleString('en-GB')`
5. POST to SendGrid `/v3/mail/send` with:
   - `from`: `noreply@thebasemovement.creativeutil.com`
   - `subject`: `"Welcome to The Base, ${name} — you're now a verified member"`
6. If `SENDGRID_API_KEY` is not set, log and return `{ skipped: true }` (dev/staging safety).
7. Return `{ sent: true }` on success, `{ error }` with status 500 on failure.

### 4. Wire welcome trigger in `adminService`

**File:** `src/services/adminService.ts`, `verifyMember()` method (~line 486).

Add after the existing Discord notify and audit log calls, inside `if (success)`:

```ts
if (approve) {
  supabase.functions.invoke('send-welcome-email', { body: { userId: id } }).catch(() => {
    // Fire-and-forget — email failure must not block approval
  })
}
```

### 5. DB migration — `closing_notified` column on `polls`

Add `closing_notified boolean NOT NULL DEFAULT false` to the `polls` table.

```sql
ALTER TABLE public.polls
  ADD COLUMN IF NOT EXISTS closing_notified boolean NOT NULL DEFAULT false;
```

This flag prevents the poll-closing-scheduler from sending duplicate notifications if the cron fires multiple times in a day.

### 6. New: `poll-closing-scheduler` edge function

**File:** `supabase/functions/poll-closing-scheduler/index.ts`

**`verify_jwt: false`** — invoked by Supabase cron with service role key.

**Logic:**

1. Query polls where `status = 'Active'` AND `end_date` between `now()` and `now() + interval '24 hours'` AND `closing_notified = false`.
2. If none found, return `{ dispatched: 0 }`.
3. Mark matching polls `closing_notified = true` optimistically (prevents double-send on concurrent runs).
4. For each poll, `fetch()` POST to `send-poll-notification` edge function with `{ pollId: poll.id }` and service role key in `Authorization` header.
5. On per-poll failure, log the error (do not revert `closing_notified` — a double-send is better than a missing send).
6. Return `{ dispatched: N, results: [...] }`.

### 7. Daily cron — Supabase Dashboard

Manual step after deployment:

- Dashboard → Database → Cron Jobs → Create
- **Name:** `poll-closing-scheduler`
- **Schedule:** `0 8 * * *` (08:00 GMT daily)
- **Type:** Supabase Edge Function
- **Function:** `poll-closing-scheduler`
- **Method:** POST
- **Timeout:** 5000ms

---

## Error Handling

| Scenario                         | Behaviour                                    |
| -------------------------------- | -------------------------------------------- |
| Member has no email              | Skip silently, return `{ skipped: true }`    |
| `SENDGRID_API_KEY` not set       | Skip silently, log warning — never 500       |
| SendGrid returns non-202         | Log error, return 500 so caller knows        |
| Poll scheduler: per-poll failure | Log, continue to next poll                   |
| Welcome email: SendGrid failure  | Fire-and-forget — approval already succeeded |

---

## Deployment Order

1. Apply DB migration (`closing_notified` column)
2. Update `_shared/email-templates.ts`
3. Deploy updated `send-donation-receipt`, `send-poll-notification`, `broadcast-dispatcher`
4. Deploy new `send-welcome-email`
5. Deploy new `poll-closing-scheduler`
6. Update `adminService.ts` and push frontend
7. Add daily cron in Supabase Dashboard (manual)

---

## Out of Scope

- Password reset / magic link branding — managed in Supabase Dashboard → Auth → Email Templates
- Rejection email when admin declines a member — not requested
- Dedicated membership card download URL — `cardDownloadUrl` links to dashboard for now
- Unsubscribe links on transactional emails — transactional emails are not marketing; opt-out does not apply
