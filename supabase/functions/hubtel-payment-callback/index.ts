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
  fields?: { name: string; value: string }[]
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

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: Record<string, unknown> = {}
  try {
    payload = (await req.json()) as Record<string, unknown>
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid callback payload')
    }

    console.log('[HUBTEL-CALLBACK] Received payload:', JSON.stringify(payload))

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

    const donationUpdate = paid
      ? {
          status: 'Verified',
          payment_method: 'Hubtel',
          hubtel_reference: transactionId,
          cleared: true,
        }
      : {
          status: 'Rejected',
          payment_method: 'Hubtel',
          hubtel_reference: transactionId,
        }

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

    if (donationError) throw donationError

    if (!donation) {
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
          }

      const { data: order, error: orderError } = await supabaseAdmin
        .from('store_orders')
        .update(orderUpdate)
        .eq('id', reference)
        .select('id, customer_id, points_redeemed')
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

    let payloadDump = 'No payload'
    try {
      if (payload && Object.keys(payload).length > 0) {
        payloadDump = JSON.stringify(payload, null, 2)
      }
    } catch {
      payloadDump = 'Failed to stringify payload'
    }

    await sendAlert(
      'Hubtel callback processing error',
      `${message}\n\n**Payload:**\n\`\`\`json\n${payloadDump.substring(0, 1000)}\n\`\`\``
    )
    return json({ error: message }, 400)
  }
})
