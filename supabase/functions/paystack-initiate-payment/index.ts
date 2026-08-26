// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { convertToHubtelGhs, parseGhsExchangeRates } from '../hubtel-initiate-payment/currency.ts'

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
    if (!reference) throw new Error('reference is required')

    const email = body.email?.trim() || 'donations@thebasemovement.org.gh'

    const ip = clientIp(req)
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseServiceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const ipRateCheck = await checkPersistentRateLimit(supabaseAdmin, `paystack-ip::${ip}`, 20, 600)
    if (!ipRateCheck.allowed) {
      return json({ error: 'Too many payment initiation attempts. Please try again later.' }, 429)
    }
    const refRateCheck = await checkPersistentRateLimit(
      supabaseAdmin,
      `paystack-ref::${ip}::${reference}`,
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

    const secretKey = getRequiredEnv('PAYSTACK_SECRET_KEY')
    // @ts-ignore: Deno global
    const exchangeRates = parseGhsExchangeRates(Deno.env.get('HUBTEL_GHS_EXCHANGE_RATES'))
    // Settle in GHS the same way Hubtel does — never trust the client-supplied amount.
    const settlement = convertToHubtelGhs(trustedAmount, trustedCurrency, exchangeRates)

    const shortRef = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
    const paystackReference = `${shortRef}_${Date.now().toString(36)}`

    const callbackUrl = validateRedirectUrl(body.returnUrl)

    // Only server-trusted fields are forwarded — no arbitrary body.metadata spread
    const paystackPayload = {
      email,
      amount: Math.round(settlement.ghsAmount * 100), // Paystack expects amount in pesewas
      currency: 'GHS',
      reference: paystackReference,
      callback_url: callbackUrl,
      metadata: {
        dbReference: reference,
        type,
        sourceAmount: settlement.sourceAmount,
        sourceCurrency: settlement.sourceCurrency,
        exchangeRateToGhs: settlement.exchangeRateToGhs,
        ghsAmount: settlement.ghsAmount,
        description: trustedDescription,
      },
    }

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    })

    const text = await paystackRes.text()
    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = { raw: text }
    }

    if (!paystackRes.ok || payload.status === false) {
      console.error('[PAYSTACK] Initiation failed', paystackRes.status, payload)
      const errorDetail =
        typeof payload.message === 'string' ? payload.message : JSON.stringify(payload)
      return json(
        { error: `Paystack payment initiation failed: ${errorDetail}`, details: payload },
        paystackRes.status === 401 ? 502 : 400
      )
    }

    const data = payload.data as Record<string, unknown> | undefined
    const authorizationUrl = data?.authorization_url
    if (typeof authorizationUrl !== 'string' || !authorizationUrl) {
      console.error('[PAYSTACK] Missing authorization_url', payload)
      return json({ error: 'Paystack did not return an authorization URL', details: payload }, 400)
    }

    // Store the Paystack transaction reference against the DB record so the
    // webhook (which only receives Paystack's own reference) can map back to
    // it without relying solely on metadata.dbReference.
    const referenceColumn = { paystack_reference: paystackReference }
    if (type === 'donation') {
      await supabaseAdmin.from('donations').update(referenceColumn).eq('id', reference)
    } else if (type === 'group_donation') {
      await supabaseAdmin.from('donations').update(referenceColumn).eq('group_id', reference)
    } else if (type === 'order') {
      await supabaseAdmin.from('store_orders').update(referenceColumn).eq('id', reference)
    } else if (type === 'monthly_dues') {
      await supabaseAdmin
        .from('monthly_dues_payments')
        .update({ provider_transaction_id: paystackReference })
        .eq('id', reference)
    }

    return json({ checkoutUrl: authorizationUrl, reference: paystackReference })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[PAYSTACK-INIT-ERROR] ${message}`)
    return json({ error: message }, 400)
  }
})
