// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { verifyHubtelCallbackSignature } from '../hubtel-payment-shared/callback-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getNested(payload: Record<string, unknown>, key: string): unknown {
  if (payload[key] !== undefined) return payload[key]
  const data = payload.Data ?? payload.data
  if (data && typeof data === 'object') return (data as Record<string, unknown>)[key]
  return undefined
}

function getString(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = getNested(payload, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return null
}

// Fire a #alerts Discord message via the discord-notify proxy. Non-fatal.
async function sendAlert(
  title: string,
  description: string,
  fields?: { name: string; value: string; inline?: boolean }[]
) {
  try {
    // @ts-expect-error: Deno global
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    await fetch(`${url}/functions/v1/discord-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        channel: 'alerts',
        embeds: [
          {
            title: `🔴 ${title}`,
            description,
            color: 0xce1126,
            fields,
            footer: { text: 'Hubtel payment callback' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch (e) {
    console.error('[HUBTEL-CALLBACK] alert dispatch failed:', e)
  }
}

// Fire a #payments Discord message via the discord-notify proxy. Non-fatal.
async function sendPaymentNotification(
  title: string,
  description: string,
  color: number,
  fields?: { name: string; value: string; inline?: boolean }[]
) {
  try {
    // @ts-expect-error: Deno global
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    await fetch(`${url}/functions/v1/discord-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        channel: 'payments',
        embeds: [
          {
            title: `💰 ${title}`,
            description,
            color,
            fields,
            footer: { text: 'Hubtel payment callback' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch (e) {
    console.error('[HUBTEL-CALLBACK] payment notification dispatch failed:', e)
  }
}

function isSuccessful(payload: Record<string, unknown>) {
  const code = getString(payload, ['ResponseCode', 'responseCode', 'Code', 'code'])
  const status = getString(payload, ['Status', 'status', 'TransactionStatus', 'transactionStatus'])
  const message = getString(payload, ['Message', 'message', 'Description', 'description'])

  return (
    code === '0000' ||
    ['success', 'successful', 'paid', 'completed'].includes(status?.toLowerCase() ?? '') ||
    ['success', 'successful', 'paid', 'completed'].includes(message?.toLowerCase() ?? '')
  )
}

export function donationCallbackResponse(result: { matched: boolean; already_final: boolean }) {
  if (!result.matched) return null
  return { success: true, already: result.already_final }
}

export interface MonthlyDuesCallbackResult {
  matched: boolean
  already_final: boolean
  amount_mismatch?: boolean
  status?: string
}

/**
 * Maps the apply_hubtel_monthly_dues_callback RPC result onto a handling
 * decision. Unmatched references fall through to other payment types;
 * duplicates are acknowledged without reapplying; amount mismatches are
 * alerted and never marked paid.
 */
export function monthlyDuesCallbackDecision(result: MonthlyDuesCallbackResult | null) {
  if (!result || !result.matched) return null
  if (result.already_final) return { handled: true, already: true, alert: false }
  if (result.amount_mismatch) return { handled: true, already: false, alert: true }
  return { handled: true, already: false, alert: false }
}

/**
 * Extracts the settled GHS amount from a Hubtel callback, preferring the
 * initiation metadata snapshot over the top-level callback amount.
 */
export function extractCallbackGhsAmount(payload: Record<string, unknown>): number | null {
  const data = (payload.Data ?? payload.data) as Record<string, unknown> | undefined
  const containers = [
    payload.metadata,
    payload.Metadata,
    data && typeof data === 'object' ? data.Metadata : undefined,
    data && typeof data === 'object' ? data.metadata : undefined,
  ]
  for (const container of containers) {
    if (container && typeof container === 'object') {
      const value = (container as Record<string, unknown>).ghsAmount
      const numeric = Number(value)
      if (value !== undefined && Number.isFinite(numeric) && numeric > 0) return numeric
    }
  }
  const amount = getString(payload, ['Amount', 'amount', 'TotalAmount', 'totalAmount'])
  const numeric = Number(amount)
  return amount !== null && Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

// @ts-expect-error: Deno global
if (import.meta.main)
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    let payload: Record<string, unknown> = {}
    try {
      payload = (await req.json()) as Record<string, unknown>
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Invalid callback payload')
      }

      const reference = getString(payload, [
        'ClientReference',
        'clientReference',
        'client_reference',
        'Reference',
        'reference',
      ])

      if (!reference) throw new Error('Missing Hubtel client reference')

      const callbackAuth = await verifyHubtelCallbackSignature(req.url, reference)
      if (!callbackAuth.ok) throw new Error(callbackAuth.reason)

      const transactionId = getString(payload, [
        'TransactionId',
        'transactionId',
        'TransactionID',
        'checkoutId',
        'paymentId',
        'ExternalTransactionId',
        'externalTransactionId',
        'transaction_id',
        'checkout_id',
        'CheckoutId',
        'payment_id',
        'hubtel_transaction_id',
        'hubtelTransactionId',
        'transactionReference',
        'transaction_reference',
        'TransactionReference',
        'TransactionRef',
        'transactionRef',
        'id',
      ])

      // @ts-expect-error: Deno global
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      // @ts-expect-error: Deno global
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      const paid = isSuccessful(payload)

      if (paid && !transactionId) {
        throw new Error('Missing Hubtel transaction id for successful callback')
      }

      const { data: callbackResult, error: callbackError } = await supabaseAdmin.rpc(
        'apply_hubtel_donation_callback',
        { p_donation_id: reference, p_paid: paid, p_transaction_id: transactionId }
      )
      if (callbackError) throw callbackError

      const donationDecision = donationCallbackResponse(callbackResult)
      if (donationDecision?.already) {
        return json({ success: true, paid, reference, already: true })
      }

      const { data: donation, error: donationError } =
        donationDecision?.success && paid
          ? await supabaseAdmin
              .from('donations')
              .select(
                'id, full_name, amount, reference, country, payment_method, donation_campaigns(title)'
              )
              .eq('id', reference)
              .maybeSingle()
          : { data: null, error: null }

      // Fire receipt generation + email for successful Hubtel donations (non-fatal)
      if (paid && donation) {
        supabaseAdmin.functions
          .invoke('send-donation-receipt', { body: { donationId: reference } })
          .catch((e: unknown) => {
            console.error('[HUBTEL-CALLBACK] Receipt invocation failed:', e)
          })

        // Send Discord payment notification matching the premium client-side style
        const campaignTitle = (donation as any).donation_campaigns?.title || 'Strategic Fund'
        await sendPaymentNotification(
          'Donation Confirmed ✅',
          `A successful donation was processed.`,
          0xfcd116, // Premium Gold / Yellow color matching original screenshots
          [
            {
              name: 'From',
              value: (donation as any).full_name || 'Anonymous Patriot',
              inline: true,
            },
            {
              name: 'Amount',
              value: `₵ ${Number((donation as any).amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              inline: true,
            },
            { name: 'Method', value: (donation as any).payment_method || 'Hubtel', inline: true },
            { name: 'Country', value: (donation as any).country || 'Ghana', inline: true },
            {
              name: 'Reference',
              value: (donation as any).reference || reference.substring(0, 8).toUpperCase(),
              inline: true,
            },
            { name: 'Campaign', value: campaignTitle, inline: true },
          ]
        )
      }

      if (donationError) throw donationError

      // Monthly dues: atomic RPC transition, checked before the store-order
      // fallback so dues references never mutate orders.
      let duesDecision: ReturnType<typeof monthlyDuesCallbackDecision> = null
      if (!donationDecision) {
        const { data: duesResult, error: duesError } = await supabaseAdmin.rpc(
          'apply_hubtel_monthly_dues_callback',
          {
            p_payment_id: reference,
            p_paid: paid,
            p_transaction_id: transactionId,
            p_amount_ghs: extractCallbackGhsAmount(payload),
          }
        )
        if (duesError) throw duesError

        duesDecision = monthlyDuesCallbackDecision(duesResult)
        if (duesDecision?.already) {
          return json({ success: true, paid, reference, already: true })
        }
        if (duesDecision?.alert) {
          await sendAlert(
            'Monthly dues amount mismatch',
            'A Hubtel callback reported a settlement amount that does not match the dues obligation. The payment was NOT marked paid — reconcile manually.',
            [
              { name: 'Reference', value: reference },
              { name: 'Transaction', value: transactionId ?? '—' },
            ]
          )
          return json({ success: false, paid, reference, mismatch: true })
        }
        if (duesDecision?.handled) {
          return json({ success: true, paid, reference })
        }
      }

      if (!donationDecision && !duesDecision) {
        // Idempotency: check if order is already finalized
        const { data: existingOrder } = await supabaseAdmin
          .from('store_orders')
          .select('id, payment_status')
          .eq('id', reference)
          .maybeSingle()

        if (existingOrder?.payment_status === 'Paid') {
          return json({ success: true, paid: true, reference, already: true })
        }

        const orderUpdate = paid
          ? {
              payment_status: 'Paid',
              payment_method: 'Hubtel',
              hubtel_reference: transactionId,
            }
          : {
              payment_status: 'Failed',
              payment_method: 'Hubtel',
              hubtel_reference: transactionId,
              status: 'Cancelled',
            }

        const { data: order, error: orderError } = await supabaseAdmin
          .from('store_orders')
          .update(orderUpdate)
          .eq('id', reference)
          .select('id, customer_id, points_redeemed, full_name, email, total_amount')
          .maybeSingle()

        if (orderError) throw orderError

        // Paid callback that matched neither a donation nor an order: money may
        // have been received but isn't recorded anywhere. Alert immediately.
        if (paid && !order) {
          await sendAlert(
            'Orphaned Hubtel payment',
            'A successful payment callback matched no donation or order. Funds may be unrecorded — investigate.',
            [
              { name: 'Reference', value: reference },
              { name: 'Transaction', value: transactionId ?? '—' },
            ]
          )
        }

        if (paid && order) {
          // Send Discord payment notification for store order
          await sendPaymentNotification(
            'Store Order Paid',
            `A store order of **₵${Number((order as any).total_amount).toFixed(2)}** was successfully paid.`,
            0xdaa520, // Accent / Brand Gold color
            [
              { name: 'Customer Name', value: (order as any).full_name || 'Anonymous Patriot' },
              { name: 'Order ID', value: order.id.substring(0, 8) },
              { name: 'Email', value: (order as any).email || '—' },
              { name: 'Transaction ID', value: transactionId || '—' },
            ]
          )
        }

        if (paid && order?.customer_id && Number(order.points_redeemed ?? 0) > 0) {
          const pointsRedeemed = Number(order.points_redeemed)
          const { data: existingRedemption, error: redemptionLookupError } = await supabaseAdmin
            .from('member_points')
            .select('id')
            .eq('user_id', order.customer_id)
            .eq('reference_id', order.id)
            .lt('points', 0)
            .maybeSingle()

          if (redemptionLookupError) throw redemptionLookupError

          if (!existingRedemption) {
            const { error: pointsError } = await supabaseAdmin.from('member_points').insert({
              user_id: order.customer_id,
              points: -pointsRedeemed,
              reason: `Store Redemption: Order #${order.id.substring(0, 8)}`,
              reference_id: order.id,
            })
            if (pointsError) throw pointsError
          }
        }
      }

      return json({ success: true, paid, reference })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[HUBTEL-CALLBACK-ERROR] ${message}`)

      await sendAlert('Hubtel callback processing error', message)
      return json({ error: message }, 400)
    }
  })
