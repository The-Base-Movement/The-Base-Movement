// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { convertToHubtelGhs, parseGhsExchangeRates } from './currency.ts'
import { normalizeHubtelPhone, isGhanaPhone } from './phone.ts'
import {
  ipKey,
  isIpRateLimited,
  referenceKey,
  registerIpAttempt,
  registerReferenceAttempt,
  remainingCooldown,
  type RateLimitEntry,
} from './rate-limit.ts'
import { buildSignedHubtelCallbackUrl } from '../hubtel-payment-shared/callback-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

type PaymentType = 'donation' | 'order' | 'monthly_dues' | 'payment'

interface InitiatePaymentBody {
  type?: PaymentType
  reference?: string
  amount?: number
  currency?: string
  name?: string
  phone?: string
  email?: string
  returnUrl?: string
  cancellationUrl?: string
  metadata?: Record<string, unknown>
}

const ipAttemptStore = new Map<string, RateLimitEntry>()
const referenceAttemptStore = new Map<string, RateLimitEntry>()

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function getRequiredEnv(name: string) {
  // @ts-expect-error: Deno global
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function getCheckoutUrl(payload: Record<string, unknown>) {
  const data = payload.Data ?? payload.data
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>
    const url =
      nested.checkoutUrl ??
      nested.CheckoutUrl ??
      nested.paymentUrl ??
      nested.PaymentUrl ??
      nested.checkoutDirectUrl
    if (typeof url === 'string') return url
  }

  const url =
    payload.checkoutUrl ??
    payload.CheckoutUrl ??
    payload.paymentUrl ??
    payload.PaymentUrl ??
    payload.checkoutDirectUrl
  return typeof url === 'string' ? url : null
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json()) as InitiatePaymentBody
    const type = body.type ?? 'payment'
    const reference = body.reference?.trim()
    const amount = Number(body.amount)
    const currency =
      body.currency?.trim().toUpperCase() ||
      (typeof body.metadata?.currency === 'string'
        ? body.metadata.currency.trim().toUpperCase()
        : 'GHS')
    const name = body.name?.trim()
    const phone = body.phone?.trim()

    if (!reference) throw new Error('reference is required')
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be greater than 0')
    if (!name) throw new Error('name is required')
    if (!phone) throw new Error('phone is required')

    const now = Date.now()
    const ip = clientIp(req)
    const currentIpEntry = ipAttemptStore.get(ipKey(ip))
    if (isIpRateLimited(now, currentIpEntry)) {
      return json({ error: 'Too many payment initiation attempts. Please try again later.' }, 429)
    }
    const currentReferenceEntry = referenceAttemptStore.get(referenceKey(ip, reference))
    const replayCooldownMs = remainingCooldown(now, currentReferenceEntry)
    if (replayCooldownMs > 0) {
      return json(
        {
          error: `This payment request was just started. Please wait ${Math.ceil(replayCooldownMs / 1000)} seconds and try again if needed.`,
        },
        429
      )
    }
    ipAttemptStore.set(ipKey(ip), registerIpAttempt(now, currentIpEntry))
    referenceAttemptStore.set(referenceKey(ip, reference), registerReferenceAttempt(now))

    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const clientId = getRequiredEnv('HUBTEL_API_ID')
    const clientSecret = getRequiredEnv('HUBTEL_API_KEY')
    const accountNumber = getRequiredEnv('HUBTEL_ACCOUNT_NUMBER')
    // @ts-expect-error: Deno global
    const baseUrl =
      Deno.env.get('HUBTEL_CHECKOUT_URL') ?? 'https://payproxyapi.hubtel.com/items/initiate'
    // @ts-expect-error: Deno global
    const exchangeRates = parseGhsExchangeRates(Deno.env.get('HUBTEL_GHS_EXCHANGE_RATES'))
    const settlement = convertToHubtelGhs(amount, currency, exchangeRates)

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    if (type === 'donation') {
      const { data: donation, error } = await supabaseAdmin
        .from('donations')
        .select('id, amount, status')
        .eq('id', reference)
        .single()

      if (error || !donation) throw new Error('Donation record was not found')
      if (Math.abs(Number(donation.amount) - settlement.ghsAmount) > 0.01) {
        throw new Error('Donation amount does not match the payment request')
      }
    }

    if (type === 'order') {
      const { data: order, error } = await supabaseAdmin
        .from('store_orders')
        .select('id, total_amount, payment_status')
        .eq('id', reference)
        .single()

      if (error || !order) throw new Error('Order record was not found')
      if (order.payment_status === 'Paid') throw new Error('Order has already been paid')
      if (Math.abs(Number(order.total_amount) - settlement.ghsAmount) > 0.01) {
        throw new Error('Order amount does not match the payment request')
      }
    }

    if (type === 'monthly_dues') {
      // The obligation snapshot, not the browser, decides amount/member/status.
      const { data: dues, error } = await supabaseAdmin
        .from('monthly_dues_payments')
        .select('id, amount_ghs, status, member_id')
        .eq('id', reference)
        .single()

      if (error || !dues) throw new Error('Monthly dues obligation was not found')
      if (['paid', 'waived', 'cancelled'].includes(dues.status)) {
        throw new Error('This month has already been settled')
      }
      if (Math.abs(Number(dues.amount_ghs) - settlement.ghsAmount) > 0.01) {
        throw new Error('Dues amount does not match the payment request')
      }
    }

    const primaryCallback = await buildSignedHubtelCallbackUrl(
      `${supabaseUrl}/functions/v1/hubtel-payment-callback`,
      reference
    )
    // @ts-expect-error: Deno global
    const secondaryCallbackBase = Deno.env.get('HUBTEL_SECONDARY_CALLBACK_URL')
    const secondaryCallback = secondaryCallbackBase
      ? await buildSignedHubtelCallbackUrl(secondaryCallbackBase, reference)
      : undefined
    const fallbackUrl =
      body.returnUrl ??
      // @ts-expect-error: Deno global
      Deno.env.get('PUBLIC_SITE_URL') ??
      // @ts-expect-error: Deno global
      Deno.env.get('SITE_URL') ??
      'https://www.thebasemovement.org.gh'

    const normalizedPhone = normalizeHubtelPhone(phone)
    if (!normalizedPhone) throw new Error('Enter a valid international phone number')
    const ghanaPhone = isGhanaPhone(normalizedPhone)

    const hubtelPayload = {
      totalAmount: Number(settlement.ghsAmount.toFixed(2)),
      currency: 'GHS',
      description:
        type === 'donation'
          ? 'The Base Movement donation'
          : type === 'order'
            ? 'The Base Movement store order'
            : type === 'monthly_dues'
              ? 'The Base Movement monthly dues'
              : 'The Base Movement payment',
      callbackUrl: primaryCallback,
      ...(secondaryCallback ? { secondaryCallbackUrl: secondaryCallback } : {}),
      returnUrl: body.returnUrl ?? fallbackUrl,
      cancellationUrl: body.cancellationUrl ?? fallbackUrl,
      merchantAccountNumber: accountNumber,
      clientReference: reference,
      customerName: name,
      customerPhoneNumber: normalizedPhone,
      customerEmail: body.email || 'donations@thebasemovement.org.gh',
      channels: ghanaPhone ? ['mobilemoney', 'card'] : ['card'],
      metadata: {
        ...(body.metadata ?? {}),
        sourceAmount: settlement.sourceAmount,
        sourceCurrency: settlement.sourceCurrency,
        exchangeRateToGhs: settlement.exchangeRateToGhs,
        ghsAmount: settlement.ghsAmount,
      },
      items: [
        {
          name:
            type === 'donation'
              ? 'Donation'
              : type === 'order'
                ? 'Store Order'
                : type === 'monthly_dues'
                  ? 'Monthly Dues'
                  : 'Payment',
          description:
            type === 'donation'
              ? 'Donation to The Base Movement'
              : type === 'order'
                ? 'The Base Movement merchandise order'
                : type === 'monthly_dues'
                  ? 'Voluntary monthly dues for The Base Movement'
                  : 'Payment to The Base Movement',
          quantity: 1,
          unitPrice: Number(settlement.ghsAmount.toFixed(2)),
        },
      ],
    }

    const auth = btoa(`${clientId}:${clientSecret}`)
    const hubtelRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(hubtelPayload),
    })

    const text = await hubtelRes.text()
    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = { raw: text }
    }

    if (!hubtelRes.ok) {
      console.error('[HUBTEL] Initiation failed', hubtelRes.status, payload)
      return json({ error: 'Hubtel payment initiation failed', details: payload }, 502)
    }

    const checkoutUrl = getCheckoutUrl(payload)
    if (!checkoutUrl) {
      console.error('[HUBTEL] Missing checkout URL', payload)
      return json({ error: 'Hubtel did not return a checkout URL', details: payload }, 502)
    }

    return json({ checkoutUrl, data: payload })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[HUBTEL-INIT-ERROR] ${message}`)
    return json({ error: message }, 400)
  }
})
