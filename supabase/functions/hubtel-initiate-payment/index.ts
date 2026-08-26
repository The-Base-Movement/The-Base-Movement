// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { convertToHubtelGhs, parseGhsExchangeRates } from './currency.ts'
import { normalizeHubtelPhone, isGhanaPhone } from './phone.ts'
import { buildSignedHubtelCallbackUrl } from '../hubtel-payment-shared/callback-auth.ts'

import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'

type PaymentType = 'donation' | 'group_donation' | 'order' | 'monthly_dues'

const ALLOWED_REDIRECT_ORIGINS = [
  'https://www.thebasemovement.org.gh',
  'https://thebasemovement.org.gh',
  'http://localhost:3000',
  'http://localhost:5173',
]

function validateRedirectUrl(urlStr?: string): string {
  const fallback = 'https://www.thebasemovement.org.gh/donate'
  if (!urlStr) return fallback
  try {
    const parsed = new URL(urlStr)
    if (ALLOWED_REDIRECT_ORIGINS.includes(parsed.origin)) {
      return parsed.toString()
    }
    return fallback
  } catch {
    return fallback
  }
}

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

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function getRequiredEnv(name: string) {
  // @ts-ignore: Deno global
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

// @ts-ignore: Deno global
Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflight(req)

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = (await req.json()) as InitiatePaymentBody
    const type = body.type as PaymentType
    if (!['donation', 'group_donation', 'order', 'monthly_dues'].includes(type)) {
      throw new Error(
        'Invalid payment type. Must be donation, group_donation, order, or monthly_dues'
      )
    }
    const reference = body.reference?.trim()
    const name = body.name?.trim()
    const phone = body.phone?.trim()

    if (!reference) throw new Error('reference is required')
    if (!name) throw new Error('name is required')
    if (!phone) throw new Error('phone is required')

    const ip = clientIp(req)
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const ipRateCheck = await checkPersistentRateLimit(supabaseAdmin, `hubtel-ip::${ip}`, 20, 600)
    if (!ipRateCheck.allowed) {
      return json({ error: 'Too many payment initiation attempts. Please try again later.' }, 429)
    }
    const refRateCheck = await checkPersistentRateLimit(
      supabaseAdmin,
      `hubtel-ref::${ip}::${reference}`,
      3,
      30
    )
    if (!refRateCheck.allowed) {
      return json(
        {
          error: `This payment request was just started. Please wait ${refRateCheck.retry_after_sec} seconds and try again if needed.`,
        },
        429
      )
    }

    let trustedAmount = 0
    let trustedCurrency = 'GHS'
    let trustedDescription = 'The Base Movement payment'

    if (type === 'donation') {
      const { data: donation, error } = await supabaseAdmin
        .from('donations')
        .select('id, amount, status')
        .eq('id', reference)
        .single()

      if (error || !donation) throw new Error('Donation record was not found')
      trustedAmount = Number(donation.amount)
      trustedCurrency = 'GHS'
      trustedDescription = 'The Base Movement donation'
    } else if (type === 'group_donation') {
      const { data: rows, error } = await supabaseAdmin
        .from('donations')
        .select('amount, status')
        .eq('group_id', reference)

      if (error || !rows?.length) throw new Error('Group donation was not found')
      if (rows.some((r: { status: string }) => r.status !== 'Pending')) {
        throw new Error('Group donation has already been processed')
      }
      trustedAmount = rows.reduce(
        (sum: number, r: { amount: number | string }) => sum + Number(r.amount),
        0
      )
      trustedCurrency = 'GHS'
      trustedDescription = 'The Base Movement group donation'
    } else if (type === 'order') {
      const { data: order, error } = await supabaseAdmin
        .from('store_orders')
        .select('id, total_amount, currency, payment_status')
        .eq('id', reference)
        .single()

      if (error || !order) throw new Error('Order record was not found')
      if (order.payment_status === 'Paid') throw new Error('Order has already been paid')
      trustedAmount = Number(order.total_amount)
      trustedCurrency = (order.currency || 'GHS').toUpperCase()
      trustedDescription = 'The Base Movement store order'
    } else if (type === 'monthly_dues') {
      const { data: dues, error } = await supabaseAdmin
        .from('monthly_dues_payments')
        .select('id, amount_ghs, status')
        .eq('id', reference)
        .single()

      if (error || !dues) throw new Error('Monthly dues obligation was not found')
      if (['paid', 'waived', 'cancelled'].includes(dues.status)) {
        throw new Error('This month has already been settled')
      }
      trustedAmount = Number(dues.amount_ghs)
      trustedCurrency = 'GHS'
      trustedDescription = 'The Base Movement monthly dues'
    }

    if (!Number.isFinite(trustedAmount) || trustedAmount <= 0) {
      throw new Error('Obligation amount must be greater than 0')
    }

    const clientId = getRequiredEnv('HUBTEL_API_ID')
    const clientSecret = getRequiredEnv('HUBTEL_API_KEY')
    const accountNumber = getRequiredEnv('HUBTEL_ACCOUNT_NUMBER')
    // @ts-ignore: Deno global
    const baseUrl =
      Deno.env.get('HUBTEL_CHECKOUT_URL') ?? 'https://payproxyapi.hubtel.com/items/initiate'
    // @ts-ignore: Deno global
    const exchangeRates = parseGhsExchangeRates(Deno.env.get('HUBTEL_GHS_EXCHANGE_RATES'))
    // Calculate settlement from trusted DB values — never from client-supplied amount
    const settlement = convertToHubtelGhs(trustedAmount, trustedCurrency, exchangeRates)

    const shortRef = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
    const hubtelClientRef = `${shortRef}_${Date.now().toString(36)}`
    const primaryCallback = await buildSignedHubtelCallbackUrl(
      `${supabaseUrl}/functions/v1/hubtel-payment-callback`,
      hubtelClientRef,
      undefined,
      reference
    )
    // @ts-ignore: Deno global
    const secondaryCallbackBase = Deno.env.get('HUBTEL_SECONDARY_CALLBACK_URL')
    const secondaryCallback = secondaryCallbackBase
      ? await buildSignedHubtelCallbackUrl(
          secondaryCallbackBase,
          hubtelClientRef,
          undefined,
          reference
        )
      : undefined

    const normalizedPhone = normalizeHubtelPhone(phone)
    if (!normalizedPhone) throw new Error('Enter a valid international phone number')
    const ghanaPhone = isGhanaPhone(normalizedPhone)

    // Only server-trusted fields are forwarded — no arbitrary body.metadata spread
    const hubtelPayload = {
      totalAmount: Number(settlement.ghsAmount.toFixed(2)),
      currency: 'GHS',
      description: trustedDescription,
      callbackUrl: primaryCallback,
      ...(secondaryCallback ? { secondaryCallbackUrl: secondaryCallback } : {}),
      returnUrl: validateRedirectUrl(body.returnUrl),
      cancellationUrl: validateRedirectUrl(body.cancellationUrl),
      merchantAccountNumber: accountNumber,
      clientReference: hubtelClientRef,
      customerName: name,
      customerPhoneNumber: normalizedPhone,
      customerEmail: body.email || 'donations@thebasemovement.org.gh',
      channels: ghanaPhone ? ['mobilemoney', 'card'] : ['card'],
      metadata: {
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
              : type === 'group_donation'
                ? 'Group Donation'
                : type === 'order'
                  ? 'Store Order'
                  : type === 'monthly_dues'
                    ? 'Monthly Dues'
                    : 'Payment',
          description:
            type === 'donation'
              ? 'Donation to The Base Movement'
              : type === 'group_donation'
                ? 'Group donation to The Base Movement'
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
      const diagnostics = {
        hubtelStatus: hubtelRes.status,
        wwwAuthenticate: hubtelRes.headers.get('www-authenticate'),
        baseUrl,
        hasApiId: Boolean(clientId),
        hasApiKey: Boolean(clientSecret),
        merchantAccountSuffix: accountNumber.slice(-4),
      }
      console.error('[HUBTEL] Initiation failed', diagnostics, payload)
      let errorDetail = ''
      if (
        Array.isArray(payload.data) &&
        (payload.data as Record<string, unknown>[])[0]?.errorMessage
      ) {
        errorDetail = String((payload.data as Record<string, unknown>[])[0].errorMessage)
      } else if (typeof payload.message === 'string') {
        errorDetail = payload.message
      } else if (typeof payload.Message === 'string') {
        errorDetail = payload.Message
      } else if (hubtelRes.status === 401) {
        errorDetail =
          'Hubtel authorization failed. Secure checkout is temporarily unavailable while payment gateway access is being verified.'
      } else if (typeof payload.raw === 'string' && payload.raw.trim() === '') {
        errorDetail = 'Hubtel returned an empty error response.'
      } else {
        errorDetail = JSON.stringify(payload)
      }
      return json(
        {
          error:
            hubtelRes.status === 401
              ? errorDetail
              : `Hubtel payment initiation failed (${hubtelRes.status}): ${errorDetail}`,
          details: diagnostics,
        },
        hubtelRes.status === 401 ? 502 : 400
      )
    }

    const checkoutUrl = getCheckoutUrl(payload)
    if (!checkoutUrl) {
      console.error('[HUBTEL] Missing checkout URL', payload)
      return json({ error: 'Hubtel did not return a checkout URL' }, 400)
    }

    // Only the checkout URL is ever needed client-side. Hubtel's own API
    // docs confirm their response never echoes the signed callbackUrl we
    // send them, but forwarding their raw response verbatim is needless
    // exposure that would silently become a payment-forgery risk if that
    // ever changed -- the signed ref+sig would let anyone replay a fake
    // "payment succeeded" webhook. No reason to carry that risk implicitly.
    return json({ checkoutUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[HUBTEL-INIT-ERROR] ${message}`)
    return json({ error: message }, 400)
  }
})
