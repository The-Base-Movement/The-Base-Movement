# Paystack Payment Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Paystack GHS payments into the donation page, store checkout, and all chapter/constituency donate buttons — while preserving the offline receipt-upload path for donors who paid outside the website.

**Architecture:** react-paystack popup → DB record inserted as Pending → Paystack popup auto-opens → on success, client calls `verify-payment` Edge Function (Paystack API verify + DB update + SMS); Paystack also calls `paystack-webhook` Edge Function as an idempotent second path. Offline donors skip Paystack entirely and use the existing Step 4 receipt-upload flow.

**Tech Stack:** react-paystack, Supabase Edge Functions (Deno), Paystack REST API, Africa's Talking SMS API

---

## File Map

| File                                                      | Action                                                               |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| `vite.config.ts`                                          | Modify — add `PAYSTACK_PUBLIC_KEY` to `define` block (line 111)      |
| `supabase/migrations/20260605000100_paystack_columns.sql` | Create                                                               |
| `src/components/payment/PaystackButton.tsx`               | Create                                                               |
| `src/components/payment/DonateModal.tsx`                  | Create                                                               |
| `supabase/functions/verify-payment/index.ts`              | Create                                                               |
| `supabase/functions/paystack-webhook/index.ts`            | Create                                                               |
| `src/pages/donate/components/MobilizationProtocol.tsx`    | Modify — add payment choice section at end of Step 3                 |
| `src/pages/Donate.tsx`                                    | Modify — handle online/offline paths, render autoOpen PaystackButton |
| `src/pages/Checkout.tsx`                                  | Modify — insert order before opening PaystackButton                  |
| `src/pages/chapterdetails/LeadershipSidebar.tsx`          | Modify — add `onDonate` prop replacing the Link                      |
| `src/pages/ChapterDetails.tsx`                            | Modify — manage DonateModal state, pass onDonate                     |
| `src/pages/ConstituencyDetails.tsx`                       | Modify — replace donate Link with DonateModal                        |

---

## Task 1: Setup — install library + expose env key

**Files:**

- Modify: `vite.config.ts:102-111`

- [ ] **Step 1: Install react-paystack**

```bash
npm install react-paystack
```

Expected: installed with no peer dependency errors.

- [ ] **Step 2: Add PAYSTACK_PUBLIC_KEY to the define block in vite.config.ts**

The current `define` block ends at line 111 with `VITE_VAPID_PUBLIC_KEY`. Add one line after it:

```ts
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'import.meta.env.VITE_TINYMCE_API_KEY': JSON.stringify(env.TINYMCE_API_KEY),
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.SENTRY_DSN),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.MAPBOX_TOKEN),
      'import.meta.env.VITE_UMAMI_WEBSITE_ID': JSON.stringify(env.UMAMI_WEBSITE_ID),
      'import.meta.env.VITE_UMAMI_SHARE_URL': JSON.stringify(env.UMAMI_SHARE_URL),
      'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(env.VAPID_PUBLIC_KEY),
      'import.meta.env.PAYSTACK_PUBLIC_KEY': JSON.stringify(env.PAYSTACK_PUBLIC_KEY),
    },
```

- [ ] **Step 3: Verify .env has the key**

`.env` should contain `PAYSTACK_PUBLIC_KEY=pk_test_2275c46e12957b98e89e3cedde232995f26bc802` (already added in the prior session).

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "feat(payment): install react-paystack, expose PAYSTACK_PUBLIC_KEY via define block"
```

---

## Task 2: Database migration

**Files:**

- Create: `supabase/migrations/20260605000100_paystack_columns.sql`

- [ ] **Step 1: Create the migration file with this exact content**

```sql
-- Add Paystack columns to donations
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS constituency text;

-- Add Paystack columns to store_orders
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS paystack_reference text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Paid', 'Failed', 'Refunded'));
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` with:

- name: `paystack_columns`
- query: (the SQL above)

- [ ] **Step 3: Confirm columns exist**

Run via `mcp__supabase__execute_sql`:

```sql
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('donations', 'store_orders')
  AND column_name IN ('paystack_reference', 'constituency', 'payment_status')
ORDER BY table_name, column_name;
```

Expected: 4 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260605000100_paystack_columns.sql
git commit -m "feat(payment): add paystack_reference + constituency to donations, paystack_reference + payment_status to store_orders"
```

---

## Task 3: Build PaystackButton

**Files:**

- Create: `src/components/payment/PaystackButton.tsx`

**Key design:** When `autoOpen` is true, the component renders nothing but fires the Paystack popup on mount via `useEffect`. The parent sets this prop after inserting the DB record. When `autoOpen` is false (default), it renders a `.btn.btn-primary` that opens the popup on click.

The Paystack `reference` field we pass is our DB record UUID. Paystack echoes it back in the success callback as `ref.reference`. We then pass it to `onSuccess` and store it in `paystack_reference` in the DB — serving as the "paid via Paystack" marker and idempotency key.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/components/payment
```

Write `src/components/payment/PaystackButton.tsx`:

```tsx
import { usePaystackPayment } from 'react-paystack'
import { useEffect, useState } from 'react'

interface PaystackButtonProps {
  amount: number // GHS — multiplied ×100 internally (Paystack uses pesewas)
  name: string
  phone: string
  email?: string // falls back to donations@thebasemovement.com
  reference: string // our DB record UUID passed as Paystack reference
  metadata?: {
    donationId?: string
    orderId?: string
    memberId?: string
    context?: { type: 'chapter' | 'constituency'; name: string; id: string }
  }
  label?: string
  onSuccess: (paystackRef: string) => void
  onClose?: () => void
  disabled?: boolean
  autoOpen?: boolean // render nothing and fire popup immediately on mount
}

export default function PaystackButton({
  amount,
  name,
  phone,
  email,
  reference,
  metadata,
  label,
  onSuccess,
  onClose,
  disabled,
  autoOpen,
}: PaystackButtonProps) {
  const [loading, setLoading] = useState(false)

  const config = {
    reference,
    email: email || 'donations@thebasemovement.com',
    amount: Math.round(amount * 100),
    publicKey: import.meta.env.PAYSTACK_PUBLIC_KEY as string,
    currency: 'GHS',
    channels: ['card', 'mobile_money', 'bank_transfer'],
    metadata: {
      custom_fields: [
        { display_name: 'Name', variable_name: 'name', value: name },
        { display_name: 'Phone', variable_name: 'phone', value: phone },
      ],
      ...(metadata || {}),
    },
  }

  const initializePayment = usePaystackPayment(config)

  const handleSuccess = (ref: { reference?: string; trxref?: string }) => {
    setLoading(false)
    // ref.reference === the UUID we passed; Paystack echoes it back
    onSuccess(ref.reference || ref.trxref || reference)
  }

  const handleClose = () => {
    setLoading(false)
    onClose?.()
  }

  // Auto-open mode: fire popup on mount, render nothing visible
  useEffect(() => {
    if (!autoOpen) return
    const t = setTimeout(() => initializePayment(handleSuccess, handleClose), 50)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (autoOpen) return null

  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={disabled || loading}
      onClick={() => {
        setLoading(true)
        initializePayment(handleSuccess, handleClose)
      }}
    >
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : (
        label || `Pay GHS ${amount.toFixed(2)}`
      )}
    </button>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors. (react-paystack types come with the package.)

- [ ] **Step 3: Commit**

```bash
git add src/components/payment/PaystackButton.tsx
git commit -m "feat(payment): add PaystackButton component (popup + autoOpen mode)"
```

---

## Task 4: Build DonateModal

**Files:**

- Create: `src/components/payment/DonateModal.tsx`

This modal is used by chapter/constituency donate buttons — a lightweight form (amount, name, phone, optional email) with the full inline payment flow. No multi-step, no campaigns.

- [ ] **Step 1: Write `src/components/payment/DonateModal.tsx`**

```tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import PaystackButton from './PaystackButton'
import { useAuth } from '@/context/AuthContext'

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
  context?: {
    type: 'chapter' | 'constituency'
    name: string
    id: string
  }
}

interface ModalForm {
  amount: string
  fullName: string
  phone: string
  email: string
}

const EMPTY: ModalForm = { amount: '', fullName: '', phone: '', email: '' }

export default function DonateModal({ isOpen, onClose, context }: DonateModalProps) {
  const { session } = useAuth()
  const [form, setForm] = useState<ModalForm>(EMPTY)
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const reset = () => {
    setForm(EMPTY)
    setPendingDonationId(null)
    setSucceeded(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          amount: parseFloat(form.amount),
          country: 'Ghana',
          payment_method: 'Paystack',
          status: 'Pending',
          member_id: session?.user?.id || null,
          chapter: context?.type === 'chapter' ? context.name : null,
          constituency: context?.type === 'constituency' ? context.name : null,
          show_on_dashboard: true,
        })
        .select('id')
        .single()
      if (error) throw error
      setPendingDonationId(data.id)
    } catch (err) {
      console.error('[DonateModal] insert failed:', err)
      toast.error('Could not start payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaystackSuccess = async (paystackRef: string) => {
    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession()
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ reference: pendingDonationId, paystackRef, type: 'donation' }),
      })
    } catch (err) {
      // Webhook will catch this as fallback; don't block the success UI
      console.warn('[DonateModal] verify-payment call failed:', err)
    }
    setPendingDonationId(null)
    setSucceeded(true)
  }

  const handlePaystackClose = async () => {
    // User dismissed popup without paying — delete the pending donation
    if (pendingDonationId) {
      await supabase.from('donations').delete().eq('id', pendingDonationId)
    }
    setPendingDonationId(null)
  }

  const contextLabel = context
    ? `${context.type === 'chapter' ? 'Chapter' : 'Constituency'}: ${context.name}`
    : 'The Base Movement'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 440,
          padding: 32,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            close
          </span>
        </button>

        {succeeded ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 48,
                color: 'hsl(var(--primary))',
                display: 'block',
                marginBottom: 16,
              }}
            >
              check_circle
            </span>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 20,
                color: 'hsl(var(--on-surface))',
                marginBottom: 8,
              }}
            >
              Donation confirmed!
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 24 }}>
              Thank you for supporting {contextLabel}.
            </p>
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 18,
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
                >
                  favorite
                </span>
                Support the Movement
              </h2>
              {context && (
                <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                  {contextLabel}
                </p>
              )}
            </div>

            <form
              onSubmit={handleInitiatePayment}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {(['amount', 'fullName', 'phone', 'email'] as const).map((field) => {
                const meta: Record<
                  string,
                  { label: string; type: string; placeholder: string; required: boolean }
                > = {
                  amount: {
                    label: 'Amount (GHS)',
                    type: 'number',
                    placeholder: '0.00',
                    required: true,
                  },
                  fullName: {
                    label: 'Full name',
                    type: 'text',
                    placeholder: 'Your full name',
                    required: true,
                  },
                  phone: {
                    label: 'Phone',
                    type: 'tel',
                    placeholder: '+233 xx xxx xxxx',
                    required: true,
                  },
                  email: {
                    label: 'Email (optional — receipt)',
                    type: 'email',
                    placeholder: 'you@example.com',
                    required: false,
                  },
                }
                const m = meta[field]
                return (
                  <div key={field}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'block',
                        marginBottom: 6,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {m.label}
                      {m.required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
                    </label>
                    <input
                      name={`modal-${field}`}
                      type={m.type}
                      required={m.required}
                      placeholder={m.placeholder}
                      min={field === 'amount' ? '1' : undefined}
                      step={field === 'amount' ? '0.01' : undefined}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      style={{
                        width: '100%',
                        height: 44,
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 12px',
                        fontSize: 14,
                        fontFamily: "'Public Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )
              })}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ height: 48, width: '100%', justifyContent: 'center' }}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      lock
                    </span>
                    Pay with Paystack
                  </>
                )}
              </button>
            </form>

            {pendingDonationId && (
              <PaystackButton
                autoOpen
                reference={pendingDonationId}
                amount={parseFloat(form.amount)}
                name={form.fullName}
                phone={form.phone}
                email={form.email || undefined}
                metadata={{
                  donationId: pendingDonationId,
                  memberId: session?.user?.id,
                  context: context ?? undefined,
                }}
                onSuccess={handlePaystackSuccess}
                onClose={handlePaystackClose}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/payment/DonateModal.tsx
git commit -m "feat(payment): add DonateModal for chapter/constituency donate buttons"
```

---

## Task 5: Build verify-payment Edge Function

**Files:**

- Create: `supabase/functions/verify-payment/index.ts`

Called by the frontend after a successful Paystack popup. Verifies the transaction with the Paystack API, updates the DB record to Verified/Paid, and sends an Africa's Talking SMS for phone-only donors.

**Idempotency:** Both this function and the webhook guard with `.is('paystack_reference', null)` — only the first caller updates. The second is a no-op.

- [ ] **Step 1: Write the function**

```ts
// @ts-expect-error: Deno URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendSMS(to: string, message: string): Promise<void> {
  // @ts-expect-error: Deno global
  const apiKey: string | undefined = Deno.env.get('AT_API_KEY')
  // @ts-expect-error: Deno global
  const username: string | undefined = Deno.env.get('AT_USERNAME')
  if (!apiKey || !username) return
  const body = new URLSearchParams({ username, to, message })
  await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: { apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { reference, paystackRef, type } = (await req.json()) as {
      reference: string
      paystackRef: string
      type: 'donation' | 'order'
    }
    if (!reference || !paystackRef || !type) {
      throw new Error('reference, paystackRef, and type are required')
    }

    // @ts-expect-error: Deno global
    const secretKey: string | undefined = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY not configured')

    // Verify the transaction with Paystack
    const psRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackRef)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    )
    const psJson = (await psRes.json()) as {
      status: boolean
      data: { status: string; amount: number; channel: string }
    }
    if (!psJson.status || psJson.data.status !== 'success') {
      throw new Error(`Paystack verification failed: ${psJson.data?.status}`)
    }
    const { amount: paidPesewas, channel } = psJson.data

    // @ts-expect-error: Deno global
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (type === 'donation') {
      const { data: donation, error: fetchErr } = await supabase
        .from('donations')
        .select('id, amount, phone, full_name')
        .eq('id', reference)
        .single()
      if (fetchErr || !donation) throw new Error(`Donation not found: ${fetchErr?.message}`)

      const expectedPesewas = Math.round(Number(donation.amount) * 100)
      if (Math.abs(paidPesewas - expectedPesewas) > 1) {
        throw new Error(`Amount mismatch: expected ${expectedPesewas}, got ${paidPesewas}`)
      }

      // Idempotency: only update if paystack_reference not yet set
      await supabase
        .from('donations')
        .update({ status: 'Verified', paystack_reference: paystackRef, payment_method: channel })
        .eq('id', reference)
        .is('paystack_reference', null)

      if (donation.phone) {
        const amountGhs = (paidPesewas / 100).toFixed(2)
        await sendSMS(
          donation.phone,
          `The Base Movement: GHS ${amountGhs} payment confirmed. Ref: ${paystackRef}. Thank you!`
        )
      }
    } else {
      const { data: order, error: fetchErr } = await supabase
        .from('store_orders')
        .select('id, total_amount, phone')
        .eq('id', reference)
        .single()
      if (fetchErr || !order) throw new Error(`Order not found: ${fetchErr?.message}`)

      const expectedPesewas = Math.round(Number(order.total_amount) * 100)
      if (Math.abs(paidPesewas - expectedPesewas) > 1) {
        throw new Error(`Amount mismatch: expected ${expectedPesewas}, got ${paidPesewas}`)
      }

      await supabase
        .from('store_orders')
        .update({ payment_status: 'Paid', status: 'Processing', paystack_reference: paystackRef })
        .eq('id', reference)
        .is('paystack_reference', null)

      if (order.phone) {
        const amountGhs = (paidPesewas / 100).toFixed(2)
        await sendSMS(
          order.phone,
          `The Base Movement Store: GHS ${amountGhs} payment confirmed. Order #${reference.substring(0, 8)}. Thank you!`
        )
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[VERIFY-PAYMENT-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/verify-payment/index.ts
git commit -m "feat(payment): add verify-payment edge function"
```

---

## Task 6: Build paystack-webhook Edge Function

**Files:**

- Create: `supabase/functions/paystack-webhook/index.ts`

Called directly by Paystack servers on `charge.success`. Validates HMAC-SHA512 signature, then performs the same DB update as `verify-payment` (idempotent — the `paystack_reference IS NULL` guard prevents double-processing).

**Webhook URL to register in Paystack dashboard:**
`https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/paystack-webhook`

- [ ] **Step 1: Write the function**

```ts
// @ts-expect-error: Deno URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

async function hexToBuffer(hex: string): Promise<Uint8Array> {
  const pairs = hex.match(/.{1,2}/g) ?? []
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)))
}

async function verifySig(body: string, secret: string, providedSig: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['verify']
  )
  const sigBuffer = await hexToBuffer(providedSig)
  return crypto.subtle.verify('HMAC', key, sigBuffer, enc.encode(body))
}

async function sendSMS(to: string, message: string): Promise<void> {
  // @ts-expect-error: Deno global
  const apiKey: string | undefined = Deno.env.get('AT_API_KEY')
  // @ts-expect-error: Deno global
  const username: string | undefined = Deno.env.get('AT_USERNAME')
  if (!apiKey || !username) return
  const body = new URLSearchParams({ username, to, message })
  await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: { apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const rawBody = await req.text()
    const sig = req.headers.get('x-paystack-signature') ?? ''

    // @ts-expect-error: Deno global
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
    const valid = await verifySig(rawBody, secretKey, sig)
    if (!valid) {
      console.warn('[WEBHOOK] Invalid Paystack signature')
      return new Response('Unauthorized', { status: 401 })
    }

    const event = JSON.parse(rawBody) as {
      event: string
      data: { reference: string; amount: number; channel: string; status: string }
    }

    if (event.event !== 'charge.success') {
      return new Response('OK', { status: 200 })
    }

    const { reference: dbRef, amount: paidPesewas, channel } = event.data
    const paystackRef = dbRef // We passed our DB UUID as the Paystack reference

    // @ts-expect-error: Deno global
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Try donation first (idempotency: only if not yet verified)
    const { data: donation } = await supabase
      .from('donations')
      .select('id, amount, phone')
      .eq('id', dbRef)
      .is('paystack_reference', null)
      .maybeSingle()

    if (donation) {
      await supabase
        .from('donations')
        .update({ status: 'Verified', paystack_reference: paystackRef, payment_method: channel })
        .eq('id', dbRef)
        .is('paystack_reference', null)

      if (donation.phone) {
        const amountGhs = (paidPesewas / 100).toFixed(2)
        await sendSMS(
          donation.phone,
          `The Base Movement: GHS ${amountGhs} payment confirmed. Ref: ${paystackRef}. Thank you!`
        )
      }
      return new Response('OK', { status: 200 })
    }

    // Try order
    const { data: order } = await supabase
      .from('store_orders')
      .select('id, total_amount, phone')
      .eq('id', dbRef)
      .is('paystack_reference', null)
      .maybeSingle()

    if (order) {
      await supabase
        .from('store_orders')
        .update({ payment_status: 'Paid', status: 'Processing', paystack_reference: paystackRef })
        .eq('id', dbRef)
        .is('paystack_reference', null)

      if (order.phone) {
        const amountGhs = (paidPesewas / 100).toFixed(2)
        await sendSMS(
          order.phone,
          `The Base Movement Store: GHS ${amountGhs} payment confirmed. Order #${dbRef.substring(0, 8)}. Thank you!`
        )
      }
    }

    return new Response('OK', { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[WEBHOOK-ERROR] ${message}`)
    return new Response('Internal Server Error', { status: 500 })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/paystack-webhook/index.ts
git commit -m "feat(payment): add paystack-webhook edge function (HMAC-SHA512 verified)"
```

---

## Task 7: Update MobilizationProtocol + Donate.tsx

**Files:**

- Modify: `src/pages/donate/components/MobilizationProtocol.tsx`
- Modify: `src/pages/Donate.tsx`

**The change:** Step 3 (link section, `id="link-section"`) currently ends with a membership number input and a checkbox. Add a new panel after those controls — the payment choice. Step 4 (audit trail) only shows when the donor picks the offline path.

**Donate.tsx new state:**

- `paymentPath: 'online' | 'offline' | null` — which path the donor chose
- `pendingDonationId: string | null` — set after inserting the donation record; triggers autoOpen PaystackButton
- `userEmail: string` — resolved from auth session for Paystack email field

**Flow:**

- "Pay online now" → validates form → inserts donation → sets `pendingDonationId` → `<PaystackButton autoOpen>` mounts → popup fires → `handlePaystackSuccess` → `verify-payment` call → `setSubmitted(true)` → `DonateSuccessPanel`
- "I already paid / paying offline" → sets `paymentPath='offline'` → Step 4 (receipt upload) appears → existing `handleSubmit` (status stays Pending)
- Paystack popup closed without paying → `handlePaystackClose` → delete pending donation record → reset

### MobilizationProtocol changes

- [ ] **Step 1: Add new props to MobilizationProtocol**

In `MobilizationProtocol.tsx`, update the interface and function signature:

Replace the existing `interface MobilizationProtocolProps` (lines 22-32) with:

```ts
interface MobilizationProtocolProps {
  activeStep: number
  setActiveStep: (step: number) => void
  formData: FormData
  setFormData: Dispatch<SetStateAction<FormData>>
  isLoggedIn: boolean
  countriesLoading: boolean
  countries: Country[]
  campaigns: DonationCampaign[]
  paymentPath: 'online' | 'offline' | null
  onPickOffline: () => void
  onPickOnline: () => void
  onOfflineSubmit: (e: React.FormEvent) => void
}
```

Update the destructured props in `export function MobilizationProtocol(...)`:

```ts
export function MobilizationProtocol({
  activeStep,
  setActiveStep,
  formData,
  setFormData,
  isLoggedIn,
  countriesLoading,
  countries,
  campaigns,
  paymentPath,
  onPickOffline,
  onPickOnline,
  onOfflineSubmit,
}: MobilizationProtocolProps) {
```

- [ ] **Step 2: Update the steps sidebar in MobilizationProtocol**

The `steps` array currently has 4 items. Replace it so Step 4 only appears when `paymentPath === 'offline'`:

```ts
const steps = [
  { step: 1, label: 'Capital transfer', id: 'payment-section', color: 'hsl(var(--destructive))' },
  { step: 2, label: 'Contributor profile', id: 'donor-section', color: 'hsl(var(--accent))' },
  { step: 3, label: 'Member link', id: 'link-section', color: 'hsl(var(--primary))' },
  ...(paymentPath === 'offline'
    ? [{ step: 4, label: 'Verification', id: 'receipt-section', color: 'hsl(var(--primary))' }]
    : []),
]
```

- [ ] **Step 3: Add payment choice section to Step 3 in MobilizationProtocol**

The Step 3 div (`id="link-section"`) currently ends just before the closing `</div>` at the bottom of the "link patriot" section (after the showOnDashboard checkbox label). Add this payment choice block immediately before the closing `</div>` of `step 3: link patriot`:

```tsx
{
  /* Payment choice */
}
;<div
  style={{
    borderTop: '1px solid hsl(var(--border))',
    paddingTop: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  }}
>
  <p
    style={{
      fontSize: 11,
      fontWeight: 500,
      color: 'hsl(var(--on-surface-muted))',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 8,
      fontFamily: "'Public Sans', sans-serif",
    }}
  >
    How would you like to contribute?
  </p>
  <button
    type="button"
    className="btn btn-primary"
    onClick={onPickOnline}
    style={{ width: '100%', justifyContent: 'center', height: 52 }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
      lock
    </span>
    Pay online now
  </button>
  <button
    type="button"
    className="btn btn-outline"
    onClick={onPickOffline}
    style={{ width: '100%', justifyContent: 'center', height: 52 }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
      upload
    </span>
    I already paid / paying offline
  </button>
</div>
```

- [ ] **Step 4: Make Step 4 conditional on paymentPath**

The Step 4 div (`id="receipt-section"`) should only render when `paymentPath === 'offline'`. Wrap it:

```tsx
        {/* step 4: audit trail — offline donations only */}
        {paymentPath === 'offline' && (
          <div
            id="receipt-section"
            ...
          >
            {/* existing Step 4 content unchanged, but change the submit button's onSubmit */}
```

Also update the submit button at the bottom of Step 4 — change `type="submit"` and `form="donationForm"` to call `onOfflineSubmit`:

Replace the existing submit button in Step 4:

```tsx
            <button
              type="button"
              onClick={onOfflineSubmit}
              style={{ ... existing styles ... }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>favorite</span>
              Authorize contribution
            </button>
```

Remove `type="submit"` and `form="donationForm"` attributes; use `type="button"` with `onClick={onOfflineSubmit}`.

Also remove `required` from the file input in Step 4 (since it's only shown for offline path but was always present before):

```tsx
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onFocus={() => setActiveStep(4)}
                style={{ ... }}
                id="receipt"
                aria-label="Upload payment receipt"
              />
```

(Remove `required` and `form="donationForm"` attributes.)

### Donate.tsx changes

- [ ] **Step 5: Update Donate.tsx state and imports**

At the top of `Donate.tsx`, add to existing imports:

```ts
import PaystackButton from '@/components/payment/PaystackButton'
```

Add new state variables after the existing state declarations (after line 55):

```ts
const [paymentPath, setPaymentPath] = useState<'online' | 'offline' | null>(null)
const [pendingDonationId, setPendingDonationId] = useState<string | null>(null)
const [userEmail, setUserEmail] = useState('')
```

In the `useEffect` load function, after setting `formData`, also capture the email:

```ts
if (user) {
  // ...existing profile fetch...
  const email = profile?.email || user.email || ''
  setUserEmail(email)
}
```

- [ ] **Step 6: Add online payment handler to Donate.tsx**

Add this function after the existing `handleSubmit`:

```ts
const handleInitiateOnlinePayment = async () => {
  if (!formData.amount || parseFloat(formData.amount) <= 0) {
    toast.error('Please enter a valid contribution amount.')
    return
  }
  if (!formData.fullName || !formData.phone) {
    toast.error('Identity verification required.')
    return
  }
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        full_name: formData.fullName,
        phone: formData.phone,
        amount: parseFloat(formData.amount),
        country: formData.country,
        payment_method: 'Paystack',
        status: 'Pending',
        member_id: formData.memberId || null,
        campaign_id: formData.campaignId || null,
        show_on_dashboard: formData.showOnDashboard,
      })
      .select('id')
      .single()
    if (error) throw error
    setPendingDonationId(data.id)
  } catch (err) {
    console.error('[Donate] online payment insert failed:', err)
    toast.error('Could not start payment. Please try again.')
  }
}

const handlePaystackSuccess = async (paystackRef: string) => {
  try {
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ reference: pendingDonationId, paystackRef, type: 'donation' }),
    })
  } catch (err) {
    console.warn('[Donate] verify-payment call failed (webhook will catch):', err)
  }
  setPendingDonationId(null)
  trackEvent('donation_submitted', { amount: parseFloat(formData.amount), method: 'paystack' })
  setSubmitted(true)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handlePaystackClose = async () => {
  if (pendingDonationId) {
    await supabase.from('donations').delete().eq('id', pendingDonationId)
  }
  setPendingDonationId(null)
}
```

- [ ] **Step 7: Update MobilizationProtocol usage in Donate.tsx JSX**

Replace the current `<MobilizationProtocol ... onSubmit={handleSubmit} />` call (around line 234) with the updated prop set:

```tsx
<MobilizationProtocol
  activeStep={activeStep}
  setActiveStep={setActiveStep}
  formData={formData}
  setFormData={setFormData}
  isLoggedIn={isLoggedIn}
  countriesLoading={countriesLoading}
  countries={countries}
  campaigns={campaigns}
  paymentPath={paymentPath}
  onPickOffline={() => setPaymentPath('offline')}
  onPickOnline={handleInitiateOnlinePayment}
  onOfflineSubmit={handleSubmit}
/>
```

- [ ] **Step 8: Add autoOpen PaystackButton to Donate.tsx JSX**

Immediately after the `<MobilizationProtocol ... />` line, add:

```tsx
{
  pendingDonationId && (
    <PaystackButton
      autoOpen
      reference={pendingDonationId}
      amount={parseFloat(formData.amount)}
      name={formData.fullName}
      phone={formData.phone}
      email={userEmail || undefined}
      metadata={{
        donationId: pendingDonationId,
        memberId: formData.memberId || undefined,
      }}
      onSuccess={handlePaystackSuccess}
      onClose={handlePaystackClose}
    />
  )
}
```

- [ ] **Step 9: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any prop mismatch between the new MobilizationProtocol interface and the call site.

- [ ] **Step 10: Commit**

```bash
git add src/pages/donate/components/MobilizationProtocol.tsx src/pages/Donate.tsx
git commit -m "feat(payment): wire Paystack online/offline payment choice into donation page"
```

---

## Task 8: Update Checkout.tsx

**Files:**

- Modify: `src/pages/Checkout.tsx`

**The change:** The current "Complete Purchase" `<button type="submit">` calls `handleSubmit` which inserts the order and navigates to summary. In the new flow: clicking "Complete Purchase" inserts the order first (status: Pending, payment_status: Unpaid), then triggers the Paystack popup. On Paystack success: call `verify-payment`, then navigate. On popup close without paying: delete the pending order.

- [ ] **Step 1: Add new state + import to Checkout.tsx**

Add to imports:

```ts
import PaystackButton from '@/components/payment/PaystackButton'
```

Add new state after the existing `const [isSubmitting, setIsSubmitting] = useState(false)`:

```ts
const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
```

- [ ] **Step 2: Replace handleSubmit in Checkout.tsx**

The current `handleSubmit` (lines 92-175) inserts the order and navigates. Split into two handlers:

**`handleInsertOrder`** — inserts the order record, sets `pendingOrderId`:

```ts
const handleInsertOrder = async (e: React.FormEvent) => {
  e.preventDefault()
  if (cart.length === 0) {
    toast.error('Your shopping bag is empty.')
    return
  }
  setIsSubmitting(true)
  try {
    const { data: order, error: orderError } = await supabase
      .from('store_orders')
      .insert({
        customer_id: session?.user?.id || null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        shipping_address: formData.address,
        city: formData.city,
        country: formData.country,
        region_or_state: isDiaspora ? formData.stateProvince : formData.region,
        payment_method: paymentMethod,
        subtotal,
        shipping_fee: shipping,
        total_amount: total,
        points_redeemed: usePoints ? pointsToRedeem : 0,
        points_value_ghs: appliedPointsValue,
        status: 'Pending',
        payment_status: 'Unpaid',
      })
      .select('id')
      .single()
    if (orderError) throw orderError

    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price_at_purchase:
        typeof item.price === 'string'
          ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
          : item.price,
    }))
    const { error: itemsError } = await supabase.from('store_order_items').insert(orderItems)
    if (itemsError) throw itemsError

    if (usePoints && session?.user?.id) {
      await supabase.from('member_points').insert({
        user_id: session.user.id,
        points: -pointsToRedeem,
        reason: `Store Redemption: Order #${order.id.substring(0, 8)}`,
        reference_id: order.id,
      })
    }

    setPendingOrderId(order.id)
  } catch (err: unknown) {
    console.error('Checkout failed:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to process checkout.'
    toast.error(errorMessage)
  } finally {
    setIsSubmitting(false)
  }
}
```

**`handlePaystackSuccess`** — called after Paystack confirms payment:

```ts
const handlePaystackSuccess = async (paystackRef: string) => {
  if (!pendingOrderId) return
  try {
    const {
      data: { session: s },
    } = await supabase.auth.getSession()
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ reference: pendingOrderId, paystackRef, type: 'order' }),
    })
  } catch (err) {
    console.warn('[Checkout] verify-payment failed (webhook will catch):', err)
  }

  if (session?.user?.id) {
    await userActivityService.logActivity(
      session.user.id,
      'store_order',
      `Placed an order (${cart.length} item${cart.length === 1 ? '' : 's'})`,
      { order_id: pendingOrderId }
    )
  }
  discordService.storeOrderPlaced(
    pendingOrderId,
    formData.fullName,
    total,
    cart.length,
    paymentMethod === 'momo' ? 'Mobile Money (MoMo)' : 'Card',
    isDiaspora ? formData.stateProvince : formData.region
  )
  trackEvent('store_purchase', { total, items: cart.length })
  toast.success('Order placed! Check your email for details.')
  clearCart()
  const path = isDashboard ? '/dashboard/store/summary' : '/store/summary'
  navigate(path, { state: { orderId: pendingOrderId } })
}
```

**`handlePaystackClose`** — user dismissed popup without paying:

```ts
const handlePaystackClose = async () => {
  if (pendingOrderId) {
    await supabase.from('store_orders').update({ status: 'Cancelled' }).eq('id', pendingOrderId)
  }
  setPendingOrderId(null)
}
```

- [ ] **Step 3: Update the form and submit button in Checkout.tsx JSX**

Change `<form onSubmit={handleSubmit}` to `<form onSubmit={handleInsertOrder}`.

Replace the `<button type="submit" ...>Complete Purchase</button>` (lines 330-337) with:

```tsx
;<button
  type="submit"
  disabled={isSubmitting}
  className="btn btn-primary w-full disabled:opacity-60"
  style={{ height: 56 }}
>
  {isSubmitting ? 'Processing...' : 'Complete Purchase'}
</button>

{
  pendingOrderId && (
    <PaystackButton
      autoOpen
      reference={pendingOrderId}
      amount={total}
      name={formData.fullName}
      phone={formData.phone}
      email={formData.email || undefined}
      metadata={{ orderId: pendingOrderId, memberId: session?.user?.id }}
      onSuccess={handlePaystackSuccess}
      onClose={handlePaystackClose}
    />
  )
}
```

- [ ] **Step 4: Remove the old PaymentMethodSelector from imports (keep component)**

The `<PaymentMethodSelector>` component remains in the JSX — it still lets the user pick MoMo vs. card as a preference hint passed to Paystack's `channel` ordering. No change needed to its usage.

- [ ] **Step 5: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat(payment): wire Paystack into store checkout (insert order → popup → verify)"
```

---

## Task 9: Wire DonateModal into chapters and constituency

**Files:**

- Modify: `src/pages/chapterdetails/LeadershipSidebar.tsx`
- Modify: `src/pages/ChapterDetails.tsx`
- Modify: `src/pages/ConstituencyDetails.tsx`

### LeadershipSidebar

- [ ] **Step 1: Add onDonate prop to LeadershipSidebar**

In `LeadershipSidebar.tsx`, add `onDonate: () => void` to the interface and destructure it:

```ts
interface LeadershipSidebarProps {
  chapterSlug: string
  city_or_region: string
  leader_name?: string | null
  leader_id?: string | null
  leadership?: ChapterLeader[]
  leaderAvatarUrl: string | null
  isLeader: boolean
  email?: string | null
  phone_number?: string | null
  onViewLeaderProfile: () => void
  onDonate: () => void // ← add this
}
```

Update destructuring:

```ts
export function LeadershipSidebar({
  ...
  onViewLeaderProfile,
  onDonate,
}: LeadershipSidebarProps) {
```

- [ ] **Step 2: Replace the donate Link with a button**

In the "Donate to chapter" panel (around line 369), replace:

```tsx
<Link
  to="/dashboard/donate"
  className="btn btn-primary"
  style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
>
  Donate to chapter
</Link>
```

with:

```tsx
<button
  type="button"
  className="btn btn-primary"
  style={{ width: '100%', justifyContent: 'center' }}
  onClick={onDonate}
>
  Donate to chapter
</button>
```

Remove the `import { Link }` from react-router-dom if it's no longer used elsewhere in the file. Check first — if Link is used elsewhere, keep the import.

### ChapterDetails

- [ ] **Step 3: Add DonateModal state and import to ChapterDetails.tsx**

Add to imports:

```ts
import DonateModal from '@/components/payment/DonateModal'
```

Add new state after the existing state declarations:

```ts
const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)
```

- [ ] **Step 4: Pass onDonate to LeadershipSidebar in ChapterDetails.tsx**

In the `<LeadershipSidebar ... />` JSX call (around line 351), add:

```tsx
          onDonate={() => setIsDonateModalOpen(true)}
```

- [ ] **Step 5: Render DonateModal in ChapterDetails.tsx**

After the `<ShareModal ... />` closing tag (last element before the return's closing `</div>`), add:

```tsx
<DonateModal
  isOpen={isDonateModalOpen}
  onClose={() => setIsDonateModalOpen(false)}
  context={chapter ? { type: 'chapter', name: chapter.name, id: chapter.id } : undefined}
/>
```

### ConstituencyDetails

- [ ] **Step 6: Add DonateModal state and import to ConstituencyDetails.tsx**

Add to imports:

```ts
import DonateModal from '@/components/payment/DonateModal'
```

Add new state:

```ts
const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)
```

- [ ] **Step 7: Replace the donate Link with a button in ConstituencyDetails.tsx**

Find the donate Link (around lines 1285-1297):

```tsx
            <Link
              to="/dashboard/donate"
              className="btn btn-primary"
              style={{ ... }}
            >
              Donate to Hub
            </Link>
```

Replace with:

```tsx
<button
  type="button"
  className="btn btn-primary"
  style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  }}
  onClick={() => setIsDonateModalOpen(true)}
>
  Donate to Hub
</button>
```

- [ ] **Step 8: Render DonateModal in ConstituencyDetails.tsx**

Find the return's closing `</div>` tag. Before it, add:

```tsx
<DonateModal
  isOpen={isDonateModalOpen}
  onClose={() => setIsDonateModalOpen(false)}
  context={
    constituency
      ? { type: 'constituency', name: constituency.name, id: constituency.id }
      : undefined
  }
/>
```

- [ ] **Step 9: Type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/chapterdetails/LeadershipSidebar.tsx src/pages/ChapterDetails.tsx src/pages/ConstituencyDetails.tsx
git commit -m "feat(payment): wire DonateModal into chapter and constituency pages"
```

---

## Task 10: Deploy Edge Functions + Smoke Test

- [ ] **Step 1: Deploy verify-payment**

Use `mcp__supabase__deploy_edge_function` with:

- name: `verify-payment`
- entrypoint_path: `supabase/functions/verify-payment/index.ts`

- [ ] **Step 2: Deploy paystack-webhook**

Use `mcp__supabase__deploy_edge_function` with:

- name: `paystack-webhook`
- entrypoint_path: `supabase/functions/paystack-webhook/index.ts`

- [ ] **Step 3: Confirm both functions are live**

Use `mcp__supabase__list_edge_functions`. Verify `verify-payment` and `paystack-webhook` appear with status `ACTIVE`.

- [ ] **Step 4: Manual smoke test — Donate page**

1. Open the site, go to `/donate`
2. Fill in Step 2 (contributor profile): amount = 1, name, phone
3. Fill in Step 3 (member link): skip membership number
4. Click "Pay online now"
5. Paystack popup should open with GHS 1 and channels card/MoMo/bank
6. Use Paystack test card: `4084084084084081`, expiry any future date, CVV `408`, OTP `123456`
7. On success: donation page should navigate to `DonateSuccessPanel`
8. In Supabase: check `donations` table — the record should have `status = 'Verified'` and `paystack_reference` set

- [ ] **Step 5: Manual smoke test — Checkout**

1. Add a store item to cart, go to `/store/checkout`
2. Fill in delivery form + select MoMo payment
3. Click "Complete Purchase"
4. Paystack popup opens
5. Use test card (same as above)
6. On success: navigate to `/store/summary`
7. In Supabase: `store_orders` record should have `payment_status = 'Paid'` and `status = 'Processing'`

- [ ] **Step 6: Manual smoke test — DonateModal**

1. Go to any chapter page (e.g. `/chapters/accra-central`)
2. Click "Donate to chapter"
3. DonateModal opens
4. Fill amount/name/phone, click "Pay with Paystack"
5. Paystack popup opens
6. Complete test payment
7. Modal shows success confirmation

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(payment): confirm edge functions deployed and smoke tested"
git push
```

---

## Manual Steps Checklist (Do After Implementation)

These cannot be automated — they require dashboard access:

### Supabase

- [ ] Add `PAYSTACK_SECRET_KEY=sk_test_...` to Edge Function secrets
  - Supabase dashboard → Edge Functions → Manage secrets

### Paystack dashboard (test mode)

- [ ] Register webhook URL: `https://vhlyekyxutwbxlvktnzd.supabase.co/functions/v1/paystack-webhook`
  - Paystack dashboard → Settings → API Keys & Webhooks → Webhook URL
  - Enable event: `charge.success`
- [ ] Set `donations@thebasemovement.com` as a verified sender
  - Settings → Preferences → Business Information

### Vercel

- [ ] Add `PAYSTACK_PUBLIC_KEY=pk_test_...` as an environment variable
  - Vercel dashboard → Project → Settings → Environment Variables
  - Required for production build (vite.config.ts define block reads from Vercel env at build time)

### Before going live (production switch)

- [ ] Replace test keys with live keys in Vercel env and Supabase secrets
- [ ] Re-register webhook with live secret
- [ ] Complete Ghana compliance form (Paystack)
- [ ] Test one real GHS 1 donation end-to-end
