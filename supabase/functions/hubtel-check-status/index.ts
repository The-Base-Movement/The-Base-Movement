// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { requireServiceRoleCall } from '../_shared/admin-auth.ts'

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

function getRequiredEnv(name: string) {
  // @ts-expect-error: Deno global
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const serviceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { reference, type } = (await req.json()) as {
      reference?: string
      type?: 'donation' | 'order'
    }

    if (!reference?.trim()) throw new Error('reference is required')

    const clientId = getRequiredEnv('HUBTEL_API_ID')
    const clientSecret = getRequiredEnv('HUBTEL_API_KEY')
    getRequiredEnv('HUBTEL_ACCOUNT_NUMBER')

    // @ts-expect-error: Deno global
    const statusBaseUrl =
      Deno.env.get('HUBTEL_STATUS_URL') ?? 'https://payproxyapi.hubtel.com/items'

    const auth = btoa(`${clientId}:${clientSecret}`)
    const statusUrl = `${statusBaseUrl}/${encodeURIComponent(reference.trim())}/status`

    const hubtelRes = await fetch(statusUrl, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    })

    const text = await hubtelRes.text()
    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(text) as Record<string, unknown>
    } catch {
      payload = { raw: text }
    }

    if (!hubtelRes.ok) {
      console.error('[HUBTEL-STATUS] Check failed', hubtelRes.status, payload)
      return json({ error: 'Hubtel status check failed', details: payload }, 502)
    }

    const data = (payload.Data ?? payload.data ?? payload) as Record<string, unknown>
    const code =
      (data.ResponseCode as string) ??
      (data.responseCode as string) ??
      (payload.ResponseCode as string) ??
      (payload.responseCode as string) ??
      ''
    const transactionStatus =
      (data.Status as string) ??
      (data.status as string) ??
      (data.TransactionStatus as string) ??
      (payload.Status as string) ??
      ''
    const transactionId =
      (data.TransactionId as string) ??
      (data.transactionId as string) ??
      (data.ExternalTransactionId as string) ??
      ''

    const paid =
      code === '0000' ||
      ['success', 'successful', 'paid', 'completed'].includes(transactionStatus.toLowerCase())

    // Optionally reconcile with local DB
    if (type && reference) {
      const supabaseUrl = getRequiredEnv('SUPABASE_URL')
      const supabaseAdmin = createClient(supabaseUrl, serviceKey)

      if (type === 'donation') {
        const { data: donation } = await supabaseAdmin
          .from('donations')
          .select('id, status')
          .eq('id', reference.trim())
          .maybeSingle()

        if (donation && paid && donation.status !== 'Verified') {
          await supabaseAdmin
            .from('donations')
            .update({
              status: 'Verified',
              payment_method: 'Hubtel',
              hubtel_reference: transactionId || null,
              cleared: true,
              reference: reference.trim().substring(0, 8).toUpperCase(),
            })
            .eq('id', reference.trim())

          // Trigger receipt
          supabaseAdmin.functions
            .invoke('send-donation-receipt', { body: { donationId: reference.trim() } })
            .catch((e: unknown) => console.error('[HUBTEL-STATUS] Receipt failed:', e))
        }
      } else if (type === 'order') {
        const { data: order } = await supabaseAdmin
          .from('store_orders')
          .select('id, payment_status')
          .eq('id', reference.trim())
          .maybeSingle()

        if (order && paid && order.payment_status !== 'Paid') {
          await supabaseAdmin
            .from('store_orders')
            .update({
              payment_status: 'Paid',
              payment_method: 'Hubtel',
              hubtel_reference: transactionId || null,
            })
            .eq('id', reference.trim())
        }
      }
    }

    return json({
      paid,
      responseCode: code,
      transactionStatus,
      transactionId,
      hubtelResponse: payload,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[HUBTEL-STATUS-ERROR] ${message}`)
    return json({ error: message }, 400)
  }
})
