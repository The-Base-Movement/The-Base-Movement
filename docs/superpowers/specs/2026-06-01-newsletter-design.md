# Newsletter Feature — Design Spec

**Date:** 2026-06-01
**Status:** Approved — ready for implementation

---

## Goal

Build an admin-facing Newsletter page that lets staff compose, target, and send branded
email newsletters to members and/or staff roles via SendGrid, with a persistent history
log of all sent campaigns.

---

## Architecture

```
Admin fills compose form (subject + audience + TinyMCE body)
  └── clicks Send
        └── supabase.functions.invoke('send-newsletter', { newsletter_id, subject, body_html, audience_type, audience_value })
              ├── fetches matching emails from users / admins table based on audience filter
              ├── wraps body_html in existing broadcastEmail template (_shared/email-templates.ts)
              ├── sends via SendGrid POST /v3/mail/send in batches of 1,000
              ├── updates newsletters row: recipient_count, status='sent', sent_at
              └── returns { sent, batches }

Admin page layout:
  ├── Header + KPI strip (Total Sent, Sent This Month, Total Recipients)
  ├── Compose panel — subject, audience picker, TinyMCE, Send button with recipient count preview
  └── History panel — searchable table of past newsletters + view-body modal
```

---

## Database

### Migration: `newsletters` table

```sql
CREATE TABLE public.newsletters (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text NOT NULL,
  body_html        text NOT NULL,
  audience_type    text NOT NULL CHECK (audience_type IN ('all','region','constituency','chapter','role')),
  audience_value   text,              -- null when audience_type = 'all'
  recipient_count  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  error_message    text,              -- populated on failure
  sent_by          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sent_at          timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS: admins only
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can insert newsletters"
  ON public.newsletters FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can select newsletters"
  ON public.newsletters FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins can update newsletters"
  ON public.newsletters FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
```

---

## Edge Function: `send-newsletter`

**File:** `supabase/functions/send-newsletter/index.ts`

**Request body:**

```json
{
  "newsletter_id": "uuid",
  "subject": "Movement update — June 2026",
  "body_html": "<p>Hello patriots...</p>",
  "audience_type": "region",
  "audience_value": "Greater Accra"
}
```

**Targeting logic:**

| `audience_type` | DB query                                                            |
| --------------- | ------------------------------------------------------------------- |
| `all`           | `users` where `email` is not null, `deleted_at` is null             |
| `region`        | `users` where `region = audience_value`, `email` not null           |
| `constituency`  | `users` where `constituency = audience_value`, `email` not null     |
| `chapter`       | `users` where `chapter = audience_value`, `email` not null          |
| `role`          | `admins` where `role = audience_value`, joined to `users` for email |

**Send flow:**

1. Insert a row into `newsletters` with `status = 'sent'` (pre-insert, ID passed in from frontend)
2. Fetch matching emails
3. Wrap `body_html` in `broadcastEmail()` template from `_shared/email-templates.ts`
4. Batch send via `POST /v3/mail/send` (1,000 per batch)
5. Update `newsletters` row: set `recipient_count`, `sent_at`
6. On any SendGrid error: set `status = 'failed'`, `error_message`
7. Return `{ sent: number, batches: number }`

**Secrets required:** `SENDGRID_API_KEY` (already set), `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

**Graceful degradation:** If `SENDGRID_API_KEY` not set, returns `{ skipped: true }` without error.

---

## Frontend

### Route

`/admin/newsletter` — lazy-loaded in `src/routes.tsx`

### Nav entry

In `src/components/layouts/AdminLayout.tsx`, under the Communication group:

- Icon: `mail`
- Label: `Newsletter`
- Path: `/admin/newsletter`

### Page: `src/pages/admin/Newsletter.tsx`

**KPI strip (4 tiles):**

- Total newsletters sent
- Sent this month
- Total recipients (all time)
- Last sent (date)

**Compose panel (`src/pages/admin/newsletter/ComposePanel.tsx`):**

- Subject: text input, required
- Audience Type: select — All Members / By Region / By Constituency / By Chapter / By Role
- Audience Value: second select, appears when type ≠ "All", options fetched from DB
  - Region: distinct regions from `users`
  - Constituency: distinct constituencies from `users`
  - Chapter: distinct chapters from `users`
  - Role: distinct roles from `admins`
- Recipient count preview: shown below audience picker ("~42 recipients")
- Body: TinyMCE editor (same config as Blogs.tsx — no image upload needed)
- Send button: disabled while sending or if subject/body empty

**History panel (`src/pages/admin/newsletter/HistoryPanel.tsx`):**

- Search bar (filters by subject)
- Table columns: Date Sent | Subject | Audience | Recipients | Status
- Status pill: `pill-ok` for sent, `pill-err` for failed
- Row click → opens read-only modal with rendered email body preview

### Services

**`src/services/newsletterService.ts`**

- `getNewsletters()` → fetches all rows from `newsletters`, ordered by `sent_at DESC`
- `getAudienceOptions(type)` → fetches distinct values for region/constituency/chapter/role
- `getRecipientCount(type, value)` → count of matching users (for preview)
- `sendNewsletter(payload)` → inserts newsletter row, invokes `send-newsletter` edge function

---

## Design System Compliance

- All styles: inline CSS + CSS variables (no shadcn, no Tailwind)
- Icons: Material Symbols (`mail`, `send`, `history`, `people`)
- Buttons: `.btn .btn-primary` for Send, `.btn .btn-outline` for secondary actions
- Pills: `.pill-ok` / `.pill-err` for status
- Layout: `.main` wrapper, `.kpis` grid, `.panel` cards, `.ph` panel headers
- TinyMCE: reuse existing init config from `src/pages/admin/Blogs.tsx`

---

## Error Handling

- SendGrid failure: `newsletters` row updated with `status='failed'` + `error_message`; admin sees red banner
- Empty audience: validated client-side before send (button stays disabled if recipient count = 0)
- Network error on invoke: caught in frontend, shown as red result banner

---

## Out of Scope (future)

- Draft saving
- Unsubscribe link management
- Email open/click tracking
- Scheduled sends
- Re-send / duplicate a past newsletter
