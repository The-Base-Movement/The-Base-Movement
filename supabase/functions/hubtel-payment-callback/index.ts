// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { verifyHubtelCallbackSignature } from '../hubtel-payment-shared/callback-auth.ts'
import { sendMonthlyDuesDiscordAlert } from '../_shared/monthly-dues-discord.ts'

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

/**
 * Provider's own wording for why a payment did not go through, for the failure
 * alerts. Hubtel is inconsistent about casing and field name, so read the same
 * candidates isSuccessful() does.
 */
function statusMessage(payload: Record<string, unknown>): string {
  return (
    getString(payload, ['Message', 'message', 'Description', 'description']) ??
    getString(payload, ['Status', 'status', 'TransactionStatus', 'transactionStatus']) ??
    'Unknown'
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

      const rawReference = getString(payload, [
        'ClientReference',
        'clientReference',
        'client_reference',
        'Reference',
        'reference',
      ])

      const callbackAuth = await verifyHubtelCallbackSignature(req.url, rawReference || '')
      if (!callbackAuth.ok) throw new Error(callbackAuth.reason)

      const url = new URL(req.url)
      const reference = url.searchParams.get('dbRef')?.trim() || callbackAuth.reference

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
              value: (donation as any).full_name || 'Anonymous Compatriot',
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

      // Failed single donation. Only successes were ever announced, so a member
      // whose payment failed left no trace on the payments channel and nobody
      // could follow up.
      if (donationDecision && !paid) {
        const { data: failed } = await supabaseAdmin
          .from('donations')
          .select('full_name, amount, payment_method, country')
          .eq('id', reference)
          .maybeSingle()
        await sendPaymentNotification(
          'Donation Failed ❌',
          'A donation attempt did not complete.',
          0xce1126,
          [
            { name: 'From', value: failed?.full_name || 'Anonymous Compatriot', inline: true },
            {
              name: 'Amount',
              value: failed
                ? `₵ ${Number(failed.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—',
              inline: true,
            },
            { name: 'Method', value: failed?.payment_method || 'Hubtel', inline: true },
            { name: 'Country', value: failed?.country || 'Ghana', inline: true },
            { name: 'Reference', value: reference.substring(0, 8).toUpperCase(), inline: true },
            { name: 'Reason', value: statusMessage(payload), inline: true },
          ]
        )
      }

      if (donationError) throw donationError

      // Group donations: the reference is a shared group_id settling every
      // member row at once. Each row's points trigger fires individually.
      if (!donationDecision) {
        const { data: groupResult, error: groupError } = await supabaseAdmin.rpc(
          'apply_hubtel_group_donation_callback',
          { p_group_id: reference, p_paid: paid, p_transaction_id: transactionId }
        )
        if (groupError) throw groupError

        if (groupResult?.matched) {
          if (groupResult.already_final) {
            return json({ success: true, paid, reference, already: true })
          }
          if (paid) {
            for (const donationId of (groupResult.donation_ids ?? []) as string[]) {
              supabaseAdmin.functions
                .invoke('send-donation-receipt', { body: { donationId } })
                .catch((e: unknown) => {
                  console.error('[HUBTEL-CALLBACK] Group receipt invocation failed:', e)
                })
            }
            await sendPaymentNotification(
              'Group Donation Confirmed ✅',
              'A successful group donation was processed.',
              0xfcd116,
              [
                {
                  name: 'Group',
                  value: (groupResult.group_name as string) || 'Unnamed group',
                  inline: true,
                },
                {
                  name: 'Paid by',
                  value: (groupResult.paid_by_name as string) || 'Anonymous Compatriot',
                  inline: true,
                },
                { name: 'Members', value: String(groupResult.member_count ?? '—'), inline: true },
                {
                  name: 'Amount',
                  value: `₵ ${Number(groupResult.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  inline: true,
                },
                {
                  name: 'Reference',
                  value: reference.substring(0, 8).toUpperCase(),
                  inline: true,
                },
              ]
            )
          } else {
            // Failed group donation — one organiser covering several people, so
            // a silent failure strands the whole group.
            await sendPaymentNotification(
              'Group Donation Failed ❌',
              'A group donation attempt did not complete.',
              0xce1126,
              [
                {
                  name: 'Group',
                  value: (groupResult.group_name as string) || 'Unnamed group',
                  inline: true,
                },
                {
                  name: 'Paid by',
                  value: (groupResult.paid_by_name as string) || 'Anonymous Compatriot',
                  inline: true,
                },
                { name: 'Members', value: String(groupResult.member_count ?? '—'), inline: true },
                {
                  name: 'Amount',
                  value: `₵ ${Number(groupResult.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  inline: true,
                },
                {
                  name: 'Reference',
                  value: reference.substring(0, 8).toUpperCase(),
                  inline: true,
                },
                { name: 'Reason', value: statusMessage(payload), inline: true },
              ]
            )
          }
          return json({ success: true, paid, reference })
        }
      }

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
          await sendMonthlyDuesDiscordAlert({
            type: 'callback_anomaly',
            reference,
            detail: 'Settlement amount did not match the dues obligation; not marked paid.',
          })
          return json({ success: false, paid, reference, mismatch: true })
        }
        if (duesDecision?.handled) {
          if (paid) {
            const { data: duesPayment } = await supabaseAdmin
              .from('monthly_dues_payments')
              .select('dues_month, amount_ghs, payment_mode, member_id')
              .eq('id', reference)
              .maybeSingle()
            // Name the payer: a truncated reference alone does not tell finance
            // staff who paid. Best-effort — a lookup failure must not block the
            // alert, which is why this is a separate query.
            let payer: { full_name: string | null; registration_number: string | null } | null =
              null
            if (duesPayment?.member_id) {
              const { data } = await supabaseAdmin
                .from('users')
                .select('full_name, registration_number')
                .eq('id', duesPayment.member_id)
                .maybeSingle()
              payer = data ?? null
            }
            await sendMonthlyDuesDiscordAlert({
              type: 'payment_success',
              reference,
              memberName: payer?.full_name ?? undefined,
              registrationNumber: payer?.registration_number ?? undefined,
              month: duesPayment?.dues_month ?? undefined,
              amountGhs: duesPayment ? Number(duesPayment.amount_ghs) : undefined,
              currency: 'GHS',
              mode: duesPayment?.payment_mode === 'recurring_hubtel' ? 'recurring' : 'manual',
            })
          } else {
            // Failed dues payment. Dues are recurring obligations, so a silent
            // failure quietly puts the member into arrears.
            const { data: duesPayment } = await supabaseAdmin
              .from('monthly_dues_payments')
              .select('dues_month, amount_ghs, member_id')
              .eq('id', reference)
              .maybeSingle()
            let payer: { full_name: string | null; registration_number: string | null } | null =
              null
            if (duesPayment?.member_id) {
              const { data } = await supabaseAdmin
                .from('users')
                .select('full_name, registration_number')
                .eq('id', duesPayment.member_id)
                .maybeSingle()
              payer = data ?? null
            }
            await sendPaymentNotification(
              'Monthly Dues Failed ❌',
              'A monthly dues payment did not complete.',
              0xce1126,
              [
                {
                  name: 'Member',
                  value: payer?.full_name
                    ? payer.registration_number
                      ? `${payer.full_name} · ${payer.registration_number}`
                      : payer.full_name
                    : 'Unknown member',
                  inline: true,
                },
                { name: 'Month', value: duesPayment?.dues_month ?? '—', inline: true },
                {
                  name: 'Amount',
                  value: duesPayment ? `GHS ${Number(duesPayment.amount_ghs).toFixed(2)}` : '—',
                  inline: true,
                },
                { name: 'Reference', value: reference.substring(0, 8).toUpperCase(), inline: true },
                { name: 'Reason', value: statusMessage(payload), inline: true },
              ]
            )
          }
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
              { name: 'Customer Name', value: (order as any).full_name || 'Anonymous Compatriot' },
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
