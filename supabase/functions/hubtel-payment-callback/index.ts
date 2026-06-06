// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const payload = (await req.json()) as Record<string, unknown>
    const reference = getString(payload, [
      'ClientReference',
      'clientReference',
      'client_reference',
      'Reference',
      'reference',
    ])

    if (!reference) throw new Error('Missing Hubtel client reference')

    const transactionId = getString(payload, [
      'TransactionId',
      'transactionId',
      'TransactionID',
      'checkoutId',
      'paymentId',
      'ExternalTransactionId',
      'externalTransactionId',
    ])

    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const paid = isSuccessful(payload)

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

      const { error: orderError } = await supabaseAdmin
        .from('store_orders')
        .update(orderUpdate)
        .eq('id', reference)

      if (orderError) throw orderError
    }

    return json({ success: true, paid, reference })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[HUBTEL-CALLBACK-ERROR] ${message}`)
    return json({ error: message }, 400)
  }
})
