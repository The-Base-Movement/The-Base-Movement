// THE BASE: SMS GATEWAY WEBHOOK RECEIVER CALLBACK
// Receives real-time delivery status receipts from MNotify and logs them.

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return diff === 0
}

function getExpectedCallbackSecret() {
  // @ts-expect-error: Deno global
  return Deno.env.get('MNOTIFY_CALLBACK_SECRET') ?? Deno.env.get('MNOTIFY_API_KEY') ?? ''
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const expectedSecret = getExpectedCallbackSecret().trim()
    if (!expectedSecret) {
      return new Response(JSON.stringify({ error: 'Callback secret is not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503,
      })
    }

    const providedSecret =
      req.headers.get('x-webhook-secret')?.trim() ??
      new URL(req.url).searchParams.get('token')?.trim() ??
      ''
    if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // 1. Initialize Supabase Admin client
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Parse MNotify webhook payload (can be JSON or x-www-form-urlencoded)
    let payload: Record<string, unknown> = {}
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      payload = Object.fromEntries(params.entries())
    }

    console.log('[SMS-CALLBACK] Received MNotify callback payload:', JSON.stringify(payload))

    // 3. Extract status receipt variables
    const recipient = String(payload.recipient || payload.to || '').trim()
    const messageId = String(payload.id || payload.message_id || '').trim()
    const status = String(payload.status || 'unknown').trim()
    const network = payload.network ? String(payload.network).trim() : null
    const errorCode =
      payload.error_code || payload.code ? String(payload.error_code || payload.code).trim() : null

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'Recipient is required in callback payload.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 4. Insert status tracking record into database logs
    const { error } = await supabaseAdmin.from('sms_delivery_logs').insert({
      recipient,
      message_id: messageId || null,
      status,
      network,
      error_code: errorCode,
    })

    if (error) {
      console.error('[SMS-CALLBACK] Failed to insert delivery log:', error.message)
      throw error
    }

    console.log(
      `[SMS-CALLBACK] Successfully logged delivery status "${status}" for recipient ${recipient}`
    )

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SMS-CALLBACK-ERROR] ${errorMessage}`)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
