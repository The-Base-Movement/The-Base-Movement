# Newsletter Feature — Implementation Audit

**Date:** 2026-06-01
**Status:** ✅ Fully implemented and deployed — requires `SENDGRID_API_KEY` secret to activate live sends
**Edge function:** `send-newsletter` (v6)
**Corresponds to:** Admin panel → Communication → Newsletter (`/admin/newsletter`)

---

## What Was Built

An end-to-end admin newsletter tool that lets authorised staff compose richly-formatted
emails, target one or more audience segments (all members, region, constituency bulk-select,
chapter bulk-select, admin role), preview recipient count before sending, deliver via
SendGrid in batches of 1,000, and review/manage send history — with full delete and
resend capability.

---

## Architecture

```
Admin (Newsletter page)
  └── ComposePanel
        ├── Slot-based audience builder
        │     ├── SimpleSlot     (all / region / chapter / role)
        │     ├── ConstituencySlot  (region filter + search + bulk checkbox)
        │     └── ChapterSlot       (search + bulk checkbox)
        ├── Recipient count preview (batched DB queries)
        └── TinyMCE rich-text editor
              │
              ▼ newsletterService.createAndSend()
                    ├── upsert newsletters row (creates or replaces on id conflict)
                    └── invoke send-newsletter edge function
                              ├── resolve all audience filters → email Set (deduped)
                              │     ├── constituency filters → single IN(...) query
                              │     ├── chapter filters     → single IN(...) query
                              │     └── other filters       → one query each
                              ├── wrap body_html in broadcastEmail() template
                              │     (logo, mobile @media, branded header/footer)
                              └── POST /v3/mail/send batches of 1,000 → SendGrid
                                    └── update newsletters row
                                          (recipient_count, status, sent_at)

HistoryPanel
  ├── Searchable table (Date / Subject / Audience / Recipients / Status)
  ├── Row click → full-screen iframe preview
  ├── Resend failed (overwrites same row via upsert)
  └── Bulk delete failed (SUPER_ADMIN / FOUNDER only)
```

---

## Database

### `newsletters` table

Applied via Supabase MCP migration.

| Column             | Type          | Notes                                                            |
| ------------------ | ------------- | ---------------------------------------------------------------- |
| `id`               | `uuid`        | Primary key, set by client (`crypto.randomUUID()`)               |
| `subject`          | `text`        | Email subject line                                               |
| `body_html`        | `text`        | Raw HTML from TinyMCE editor                                     |
| `audience_type`    | `text`        | `all` / `region` / `constituency` / `chapter` / `role` / `multi` |
| `audience_value`   | `text`        | Single target value (null for `all` and `multi`)                 |
| `audience_filters` | `jsonb`       | Full filter array — source of truth for multi-audience           |
| `recipient_count`  | `integer`     | Populated by edge function after send                            |
| `status`           | `text`        | `sent` or `failed`                                               |
| `error_message`    | `text`        | Populated on SendGrid failure; cleared on resend                 |
| `sent_by`          | `uuid`        | FK → auth.users (nullable)                                       |
| `sent_at`          | `timestamptz` | Set by edge function on completion                               |
| `created_at`       | `timestamptz` | Auto-filled by Supabase                                          |

### RLS

- All operations (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) restricted to authenticated
  admins only. Public and anonymous roles have no access.
- Delete is further restricted in the UI to `SUPER_ADMIN` and `FOUNDER` roles.

### Reference tables used (read-only)

| Table                  | Rows | Purpose                                      |
| ---------------------- | ---- | -------------------------------------------- |
| `ghana_regions`        | 16   | All Ghana regions — populates region picker  |
| `ghana_constituencies` | 270  | All constituencies joined to `ghana_regions` |
| `chapters`             | —    | Active chapters — populates chapter picker   |

> **Critical:** audience option pickers query reference tables, **not** `users`. This
> ensures all 16 regions and 270 constituencies are always available regardless of how
> many members are currently registered.

---

## Service Layer (`src/services/newsletterService.ts`)

### Types

```ts
type AudienceType = 'all' | 'region' | 'constituency' | 'chapter' | 'role' | 'multi'

interface AudienceFilter {
  type: Exclude<AudienceType, 'multi'>
  value: string | null
}

interface Newsletter {
  id
  subject
  body_html
  audience_type
  audience_value
  audience_filters
  recipient_count
  status
  error_message
  sent_by
  sent_at
  created_at
}

interface SendNewsletterPayload {
  newsletter_id
  subject
  body_html
  audience_type
  audience_value
  audience_filters
}
```

### Pure helpers (unit-tested)

| Function                               | Returns                                  |
| -------------------------------------- | ---------------------------------------- |
| `buildAudienceLabel(type, value)`      | Human-readable label for a single filter |
| `buildAudienceFiltersLabel(filters[])` | Joined label for multi-filter arrays     |
| `formatRecipientCount(n)`              | `"1 recipient"` / `"N recipients"`       |

### Service methods

| Method                                        | Description                                                                                   |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `getNewsletters()`                            | All rows ordered by `sent_at` desc                                                            |
| `getAudienceOptions(type)`                    | Options from reference tables (`ghana_regions`, `ghana_constituencies`, `chapters`, `admins`) |
| `getRegionsWithConstituencies()`              | Full `{ regions, byRegion, allConstituencies }` map built from FK join                        |
| `getRecipientCount(type, value)`              | Single-filter member count from `users`                                                       |
| `getRecipientCountForConstituencies(names[])` | Batched `WHERE constituency IN (...)` count                                                   |
| `getRecipientCountForChapters(names[])`       | Batched `WHERE chapter IN (...)` count                                                        |
| `deleteNewsletters(ids[])`                    | Bulk delete — restricted to SUPER_ADMIN/FOUNDER in UI                                         |
| `createAndSend(payload)`                      | Upserts newsletters row + invokes edge function                                               |

### Upsert behaviour in `createAndSend`

```ts
supabase.from('newsletters').upsert({ id, ..., status: 'sent', error_message: null },
                                    { onConflict: 'id' })
```

Using `upsert` (not `insert`) means resending a failed newsletter updates the existing
row in-place — the failed record disappears from the UI after a successful resend.

---

## ComposePanel (`src/pages/admin/newsletter/ComposePanel.tsx`)

### Slot system

The audience builder uses a slot abstraction rather than a flat filter array, allowing
mixed audience types in a single compose session:

```
SimpleSlot     { type: 'simple'; filter: AudienceFilter }
ConstituencySlot { type: 'constituency'; regionFilter; search; selected: string[] }
ChapterSlot    { type: 'chapter'; search; selected: string[] }

type FilterSlot = SimpleSlot | ConstituencySlot | ChapterSlot
```

`deriveFilters(slots)` flattens all slots into a plain `AudienceFilter[]` for the
API payload. A ConstituencySlot with 5 selected constituencies produces 5 individual
`{ type: 'constituency', value: X }` filters; same pattern for chapters.

### Reference data pre-fetch

On mount, ComposePanel fires three parallel requests and caches the results for the
session lifetime:

```ts
Promise.all([
  newsletterService.getAudienceOptions('region'), // → allRegions[]
  newsletterService.getRegionsWithConstituencies(), // → regionsData
  newsletterService.getAudienceOptions('chapter'), // → allChapters[]
])
```

`SimpleFilterRow` receives `preloadedOptions` so region rows never trigger a DB call.
`ConstituencySlotRow` and `ChapterSlotRow` receive their lists directly from state —
zero per-row DB calls.

### Recipient count batching

The count preview avoids N+1 queries by grouping by filter type:

```ts
// 1 query for all constituency selections
getRecipientCountForConstituencies(constituencyValues)
// 1 query for all chapter selections
getRecipientCountForChapters(chapterValues)
// 1 query per remaining filter (all, region, role)
otherFilters.map((f) => getRecipientCount(f.type, f.value))
```

Results are summed; the UI notes "(duplicates removed at send time)" when multiple
filters are active.

### UI features

- **SimpleSlot**: `all / by region / by chapter / by role` dropdown with dynamic
  value select
- **ConstituencySlot**: region filter dropdown + search input + 2-column scrollable
  checkbox grid + "Select all / deselect all" for current view + selected pills footer
- **ChapterSlot**: search input + 2-column checkbox grid + selected pills footer (gold
  accent to distinguish from constituency green)
- Adding a constituency or chapter slot automatically removes the "All members" slot
- Send button disabled while sending, when count = 0, or when any slot is incomplete
- `+Add audience`, `+Select constituencies`, `+Select chapters` appear as contextual
  add buttons; each type can only have one slot at a time

---

## HistoryPanel (`src/pages/admin/newsletter/HistoryPanel.tsx`)

| Feature             | Details                                                          |
| ------------------- | ---------------------------------------------------------------- |
| Search              | Client-side filter on subject text                               |
| Row click           | Opens full-screen iframe preview (`sandbox="allow-same-origin"`) |
| Status pills        | `pill-ok` (sent) / `pill-err` (failed)                           |
| Resend              | Button on failed rows and in preview header; upserts same row    |
| Bulk delete         | Checkbox column appears only for SUPER_ADMIN / FOUNDER           |
| Delete checkbox fix | `onClick={e.stopPropagation()}` prevents double-toggle bug       |
| Confirmation modal  | Required before bulk delete; shows count of selected records     |

### Checkbox double-fire fix

Without `onClick={e.stopPropagation()}` on each checkbox, clicking it fires both the
input's `onChange` (toggle on) and the `<td>`'s `onClick` (toggle off), leaving state
unchanged. The stop-propagation ensures only the `onChange` fires.

---

## Edge Function (`supabase/functions/send-newsletter/index.ts`)

**Current version:** v6
**`verify_jwt`:** false (called via `supabase.functions.invoke` with the user's anon key)

### Request payload

```json
{
  "newsletter_id": "uuid",
  "subject": "string",
  "body_html": "string",
  "audience_type": "all|region|constituency|chapter|role|multi",
  "audience_value": "string|null",
  "audience_filters": [{ "type": "...", "value": "..." }]
}
```

### Email resolution

```
audience_filters array
  ├── constituency filters → single WHERE constituency IN (...) query
  ├── chapter filters      → handled per filter via fetchEmailsForFilter
  └── other filters        → one query each via fetchEmailsForFilter
        ├── all  → all users with email
        ├── region / constituency / chapter → WHERE col = value
        └── role → admins WHERE role = value → JOIN users on id
```

All emails are collected into a `Set<string>` for automatic deduplication before
batching.

### SendGrid batching

```ts
const BATCH_SIZE = 1000
for (let i = 0; i < emails.length; i += BATCH_SIZE) {
  // POST /v3/mail/send with personalizations array
  // From: noreply@thebasemovement.creativeutil.com
}
```

On failure, `newsletters.status` is set to `failed` with the SendGrid error text in
`error_message`. Processing stops — already-sent batches are not retried.

### `newsletters` row lifecycle

| Event                 | Row state                                                         |
| --------------------- | ----------------------------------------------------------------- |
| `createAndSend` call  | Upserted with `status: 'sent'`, `error_message: null`             |
| Edge fn: 0 recipients | Updated: `recipient_count: 0`, `status: 'sent'`                   |
| Edge fn: success      | Updated: `recipient_count: N`, `status: 'sent'`, `sent_at: now()` |
| Edge fn: SG error     | Updated: `status: 'failed'`, `error_message: <text>`              |

### Graceful skip

If `SENDGRID_API_KEY` is not set the function returns `{ skipped: true }` with HTTP 200
— no error thrown, no row update. Useful in local/staging environments.

### Email template

The `broadcastEmail()` function produces fully inline HTML with:

- **Logo**: `<img src="https://thebasemovement.creativeutil.com/branding/logo.png">` at
  36px tall (28px on mobile)
- **Mobile `@media` block** in `<head>`:

  ```css
  @media only screen and (max-width: 600px) {
    body {
      padding: 0;
    }
    .ew {
      width: 100%;
    } /* wrapper full-bleed */
    .eh {
      padding: 14px 16px;
    } /* header */
    .hero {
      height: 90px;
    } /* banner (was 140px) */
    .hero-t {
      font-size: 30px;
    } /* watermark text (was 48px) */
    .bd {
      padding: 20px 16px;
    } /* content area */
    .subj {
      font-size: 21px;
    } /* h1 (was 26px) */
    .ft {
      padding: 14px 16px;
    } /* footer */
    .cta {
      padding: 12px 20px;
    } /* button */
    .pills {
      flex-wrap: wrap;
    }
  }
  ```

- Tri-colour brand bar (Red → Gold → Green) at top
- Preheader text in `#f4f4f4` strip above the white card
- "Field report" and optional region pill below the subject
- Footer: unsubscribe link, movement address, triple-pillar accent line

---

## Page (`src/pages/admin/Newsletter.tsx`)

### KPI tiles

| Tile             | Value derived from                          | Bar colour                |
| ---------------- | ------------------------------------------- | ------------------------- |
| Total sent       | `newsletters.length`                        | `--on-surface` (charcoal) |
| Sent this month  | Count where `sent_at` in current month/year | `--primary` (green)       |
| Total recipients | Sum of `recipient_count`                    | `--accent` (gold)         |
| Last sent        | `newsletters[0].sent_at` formatted en-GB    | `--destructive` (red)     |

### Send result banner

Green `✓` / red `✗` banner with close button appears after each send attempt. Cleared
on next send or manually by the user.

---

## Routing & Navigation

```ts
// src/routes.tsx
{ path: '/admin/newsletter', element: <Newsletter /> }  // lazy-loaded
```

```tsx
// AdminLayout.tsx — Communication group
{ path: '/admin/newsletter', icon: 'mail', label: 'Newsletter' }
```

---

## Unit Tests (`src/test/newsletterService.test.ts`)

8 Vitest tests covering the two pure helpers:

| Suite                  | Cases                                        | Status  |
| ---------------------- | -------------------------------------------- | ------- |
| `buildAudienceLabel`   | all, region, constituency, chapter, role (5) | ✅ pass |
| `formatRecipientCount` | 0, 1, many (3)                               | ✅ pass |

Run with: `npm run test`

---

## Required Secrets

| Secret             | Where set                                             | Purpose                         |
| ------------------ | ----------------------------------------------------- | ------------------------------- |
| `SENDGRID_API_KEY` | Supabase Dashboard → Settings → Edge Function Secrets | Authenticate SendGrid API calls |

Auto-injected by Supabase (no manual setup needed):

| Variable                    | Purpose                              |
| --------------------------- | ------------------------------------ |
| `SUPABASE_URL`              | Database connection in edge function |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS to read `users` table   |

```bash
# Set via Supabase CLI
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
```

> ⚠️ Without `SENDGRID_API_KEY`, the edge function returns `{ skipped: true }` — the
> newsletters row is upserted but no email is sent and no error is raised.

---

## SendGrid Requirements

- Sender domain `thebasemovement.creativeutil.com` must be verified in the SendGrid
  dashboard for `noreply@thebasemovement.creativeutil.com` to be accepted.
- The API key must have at minimum **Mail Send** scope.
- Transactional sending is used (not Marketing Campaigns) — no list management overhead.

---

## Deployment

```bash
# Edge function is deployed via Supabase MCP — no CLI needed
# Current version: v6 (deployed 2026-06-01)

# To redeploy manually:
supabase functions deploy send-newsletter

# Verify active version in Supabase Dashboard → Edge Functions → send-newsletter
```

---

## Known Constraints & Future Work

- [ ] **Unsubscribe link** — the footer contains a placeholder `href="#"`. Wire to a
      real unsubscribe endpoint (Supabase function that sets a `newsletter_opt_out`
      flag on the user record) for CAN-SPAM / GDPR compliance.
- [ ] **`sent_by` field** — currently left null. Pass the authenticated admin's user ID
      from the frontend payload to track who sent each newsletter.
- [ ] **Outlook desktop** — `display:flex` in the header is not supported by Outlook
      desktop (Win32). If Outlook reach is required, replace the header layout with an
      HTML `<table>` equivalent.
- [ ] **Resend of already-sent newsletters** — the Resend button is currently only shown
      on `status = 'failed'` rows. A deliberate re-broadcast of a previously sent
      newsletter would require a separate "Duplicate & resend" flow that generates a
      new UUID.
- [ ] **Bounce / delivery tracking** — SendGrid event webhooks can feed delivery status
      back into the `newsletters` table. Currently only the HTTP 202 from the send call
      is checked.
- [ ] **Schedule / draft** — newsletters are sent immediately. A `scheduled_at` column
      and a cron-triggered edge function would enable scheduled sends.
