import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
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

async function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secretKey: string
) {
  if (!signature) return false
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  )
  const digest = await crypto.subtle.sign('HMAC', keyMaterial, new TextEncoder().encode(rawBody))
  const expected = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1)
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}

async function sendAlert(
  title: string,
  description: string,
  fields?: { name: string; value: string; inline?: boolean }[]
) {
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
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
            footer: { text: 'Paystack payment callback' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch (e) {
    console.error('[PAYSTACK-CALLBACK] alert dispatch failed:', e)
  }
}

async function sendPaymentNotification(
  title: string,
  description: string,
  color: number,
  fields?: { name: string; value: string; inline?: boolean }[]
) {
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
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
            footer: { text: 'Paystack payment callback' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch (e) {
    console.error('[PAYSTACK-CALLBACK] payment notification dispatch failed:', e)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const rawBody = await req.text()

  try {
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
    if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured')

    const signature = req.headers.get('x-paystack-signature')
    const validSignature = await verifyPaystackSignature(rawBody, signature, secretKey)
    if (!validSignature) throw new Error('Invalid Paystack signature')

    const event = JSON.parse(rawBody) as Record<string, unknown>
    const eventType = typeof event.event === 'string' ? event.event : ''
    const data = (event.data ?? {}) as Record<string, unknown>
    const metadata = (data.metadata ?? {}) as Record<string, unknown>

    // Only charge.success carries a confirmed payment; every other event is
    // acknowledged without mutating state (Paystack retries on non-2xx).
    if (eventType !== 'charge.success') {
      return json({ success: true, ignored: eventType })
    }

    const paid = true
    const transactionId =
      typeof data.reference === 'string'
        ? data.reference
        : typeof data.id === 'number'
          ? String(data.id)
          : null
    const reference =
      typeof metadata.dbReference === 'string' && metadata.dbReference.trim()
        ? metadata.dbReference.trim()
        : null
    const type = typeof metadata.type === 'string' ? metadata.type : null

    // No dbReference means this charge wasn't initiated through our own
    // paystack-initiate-payment flow (e.g. a "Send test webhook" from the
    // Paystack dashboard, or a stray manual transaction) -- it will never
    // resolve on retry. Acknowledge with 200 so Paystack stops retrying and
    // re-alerting on it, instead of throwing into the 400 path below.
    if (!reference || !transactionId) {
      console.warn('[PAYSTACK-CALLBACK] Ignored charge.success with no dbReference/transaction id')
      return json({ success: true, ignored: 'no_db_reference' })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    if (type === 'donation') {
      const { data: callbackResult, error } = await supabaseAdmin.rpc(
        'apply_paystack_donation_callback',
        { p_donation_id: reference, p_paid: paid, p_transaction_id: transactionId }
      )
      if (error) throw error
      if (!callbackResult?.matched) throw new Error('Donation reference not found')
      if (callbackResult.already_final)
        return json({ success: true, paid, reference, already: true })

      const { data: donation } = await supabaseAdmin
        .from('donations')
        .select('id, full_name, amount, reference, country, donation_campaigns(title)')
        .eq('id', reference)
        .maybeSingle()

      if (donation) {
        supabaseAdmin.functions
          .invoke('send-donation-receipt', { body: { donationId: reference } })
          .catch((e: unknown) => console.error('[PAYSTACK-CALLBACK] Receipt invocation failed:', e))

        const campaignTitle = (donation as any).donation_campaigns?.title || 'Strategic Fund'
        await sendPaymentNotification(
          'Donation Confirmed ✅',
          'A successful donation was processed.',
          0xfcd116,
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
            { name: 'Method', value: 'Paystack', inline: true },
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
      return json({ success: true, paid, reference })
    }

    if (type === 'group_donation') {
      const { data: groupResult, error } = await supabaseAdmin.rpc(
        'apply_paystack_group_donation_callback',
        { p_group_id: reference, p_paid: paid, p_transaction_id: transactionId }
      )
      if (error) throw error
      if (!groupResult?.matched) throw new Error('Group donation reference not found')
      if (groupResult.already_final) return json({ success: true, paid, reference, already: true })

      for (const donationId of (groupResult.donation_ids ?? []) as string[]) {
        supabaseAdmin.functions
          .invoke('send-donation-receipt', { body: { donationId } })
          .catch((e: unknown) =>
            console.error('[PAYSTACK-CALLBACK] Group receipt invocation failed:', e)
          )
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
          { name: 'Reference', value: reference.substring(0, 8).toUpperCase(), inline: true },
        ]
      )
      return json({ success: true, paid, reference })
    }

    if (type === 'monthly_dues') {
      const { data: duesResult, error } = await supabaseAdmin.rpc(
        'apply_paystack_monthly_dues_callback',
        {
          p_payment_id: reference,
          p_paid: paid,
          p_transaction_id: transactionId,
          p_amount_ghs: Number(metadata.ghsAmount) || null,
        }
      )
      if (error) throw error
      if (!duesResult?.matched) throw new Error('Monthly dues reference not found')
      if (duesResult.already_final) return json({ success: true, paid, reference, already: true })
      if (duesResult.amount_mismatch) {
        await sendAlert(
          'Monthly dues amount mismatch',
          'A Paystack callback reported a settlement amount that does not match the dues obligation. The payment was NOT marked paid — reconcile manually.',
          [
            { name: 'Reference', value: reference },
            { name: 'Transaction', value: transactionId },
          ]
        )
        await sendMonthlyDuesDiscordAlert({
          type: 'callback_anomaly',
          reference,
          detail: 'Settlement amount did not match the dues obligation; not marked paid.',
        })
        return json({ success: false, paid, reference, mismatch: true })
      }

      const { data: duesPayment } = await supabaseAdmin
        .from('monthly_dues_payments')
        .select('dues_month, amount_ghs, payment_mode, member_id')
        .eq('id', reference)
        .maybeSingle()
      let payer: { full_name: string | null; registration_number: string | null } | null = null
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
        mode:
          duesPayment?.payment_mode === 'recurring_hubtel' ||
          duesPayment?.payment_mode === 'recurring_paystack'
            ? 'recurring'
            : 'manual',
      })
      return json({ success: true, paid, reference })
    }

    // Store order: idempotency check first, then update + points redemption,
    // matching the equivalent Hubtel path.
    const { data: existingOrder } = await supabaseAdmin
      .from('store_orders')
      .select('id, payment_status')
      .eq('id', reference)
      .maybeSingle()

    if (existingOrder?.payment_status === 'Paid') {
      return json({ success: true, paid: true, reference, already: true })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('store_orders')
      .update({
        payment_status: 'Paid',
        payment_method: 'Paystack',
        paystack_reference: transactionId,
      })
      .eq('id', reference)
      .select('id, customer_id, points_redeemed, full_name, email, total_amount')
      .maybeSingle()

    if (orderError) throw orderError

    if (!order) {
      await sendAlert(
        'Orphaned Paystack payment',
        'A successful payment callback matched no donation, dues obligation, or order. Funds may be unrecorded — investigate.',
        [
          { name: 'Reference', value: reference },
          { name: 'Transaction', value: transactionId },
        ]
      )
      return json({ success: true, paid, reference, orphaned: true })
    }

    await sendPaymentNotification(
      'Store Order Paid',
      `A store order of **₵${Number((order as any).total_amount).toFixed(2)}** was successfully paid.`,
      0xdaa520,
      [
        { name: 'Customer Name', value: (order as any).full_name || 'Anonymous Compatriot' },
        { name: 'Order ID', value: order.id.substring(0, 8) },
        { name: 'Email', value: (order as any).email || '—' },
        { name: 'Transaction ID', value: transactionId },
      ]
    )

    if (order.customer_id && Number(order.points_redeemed ?? 0) > 0) {
      const pointsRedeemed = Number(order.points_redeemed)
      const { data: existingRedemption } = await supabaseAdmin
        .from('member_points')
        .select('id')
        .eq('user_id', order.customer_id)
        .eq('reference_id', order.id)
        .lt('points', 0)
        .maybeSingle()

      if (!existingRedemption) {
        await supabaseAdmin.from('member_points').insert({
          user_id: order.customer_id,
          points: -pointsRedeemed,
          reason: `Store Redemption: Order #${order.id.substring(0, 8)}`,
          reference_id: order.id,
        })
      }
    }

    return json({ success: true, paid, reference })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[PAYSTACK-CALLBACK-ERROR] ${message}`)
    await sendAlert('Paystack callback processing error', message)
    return json({ error: message }, 400)
  }
})
