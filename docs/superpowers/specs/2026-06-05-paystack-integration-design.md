# Paystack Payment Integration — Design Spec

**Date:** 2026-06-05  
**Status:** Approved — ready for implementation  
**Priority:** High  
**Affects:** Donations, Store Checkout, Chapter/Constituency donate buttons, Public header

---

## Overview

Replace the current manual donation (submit → pending → admin verifies receipt) and placeholder store checkout with real Paystack payments. All transactions are settled in GHS regardless of donor location. Every donor gets confirmation on every channel they have (email and/or SMS).

---

## Architecture

```
User fills form → DB record inserted (status: Pending/Unpaid)
       ↓
PaystackButton opens popup (GHS — card, MTN MoMo, AirtelTigo, bank transfer)
       ↓
User pays
       ↓
Two confirmation paths fire simultaneously:

  A. Client popup callback
     → frontend calls verify-payment Edge Function
     → Paystack API confirms transaction
     → DB updated → UI shows success
     → SMS sent (if phone available)

  B. Paystack webhook
     → paystack-webhook Edge Function
     → HMAC-SHA512 signature verified
     → DB updated (idempotent)
     → SMS sent (idempotent — checks if already sent)
```

---

## Environment Variables

### `.env` (client-safe — exposed via vite.config.ts `define` block)

```env
PAYSTACK_PUBLIC_KEY=pk_test_...   # switch to pk_live_ before production launch
```

### Supabase Edge Function secrets (NEVER in `.env` or codebase)

```
PAYSTACK_SECRET_KEY=sk_test_...   # set via Supabase dashboard → Edge Functions → Secrets
```

### `vite.config.ts` — add to `define` block

```ts
'import.meta.env.PAYSTACK_PUBLIC_KEY': JSON.stringify(env.PAYSTACK_PUBLIC_KEY),
```

---

## Database Migrations

### Migration 1: `donations` table

```sql
ALTER TABLE public.donations
  ADD COLUMN paystack_reference text,       -- Paystack transaction ID (e.g. T450938291)
  ADD COLUMN constituency text;             -- e.g. "Ablekuma North" (for constituency-context donations)
-- donations.chapter already exists from prior migration
-- donations.reference stays as internal short-ref fallback
```

### Migration 2: `store_orders` table

```sql
ALTER TABLE public.store_orders
  ADD COLUMN paystack_reference text,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded'));
```

---

## New Components & Files

### `src/components/payment/PaystackButton.tsx`

Reusable payment button. Used everywhere a payment is triggered.

**Props:**

```ts
interface PaystackButtonProps {
  amount: number // GHS — multiplied ×100 internally (Paystack uses pesewas)
  name: string
  phone: string
  email?: string // optional — resolved per email resolution logic below
  reference: string // our DB record ID (donation or order UUID)
  metadata?: {
    donationId?: string
    orderId?: string
    memberId?: string
    context?: {
      type: 'chapter' | 'constituency'
      name: string // e.g. "Ablekuma North Chapter"
      id: string
    }
  }
  label?: string // button text — defaults to "Pay GHS {amount}"
  onSuccess: (paystackRef: string, channel: string) => void
  onClose?: () => void
  disabled?: boolean
}
```

**Email resolution (in order of priority):**

1. Explicit `email` prop passed by parent (logged-in member's account email)
2. No email → use `donations@thebasemovement.com` (movement catches Paystack receipts)

**Confirmation channels (handled by Edge Function after payment):**
| Donor has email | Donor has phone | Receives |
|---|---|---|
| ✓ | — | Paystack email receipt |
| — | ✓ | SMS via Africa's Talking |
| ✓ | ✓ | Both |

**Behaviour:**

- Renders `.btn .btn-primary` (design system compliant, no shadcn)
- On click → opens Paystack popup (all GHS channels enabled)
- Shows spinner while popup initialises
- Popup success → fires `onSuccess(paystackRef, channel)`
- Popup closed without paying → fires `onClose()`, no DB change

### `src/components/payment/DonateModal.tsx`

Lightweight modal for donate buttons outside the main `/donate` page (header, chapter pages, constituency pages). Contains a simplified form (amount, name, phone, optional email) with context pre-filled. Uses `PaystackButton` internally.

**Props:**

```ts
interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
  context?: {
    type: 'chapter' | 'constituency'
    name: string
    id: string
  }
}
```

---

## Edge Functions

### `supabase/functions/verify-payment/index.ts`

Called by the client immediately after Paystack popup closes with success.

**Request:** `POST` with Supabase auth header

```json
{
  "reference": "uuid-of-donation-or-order",
  "paystackRef": "T450938291",
  "type": "donation" | "order"
}
```

**Steps:**

1. Authenticate caller (valid Supabase session or service role)
2. `GET https://api.paystack.co/transaction/verify/{paystackRef}` using `PAYSTACK_SECRET_KEY`
3. Assert `data.status === 'success'` and `data.amount / 100 === expected amount`
4. Update DB:
   - `donation`: `status = 'Verified'`, `paystack_reference = paystackRef`, `payment_method = data.channel`
   - `order`: `payment_status = 'Paid'`, `status = 'Processing'`, `paystack_reference = paystackRef`
5. Send confirmations:
   - Phone present → Africa's Talking SMS: _"The Base Movement: GHS X payment confirmed. Ref: {paystackRef}. Thank you!"_
   - Email present (and not movement fallback email) → Paystack sends receipt automatically if receipt emails are enabled in Paystack dashboard settings (Settings → Preferences → Notifications)
6. Return `{ success: true }`

### `supabase/functions/paystack-webhook/index.ts`

Called by Paystack servers on `charge.success`.

**Steps:**

1. Read raw request body
2. Compute HMAC-SHA512 of body using `PAYSTACK_SECRET_KEY`
3. Compare with `x-paystack-signature` header → reject with 401 if mismatch
4. Parse event: only process `charge.success`
5. Extract `reference` from `data.metadata` (our DB record ID)
6. Same DB update as `verify-payment` (idempotent — uses `UPDATE ... WHERE paystack_reference IS NULL` to avoid double-processing)
7. Same SMS logic (idempotent)
8. Return `200 OK` to Paystack

**Webhook URL to register in Paystack dashboard:**

```
https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/paystack-webhook
```

---

## Page Changes

### `src/pages/Donate.tsx`

- Step 4 (manual receipt upload) **removed**
- Step 3 now ends with `PaystackButton` instead of a "Submit" button
- Flow: form filled → `PaystackButton` clicked → popup → `onSuccess` callback:
  1. Call `verify-payment` Edge Function
  2. On success → show existing `DonateSuccessPanel`
- Donor email resolved from auth session if logged in, otherwise field in form (optional)

### `src/pages/Checkout.tsx`

- "Complete Purchase" button replaced by `PaystackButton`
- Order row inserted before popup opens (status: `Pending`, payment_status: `Unpaid`)
- `onSuccess`:
  1. Call `verify-payment` Edge Function
  2. On success → navigate to `/store/summary` as before
- On popup close without paying → set order `status = 'Cancelled'`

### `src/pages/ChapterDetails.tsx` + `src/pages/ConstituencyDetails.tsx`

- Existing donate button opens `DonateModal` with context pre-filled
- No page navigation

### Public header donate button

- Already links to `/donate` — no change needed; the page itself now has Paystack wired

---

## Receipt & Notification Summary

| Event                   | Email donor                                         | Phone-only donor         |
| ----------------------- | --------------------------------------------------- | ------------------------ |
| Payment success         | Paystack receipt to their email                     | SMS via Africa's Talking |
| Both channels           | Paystack email + SMS                                | —                        |
| Movement fallback email | Paystack receipt to `donations@thebasemovement.com` | —                        |

---

## Dependency

```bash
npm install react-paystack
```

---

## What You Must Do Manually (After Implementation)

### Before testing

- [ ] **Add `PAYSTACK_SECRET_KEY` to Supabase Edge Function secrets**
  - Supabase dashboard → Edge Functions → Manage secrets → add `PAYSTACK_SECRET_KEY=sk_test_...`
- [ ] **Add `PAYSTACK_PUBLIC_KEY` to Vercel environment variables**
  - Vercel dashboard → Project → Settings → Environment Variables → add `PAYSTACK_PUBLIC_KEY=pk_test_...`
- [ ] **Add `PAYSTACK_PUBLIC_KEY` to local `.env`** _(already done)_

### In Paystack dashboard (test environment)

- [ ] **Register webhook URL:**
      `https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/paystack-webhook`
  - Paystack dashboard → Settings → API Keys & Webhooks → Webhook URL
  - Enable event: `charge.success`
- [ ] **Set `donations@thebasemovement.com`** as a verified sender email in Paystack (Settings → Preferences → Business Information)

### Before going live (switching to production)

- [ ] Complete Paystack Ghana compliance form (business registration, BVN/TIN, etc.)
- [ ] Retrieve live API keys: `pk_live_...` and `sk_live_...`
- [ ] Replace test keys in Vercel env vars and Supabase secrets
- [ ] Re-register webhook URL with live keys (same URL, new secret for signature verification)
- [ ] Test a real GHS 1 donation end-to-end before announcing
- [ ] Confirm `donations@thebasemovement.com` email inbox is monitored

### Electoral compliance (Iron Law #7)

- [ ] Confirm donation limits/disclosure requirements with a Ghanaian legal contact before going live
- [ ] Document the donor record retention policy

---

## Files Created / Modified

| File                                                | Action                                             |
| --------------------------------------------------- | -------------------------------------------------- |
| `src/components/payment/PaystackButton.tsx`         | New                                                |
| `src/components/payment/DonateModal.tsx`            | New                                                |
| `supabase/functions/verify-payment/index.ts`        | New                                                |
| `supabase/functions/paystack-webhook/index.ts`      | New                                                |
| `src/pages/Donate.tsx`                              | Modified — remove step 4, add PaystackButton       |
| `src/pages/Checkout.tsx`                            | Modified — replace submit with PaystackButton      |
| `src/pages/ChapterDetails.tsx`                      | Modified — wire DonateModal                        |
| `src/pages/ConstituencyDetails.tsx`                 | Modified — wire DonateModal                        |
| `vite.config.ts`                                    | Modified — add PAYSTACK_PUBLIC_KEY to define block |
| `supabase/migrations/YYYYMMDD_paystack_columns.sql` | New — donations + orders columns                   |
| `.env`                                              | Modified — add PAYSTACK_PUBLIC_KEY                 |
