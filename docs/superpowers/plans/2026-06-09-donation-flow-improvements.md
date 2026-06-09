# Donation Flow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four donation flow problems: popup-in-popup after payment, Hubtel mobile-money OTP on non-Ghana phones, missing receipt generation on verification, and broken "Approve & receipt" button.

**Architecture:** A new `/payment-complete` route acts as the Hubtel `returnUrl`; it posts a message to the opener and closes itself. Receipt generation is consolidated into `send-donation-receipt` (generates HTML → uploads to `receipts` storage bucket → emails). Channel filtering for mobile money runs in the initiation edge function. Admin verification now triggers the receipt function.

**Tech Stack:** React 19 + TypeScript, React Router v7, Supabase Edge Functions (Deno), Supabase Storage, existing `donationReceiptEmail` template pattern in `_shared/email-templates.ts`.

---

## File Map

| File                                                     | Action     | Purpose                                                                                           |
| -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `src/pages/PaymentComplete.tsx`                          | **Create** | Minimal page: reads Hubtel query params, postMessages to opener, closes self                      |
| `src/routes.tsx`                                         | **Modify** | Register `/payment-complete` inside PublicLayout children                                         |
| `src/components/payment/hubtelCheckout.ts`               | **Modify** | Set `returnUrl` to `${origin}/payment-complete`                                                   |
| `src/components/payment/HubtelButton.tsx`                | **Modify** | Add `onPaymentComplete` prop + `message` event listener                                           |
| `supabase/functions/hubtel-initiate-payment/phone.ts`    | **Modify** | Add `isGhanaPhone()` export                                                                       |
| `supabase/functions/hubtel-initiate-payment/index.ts`    | **Modify** | Filter `channels` based on `isGhanaPhone()`                                                       |
| `supabase/functions/_shared/email-templates.ts`          | **Modify** | Add `donationReceiptHtml()` + `DonationReceiptHtmlData` interface                                 |
| `supabase/migrations/20260609000003_receipts_bucket.sql` | **Create** | Create public `receipts` storage bucket with RLS                                                  |
| `supabase/functions/send-donation-receipt/index.ts`      | **Modify** | Generate + upload receipt HTML if `receipt_url` not already set; include `receiptPdfUrl` in email |
| `supabase/functions/hubtel-payment-callback/index.ts`    | **Modify** | After Verified, invoke `send-donation-receipt`                                                    |
| `src/pages/admin/DonationVerification.tsx`               | **Modify** | `handleVerify` calls `send-donation-receipt` after Verified                                       |
| `src/pages/MyDonations.tsx`                              | **Modify** | Add "Download Receipt" button on verified rows with `receiptUrl`                                  |

---

### Task 1: `/payment-complete` page

**Files:**

- Create: `src/pages/PaymentComplete.tsx`

This is the page Hubtel redirects the popup to after payment. It reads Hubtel's query params, sends a `postMessage` to the parent window, then closes itself. If there is no opener (user navigated directly), it shows a fallback message.

- [ ] **Step 1: Create the file**

```tsx
// src/pages/PaymentComplete.tsx
import { useEffect, useState } from 'react'

export default function PaymentComplete() {
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Hubtel appends: ?Status=Success&ClientReference=xxx&Message=...
    const rawStatus = params.get('Status') ?? params.get('status') ?? ''
    const reference =
      params.get('ClientReference') ??
      params.get('clientReference') ??
      params.get('reference') ??
      ''
    const success = ['success', 'successful', 'paid', 'completed'].includes(rawStatus.toLowerCase())

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'hubtel_complete', success, reference },
        window.location.origin
      )
      window.close()
    } else {
      // Popup was blocked or user navigated directly — show fallback
      setClosed(true)
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Public Sans', sans-serif",
        background: 'hsl(var(--background))',
        padding: 24,
        textAlign: 'center',
        gap: 12,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 48, color: 'hsl(var(--primary))' }}
      >
        check_circle
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
        }}
      >
        {closed ? 'Payment received' : 'Completing payment…'}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'hsl(var(--on-surface-muted))',
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        {closed
          ? 'You can close this window and return to The Base Movement.'
          : 'Returning you to the site…'}
      </p>
      {closed && (
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => window.close()}
        >
          Close window
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls src/pages/PaymentComplete.tsx
```

Expected: file exists, no TypeScript errors.

- [ ] **Step 3: Register route in `src/routes.tsx`**

Find the line `const NotFound = lazy(() => import('./pages/NotFound'))` near the top of the lazy imports and add after it:

```ts
const PaymentComplete = lazy(() => import('./pages/PaymentComplete'))
```

Then find `{ path: '/verify/:id', element: <VerifyID /> },` in the PublicLayout children and add after it:

```ts
{ path: '/payment-complete', element: <PaymentComplete /> },
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PaymentComplete.tsx src/routes.tsx
git commit -m "feat: add /payment-complete route for Hubtel popup close"
```

---

### Task 2: Wire `returnUrl` + `postMessage` listener in HubtelButton

**Files:**

- Modify: `src/components/payment/hubtelCheckout.ts`
- Modify: `src/components/payment/HubtelButton.tsx`

The checkout utility sets `returnUrl` to the new `/payment-complete` page. `HubtelButton` gains an `onPaymentComplete` prop and a `message` event listener that fires when the popup posts back.

- [ ] **Step 1: Update `returnUrl` in `hubtelCheckout.ts`**

Find the line:

```ts
returnUrl: request.returnUrl ?? window.location.href,
```

Replace with:

```ts
returnUrl: request.returnUrl ?? `${window.location.origin}/payment-complete`,
```

Find the line:

```ts
cancellationUrl: request.cancellationUrl ?? window.location.href,
```

Replace with:

```ts
cancellationUrl: request.cancellationUrl ?? `${window.location.origin}/payment-complete`,
```

- [ ] **Step 2: Add `onPaymentComplete` prop and message listener to `HubtelButton.tsx`**

In the `HubtelButtonProps` interface, add after `autoOpen?`:

```ts
onPaymentComplete?: (success: boolean, reference: string) => void
```

In the destructured props, add `onPaymentComplete` to the list.

Add this `useEffect` block after the existing `autoOpen` useEffect:

```tsx
useEffect(() => {
  const handler = (e: MessageEvent<{ type?: string; success?: boolean; reference?: string }>) => {
    if (e.origin !== window.location.origin) return
    if (e.data?.type !== 'hubtel_complete') return
    setLoading(false)
    onPaymentComplete?.(e.data.success ?? false, e.data.reference ?? '')
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [onPaymentComplete])
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/payment/hubtelCheckout.ts src/components/payment/HubtelButton.tsx
git commit -m "feat: popup closes after Hubtel payment via postMessage to opener"
```

---

### Task 3: Channel filtering for non-Ghana phones

**Files:**

- Modify: `supabase/functions/hubtel-initiate-payment/phone.ts`
- Modify: `supabase/functions/hubtel-initiate-payment/index.ts`

Diaspora members with non-Ghana numbers see card-only on the Hubtel checkout page, preventing OTP failures on mobile money.

- [ ] **Step 1: Add `isGhanaPhone` to `phone.ts`**

Append to the end of `supabase/functions/hubtel-initiate-payment/phone.ts`:

```ts
/** Returns true if the normalised phone number is a Ghana (+233) number. */
export function isGhanaPhone(normalizedPhone: string): boolean {
  return normalizedPhone.startsWith('+233')
}
```

- [ ] **Step 2: Import and use `isGhanaPhone` in `index.ts`**

Find the import line at the top:

```ts
import { normalizeHubtelPhone } from './phone.ts'
```

Replace with:

```ts
import { normalizeHubtelPhone, isGhanaPhone } from './phone.ts'
```

Find where `normalizeHubtelPhone` is called (inside the Deno.serve handler) and store the result:

```ts
const normalizedPhone = normalizeHubtelPhone(phone)
```

Then find the `hubtelPayload` object and the `channels` line:

```ts
channels: ['mobilemoney', 'card'],
```

Replace with:

```ts
channels: isGhanaPhone(normalizedPhone) ? ['mobilemoney', 'card'] : ['card'],
```

Also update the `customerPhoneNumber` line to use the already-normalized value instead of re-calling:

```ts
customerPhoneNumber: normalizedPhone,
```

- [ ] **Step 3: Verify no other references to `normalizeHubtelPhone(phone)` remain**

```bash
grep -n "normalizeHubtelPhone" supabase/functions/hubtel-initiate-payment/index.ts
```

Expected: only the `const normalizedPhone = ...` line and the `customerPhoneNumber: normalizedPhone` line. No duplicates.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/hubtel-initiate-payment/phone.ts supabase/functions/hubtel-initiate-payment/index.ts
git commit -m "feat: restrict mobile money channel to Ghana phones in Hubtel initiation"
```

---

### Task 4: Receipt HTML template

**Files:**

- Modify: `supabase/functions/_shared/email-templates.ts`

Add a `donationReceiptHtml()` function that generates a self-contained, printable HTML receipt. This is used by `send-donation-receipt` to create the downloadable file stored in Supabase Storage.

- [ ] **Step 1: Append to `email-templates.ts`**

Append the following to the end of `supabase/functions/_shared/email-templates.ts`:

```ts
// ---------------------------------------------------------------------------
// Donation receipt — downloadable HTML (printable, no email shell)
// ---------------------------------------------------------------------------

export interface DonationReceiptHtmlData {
  name: string // "Kwame Mensah"
  amount: string // "₵50.00"
  method: string // "Hubtel" | "Mobile Money" | "Bank Transfer" etc.
  reference: string // internal donation reference
  hubtelReference?: string // Hubtel transaction ID if available
  date: string // "09 Jun 2026 · 14:08 GMT"
}

export function donationReceiptHtml(d: DonationReceiptHtmlData): string {
  const rows = [
    { label: 'Donor', value: d.name },
    { label: 'Amount', value: d.amount },
    { label: 'Payment Method', value: d.method },
    { label: 'Date', value: d.date },
    { label: 'Reference', value: d.reference },
    ...(d.hubtelReference ? [{ label: 'Transaction ID', value: d.hubtelReference }] : []),
    { label: 'Status', value: '✓ Verified', green: true },
  ]

  const rowHtml = rows
    .map(
      (r) =>
        `<div class="row">
          <span class="label">${r.label}</span>
          <span class="value${(r as { green?: boolean }).green ? ' green' : ''}">${r.value}</span>
        </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Donation Receipt – ${d.reference}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Public Sans',Arial,sans-serif;background:#f6fbf4;color:#181d19;padding:40px 20px}
  .receipt{max-width:520px;margin:0 auto;background:#fff;border:1px solid #dfe4dd;border-radius:8px;overflow:hidden}
  .hdr{background:#006B3F;padding:28px 32px;color:#fff}
  .hdr h1{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .hdr p{font-size:12px;opacity:.8;margin-top:4px}
  .body{padding:28px 32px}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px}
  .row:last-child{border-bottom:none}
  .label{color:#6f7a71;font-weight:500}
  .value{font-weight:600;text-align:right}
  .value.green{color:#006B3F}
  .total{background:#f6fbf4;border-radius:4px;padding:14px 16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center}
  .total .tl{font-weight:700;font-size:14px}
  .total .tv{font-size:20px;font-weight:800;color:#006B3F}
  .ftr{padding:16px 32px;border-top:1px solid #dfe4dd;font-size:11px;color:#6f7a71;text-align:center;line-height:1.6}
  @media print{body{background:#fff;padding:0}.receipt{border:none;border-radius:0;max-width:100%}}
</style>
</head>
<body>
<div class="receipt">
  <div class="hdr">
    <h1>Donation Receipt</h1>
    <p>The Base Movement · Official Payment Confirmation</p>
  </div>
  <div class="body">
    ${rowHtml}
    <div class="total">
      <span class="tl">Total Paid</span>
      <span class="tv">${d.amount}</span>
    </div>
  </div>
  <div class="ftr">
    The Base Movement · Accra, Ghana · thebasemovement.com<br/>
    This receipt is valid proof of your contribution.
  </div>
</div>
</body>
</html>`
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/email-templates.ts
git commit -m "feat: add donationReceiptHtml template for downloadable receipt"
```

---

### Task 5: Receipts storage bucket migration

**Files:**

- Create: `supabase/migrations/20260609000003_receipts_bucket.sql`

- [ ] **Step 1: Create migration**

```sql
-- Create public receipts storage bucket.
-- Receipts are addressed by donation UUID (unguessable), so public read is safe.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  524288,  -- 512 KB max per receipt
  ARRAY['text/html']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read (bucket is public but we add explicit policy for clarity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'receipts_public_read'
  ) THEN
    CREATE POLICY "receipts_public_read" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'receipts');
  END IF;
END$$;
```

- [ ] **Step 2: Apply migration to remote**

```bash
supabase db push
```

Expected: migration applied, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260609000003_receipts_bucket.sql
git commit -m "feat: create public receipts storage bucket"
```

---

### Task 6: Update `send-donation-receipt` to generate + store receipt

**Files:**

- Modify: `supabase/functions/send-donation-receipt/index.ts`

`send-donation-receipt` becomes the single entry point for both receipt generation and emailing. It now checks if `receipt_url` is already set. If not, it generates the HTML, uploads to the `receipts` bucket, and updates `donations.receipt_url`. Then it sends the email with the `receiptPdfUrl` included.

- [ ] **Step 1: Replace the full file content**

```ts
// THE BASE: DONATION RECEIPT — generates HTML receipt + emails member
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { donationReceiptEmail, donationReceiptHtml } from '../_shared/email-templates.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { donationId } = (await req.json()) as { donationId: string }
    if (!donationId) throw new Error('donationId is required')

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    interface DonationRow {
      id: string
      full_name: string
      amount: number | string
      payment_method: string | null
      reference: string
      created_at: string
      member_id: string | null
      hubtel_reference: string | null
      receipt_url: string | null
      users: { email: string } | null
    }

    const { data, error: donErr } = await supabaseAdmin
      .from('donations')
      .select(
        'id, full_name, amount, payment_method, reference, created_at, member_id, hubtel_reference, receipt_url, users(email)'
      )
      .eq('id', donationId)
      .single()

    if (donErr || !data) throw new Error(`Donation not found: ${donErr?.message}`)
    const row = data as unknown as DonationRow

    const dateStr =
      new Date(row.created_at).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Accra',
      }) + ' GMT'

    const amountStr = `₵${Number(row.amount).toFixed(2)}`

    // ── 1. Generate + upload receipt HTML if not already stored ──────────────
    let receiptUrl = row.receipt_url ?? null

    if (!receiptUrl) {
      const html = donationReceiptHtml({
        name: row.full_name,
        amount: amountStr,
        method: row.payment_method ?? 'N/A',
        reference: row.reference,
        hubtelReference: row.hubtel_reference ?? undefined,
        date: dateStr,
      })

      const encoder = new TextEncoder()
      const { error: uploadError } = await supabaseAdmin.storage
        .from('receipts')
        .upload(`${donationId}.html`, encoder.encode(html), {
          contentType: 'text/html',
          upsert: true,
        })

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('receipts').getPublicUrl(`${donationId}.html`)

        receiptUrl = publicUrl

        await supabaseAdmin
          .from('donations')
          .update({ receipt_url: publicUrl })
          .eq('id', donationId)
      } else {
        console.error('[RECEIPT] Upload failed:', uploadError.message)
      }
    }

    // ── 2. Send email ─────────────────────────────────────────────────────────
    const memberEmail = row.users?.email
    if (!memberEmail) {
      console.warn('[RECEIPT] No email for member_id', row.member_id, '— skipping email')
      return new Response(JSON.stringify({ success: true, skipped: true, receiptUrl }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const html = donationReceiptEmail({
      name: row.full_name,
      amount: amountStr,
      method: row.payment_method ?? 'N/A',
      reference: row.reference,
      date: dateStr,
      monthlyUrl: 'https://thebasemovement.com/dashboard/donate',
      receiptPdfUrl: receiptUrl ?? undefined,
    })

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    if (sgKey) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: memberEmail }] }],
          from: { email: 'noreply@thebasemovement.com', name: 'The Base Movement' },
          subject: `Your ${amountStr} contribution is confirmed — Receipt ${row.reference}`,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      console.log('[RECEIPT] Email sent to', memberEmail, res.status)
    } else {
      console.warn('[RECEIPT] SENDGRID_API_KEY not set — would send to', memberEmail)
    }

    return new Response(JSON.stringify({ success: true, receiptUrl }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[RECEIPT-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/send-donation-receipt/index.ts
git commit -m "feat: send-donation-receipt generates and stores HTML receipt before emailing"
```

---

### Task 7: Hubtel callback triggers receipt

**Files:**

- Modify: `supabase/functions/hubtel-payment-callback/index.ts`

After a donation is marked Verified by Hubtel, invoke `send-donation-receipt` to generate the receipt and email the member. This is fire-and-forget (non-fatal if it fails).

- [ ] **Step 1: Add receipt invocation after the donation Verified update**

Find this block inside `hubtel-payment-callback/index.ts`:

```ts
const { data: donation, error: donationError } = await supabaseAdmin
  .from('donations')
  .update(donationUpdate)
  .eq('id', reference)
  .select('id')
  .maybeSingle()
```

Replace with:

```ts
const { data: donation, error: donationError } = await supabaseAdmin
  .from('donations')
  .update(donationUpdate)
  .eq('id', reference)
  .select('id')
  .maybeSingle()

// Fire receipt generation + email for successful Hubtel donations (non-fatal)
if (paid && donation) {
  supabaseAdmin.functions
    .invoke('send-donation-receipt', { body: { donationId: reference } })
    .catch((e: unknown) => {
      console.error('[HUBTEL-CALLBACK] Receipt invocation failed:', e)
    })
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/hubtel-payment-callback/index.ts
git commit -m "feat: Hubtel callback triggers receipt generation on verified donation"
```

---

### Task 8: Admin "Approve & receipt" button fix

**Files:**

- Modify: `src/pages/admin/DonationVerification.tsx`

`handleVerify` now invokes `send-donation-receipt` after successfully verifying a donation. For manual payments that have no Hubtel reference, `send-donation-receipt` will generate the receipt itself (see Task 6).

- [ ] **Step 1: Update `handleVerify` in `DonationVerification.tsx`**

Find the existing `handleVerify` function (around line 149):

```ts
const handleVerify = async (donationId: string, name: string, action: 'Verified' | 'Rejected') => {
  setIsVerifying(donationId)
  const success = await adminService.verifyDonation(
    donationId,
    action,
    'Processed via Command Center'
  )
  if (success) {
    toast.success(
      action === 'Verified' ? `${name} — contribution approved.` : `${name} — flagged for review.`
    )
    setSelectedDonation(null)
    fetchData(true)
  } else {
    toast.error('Verification failed. Try again.')
  }
  setIsVerifying(null)
}
```

Replace with:

```ts
const handleVerify = async (donationId: string, name: string, action: 'Verified' | 'Rejected') => {
  setIsVerifying(donationId)
  const success = await adminService.verifyDonation(
    donationId,
    action,
    'Processed via Command Center'
  )
  if (success) {
    toast.success(
      action === 'Verified' ? `${name} — contribution approved.` : `${name} — flagged for review.`
    )
    if (action === 'Verified') {
      // Fire-and-forget: generate receipt + send email. Non-fatal if it fails.
      supabase.functions
        .invoke('send-donation-receipt', { body: { donationId } })
        .catch((err: unknown) => {
          console.error('[Admin] Receipt send failed:', err)
        })
    }
    setSelectedDonation(null)
    fetchData(true)
  } else {
    toast.error('Verification failed. Try again.')
  }
  setIsVerifying(null)
}
```

- [ ] **Step 2: Ensure `supabase` is imported in `DonationVerification.tsx`**

```bash
grep -n "import.*supabase" src/pages/admin/DonationVerification.tsx | head -5
```

If `supabase` is not imported from `@/lib/supabase`, add this import at the top of the file alongside the other imports:

```ts
import { supabase } from '@/lib/supabase'
```

If it's already imported (likely via `adminService`), skip this step.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/DonationVerification.tsx
git commit -m "fix: admin verify now triggers receipt generation and member email"
```

---

### Task 9: Member "Download Receipt" button in MyDonations

**Files:**

- Modify: `src/pages/MyDonations.tsx`

Add a "Download Receipt" link on verified donation rows that have a `receiptUrl`. The link opens the stored HTML receipt in a new tab (the member can then browser-print it to PDF).

- [ ] **Step 1: Add the Receipt column header to the desktop table**

In `MyDonations.tsx`, find the headers array:

```ts
{['Date', 'Campaign', 'Amount', 'Method', 'Reference', 'Status'].map((h) => (
```

Replace with:

```ts
{['Date', 'Campaign', 'Amount', 'Method', 'Reference', 'Status', 'Receipt'].map((h) => (
```

- [ ] **Step 2: Add the Receipt cell after the Status cell in each donation row**

Find the closing `</tr>` tag after the Status `<td>` in the `donations.map((d) => ...)` block and add a new `<td>` before it:

```tsx
<td style={{ padding: '12px 18px' }}>
  {d.status === 'Verified' && d.receiptUrl ? (
    <a
      href={d.receiptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline btn-sm"
      style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        download
      </span>
      Receipt
    </a>
  ) : (
    <span
      style={{
        fontSize: 12,
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {d.status === 'Verified' ? '—' : 'Pending'}
    </span>
  )}
</td>
```

- [ ] **Step 3: Add receipt download to the mobile card view**

Find the mobile card rendering in the same file (the section after `className="mobile-only"`) and add a receipt link inside each card where `d.status === 'Verified' && d.receiptUrl`:

After the Status pill in the mobile view, add:

```tsx
{
  d.status === 'Verified' && d.receiptUrl && (
    <a
      href={d.receiptUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-outline btn-sm"
      style={{ textDecoration: 'none', marginTop: 8, alignSelf: 'flex-start' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        download
      </span>
      Download Receipt
    </a>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/MyDonations.tsx
git commit -m "feat: add Download Receipt button to verified donations in MyDonations"
```

---

### Task 10: Typecheck, build, and deploy edge functions

**Files:** None changed — validation + deployment only.

- [ ] **Step 1: Full typecheck**

```bash
npm run typecheck
```

Expected: 0 errors.

- [ ] **Step 2: Client build**

```bash
npm run build:client
```

Expected: build completes, no errors.

- [ ] **Step 3: Deploy edge functions**

```bash
supabase functions deploy hubtel-initiate-payment
supabase functions deploy hubtel-payment-callback
supabase functions deploy send-donation-receipt
```

Expected: each deploys with `Deployed Function <name>` confirmation.

- [ ] **Step 4: Smoke test checklist**

Manual checks after deployment:

1. Open `/donate`, start a payment — the Hubtel popup should open
2. On completion, the popup should close and the parent page should update
3. Navigate to `/payment-complete` directly — should show the "Payment received / you can close this window" fallback
4. In admin → Donation Verification, approve a pending donation — should see no JS error in console, and `send-donation-receipt` should fire (check Supabase function logs)
5. In member dashboard → My Donations, a verified donation with `receipt_url` should show the Download Receipt button
6. Click Download Receipt — should open the HTML receipt in a new tab
