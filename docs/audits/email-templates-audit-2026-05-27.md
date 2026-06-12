# Email Templates Audit — 2026-05-27

**Scope:** Transactional email templates and Supabase Edge Functions  
**Status:** Templates implemented; Resend integration ready — awaiting `RESEND_API_KEY` ✅

---

## Design Kit Reference

Source: `docs/design-system-handoff/.../ui_kits/emails/index.html`

Four templates defined:

| #   | Template                      | Trigger                                    |
| --- | ----------------------------- | ------------------------------------------ |
| 01  | Welcome — new verified member | Member registration verified               |
| 02  | Donation receipt              | Donation approved by admin                 |
| 03  | Movement broadcast            | Admin sends Urgent priority broadcast      |
| 04  | Poll closing notification     | Manual / scheduled, 24h before poll closes |

---

## Implementation

### Shared template module

**`supabase/functions/_shared/email-templates.ts`**

Single TypeScript module with four typed functions. All templates are plain HTML string literals — no React, no JSX — safe for email clients. Inline styles only. Fonts: Work Sans (body) + Public Sans (headings, meta, UI) via Google Fonts `<link>`.

```ts
import {
  welcomeEmail,
  donationReceiptEmail,
  broadcastEmail,
  pollClosingEmail,
} from '../_shared/email-templates.ts'
```

#### Common structure

Every template shares:

- `SHELL_OPEN` / `SHELL_CLOSE` — `<html>` wrapper, `background: #f4f4f4`, `max-width: 600px`
- `TOP_BAR` — 5px Red → Gold → Green gradient strip
- `emailHeader(tag)` — dark header bar with "B" logo + brand name + tag label
- `emailFooter(lines)` — light footer with gradient bar + unsubscribe links
- `ctaButton(label, url, color?)` — block-level CTA anchor, defaults to `#006B3F` (green)

#### `welcomeEmail(d: WelcomeEmailData): string`

```ts
interface WelcomeEmailData {
  name: string // first name, e.g. "Kwesi"
  regNo: string // e.g. "GH-001847"
  chapter: string // e.g. "Lapaz 04"
  dashboardUrl: string
  cardDownloadUrl: string
  totalMembers?: string // defaults to "355,212"
}
```

Content: 3-stat row (reg no / Verified / chapter) → green dashboard CTA → 3 numbered action items → gold "Download membership card" CTA.

#### `donationReceiptEmail(d: DonationReceiptEmailData): string`

```ts
interface DonationReceiptEmailData {
  name: string
  amount: string // e.g. "₵50.00"
  method: string // e.g. "MTN MoMo · +233 24 ••• 8890"
  reference: string // e.g. "TBM-2026-00847"
  date: string
  frequency?: string // defaults to "One-time"
  monthlyUrl: string
  receiptPdfUrl?: string // shows "Download PDF receipt" button if provided
  impactNote?: string // sentence about what the donation funds
}
```

Content: 7-row receipt table (donor / amount / method / date / frequency / reference / status) → green total box → green monthly CTA → optional PDF button.

#### `broadcastEmail(d: BroadcastEmailData): string`

```ts
interface BroadcastEmailData {
  subject: string
  preheader: string
  greeting?: string // defaults to "Patriots —"
  body: string // HTML allowed (e.g. "<p>...</p>")
  region?: string // gold pill label
  heroText?: string // ghost watermark in hero image area
  heroColor?: string // hero gradient (CSS value)
  stats?: Array<{ value: string; label: string; color?: string }>
  ctaLabel: string
  ctaUrl: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  secondaryCtaColor?: string // defaults to #CE1126 (red)
}
```

Content: region + "Field report" pills → body HTML → optional 3-stat row → green primary CTA → optional red secondary CTA.

#### `pollClosingEmail(d: PollClosingEmailData): string`

```ts
interface PollClosingEmailData {
  name: string // first name
  pollTitle: string
  preheader: string
  region: string
  voteCount: number
  voteTarget: number
  hoursRemaining: number
  options: Array<{ label: string; percent: number; leading?: boolean }>
  voteUrl: string
  resultNote?: string
}
```

Content: personalized "X hours remaining" heading → poll options with inline progress bars (leading option highlighted green) → tri-color progress bar → vote count/target caption → gold "Cast my vote now" CTA.

---

## Edge Functions

### Updated functions

| Function               | Change                                   | Sends                                    |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| `notify-leads`         | Uses `welcomeEmail()`                    | Welcome email to new verified member     |
| `broadcast-dispatcher` | Uses `broadcastEmail()`, batches 50/call | Broadcast to region/constituency members |

### New functions

| Function                 | Trigger                                     | Sends                                       |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| `send-donation-receipt`  | Called from `adminService.verifyDonation()` | Donation receipt to member email            |
| `send-poll-notification` | Manual / cron                               | Poll closing notification to region members |

### `send-donation-receipt`

Receives `{ donationId }`. Joins `donations` + `users(email)` server-side, formats the amount/date, builds the receipt HTML, sends via Resend. No email returned from the donations table — the join to `users` is required.

Wired in `src/services/adminService.ts` → `verifyDonation()`:

```ts
if (status === 'Verified') {
  supabase.functions.invoke('send-donation-receipt', { body: { donationId } }).catch(() => {
    // Fire-and-forget — receipt failure must not block the verification response
  })
}
```

The `.catch(() => {})` is intentional: receipt delivery failure must never surface as a verification error to the admin.

### `send-poll-notification`

Receives `{ pollId, targetRegion? }`. Fetches poll data, member list for the poll's region, sends personalised HTML to each member. Batches are sent one-by-one (Resend's bulk send costs more; per-member personalisation is required).

Intended invocation: call from a Supabase cron job 24 hours before `end_date`, or manually from the admin panel via `supabase.functions.invoke('send-poll-notification', { body: { pollId } })`.

---

## Graceful degradation

All functions check for `RESEND_API_KEY` before any `fetch` call. If the key is absent:

- Functions log what _would_ be sent to console
- Functions return `{ success: true }` — no error thrown
- The verification/broadcast flow is unaffected

This means the functions are safe to deploy before the email provider is configured.

---

## Remaining work

See `resend-integration-guide-2026-05-27.md` for activation steps.

- [ ] Add `RESEND_API_KEY` to Supabase secrets
- [ ] Verify `from:` domain (`thebasemovement.com`) in Resend dashboard
- [ ] Deploy all 4 functions (`notify-leads`, `broadcast-dispatcher`, `send-donation-receipt`, `send-poll-notification`)
- [ ] (Optional) Add Supabase cron job to trigger `send-poll-notification` 24h before poll close
- [ ] (Optional) Add PDF receipt generation + upload to Storage + pass `receiptPdfUrl` to `donationReceiptEmail`
