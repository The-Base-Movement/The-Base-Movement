# Paystack Checkout & Payment Integration Plan

This document outlines the architecture and implementation plan for adding Paystack payment processing alongside our existing Hubtel integration.

---

## 1. Overview

The platform currently processes Ghana Mobile Money and Card payments via **Hubtel**. Adding **Paystack** provides a secondary payment gateway offering:
- **International Card Payments & Apple Pay** (essential for Diaspora members & supporters)
- **Local Mobile Money (MTN, Telecel, AT)**
- **Bank Transfers & USSD Payments**
- **Automated Webhook Reconciliation**

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Client App                         │
│  (DonateModal.tsx / Donate.tsx / Store.tsx / DuesPanel.tsx) │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1. Initiate Checkout
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             paystackService.ts (Client API)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ 2. Call Edge Function
                               ▼
┌─────────────────────────────────────────────────────────────┐
│   Supabase Edge Function: paystack-initiate-payment         │
│  - Verifies amount directly against DB (Server Authoritative)│
│  - Calls Paystack Initialize API                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ 3. Returns authorization_url & reference
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               PaystackPaymentModal.tsx                      │
│  - Renders inline iframe checkout or handles popup          │
│  - Realtime Supabase Postgres channel + 3s fallback poll    │
└──────────────────────────────┬──────────────────────────────┘
                               │ 4. User Completes Payment
                               ▼
┌─────────────────────────────────────────────────────────────┐
│   Supabase Edge Function: paystack-payment-callback          │
│  - Validates x-paystack-signature HMAC SHA512 signature     │
│  - Atomically updates donations / store_orders / dues       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Edge Functions Specification

### A. `paystack-initiate-payment`
- **Path**: `supabase/functions/paystack-initiate-payment/index.ts`
- **Request Body**:
  ```json
  {
    "type": "donation | group_donation | order | monthly_dues",
    "reference": "record_uuid_or_group_id",
    "email": "supporter@example.com",
    "returnUrl": "https://www.thebasemovement.org.gh/donate",
    "cancellationUrl": "https://www.thebasemovement.org.gh/donate"
  }
  ```
- **Security & Authorization**:
  - Rate-limited per IP (`persistent-rate-limit.ts`).
  - Fetches payment amount directly from `public.donations`, `public.store_orders`, or `public.monthly_dues_payments` (client-supplied amount is ignored).
- **Paystack API Request**:
  - Endpoint: `POST https://api.paystack.co/transaction/initialize`
  - Headers: `Authorization: Bearer <PAYSTACK_SECRET_KEY>`
  - Amount: Amount in kobo/pesewas (`amount * 100`)

### B. `paystack-payment-callback` (Webhook)
- **Path**: `supabase/functions/paystack-payment-callback/index.ts`
- **Security**: Verifies `x-paystack-signature` using HMAC SHA512 with `PAYSTACK_SECRET_KEY`.
- **Event Handled**: `charge.success`
- **DB Updates**:
  - `donation` -> `UPDATE donations SET status = 'Verified', verified_at = now() WHERE id = ...`
  - `monthly_dues` -> `UPDATE monthly_dues_payments SET status = 'paid' WHERE id = ...`
  - `order` -> `UPDATE store_orders SET payment_status = 'Paid' WHERE id = ...`

---

## 4. Frontend Component Design

### A. `src/services/paystackService.ts`
- `initiatePayment(params)`: Calls `paystack-initiate-payment` edge function via Supabase client.
- `getCheckoutStatus(referenceId)`: Queries target table as a fallback status check.

### B. `src/components/payment/PaystackPaymentModal.tsx`
- Reuses design system styles matching `HubtelPaymentModal.tsx`.
- Connects to Supabase Realtime channel listening to table updates.
- Runs a 3-second fallback interval poll.

### C. `src/components/payment/DonateModal.tsx` & `src/pages/Donate.tsx`
- Adds a clear Payment Provider Toggle:
  - **Hubtel** (Ghana MoMo & Cards)
  - **Paystack** (Cards, Apple Pay, MoMo)

---

## 5. Required Environment Variables

```env
# Supabase Edge Functions Secrets
PAYSTACK_SECRET_KEY=YOUR_PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY=YOUR_PAYSTACK_PUBLIC_KEY
```

---

## 6. Verification & Quality Assurance

1. **Unit & Type Testing**: `npm run typecheck`
2. **Build Validation**: `npm run build` (verifies SSR / SSG compatibility)
3. **Webhook Verification**: Test with Paystack test webhooks using `x-paystack-signature`.
