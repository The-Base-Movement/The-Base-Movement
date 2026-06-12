// @ts-nocheck
// THE BASE: NEWSLETTER WEBHOOK
// Receives SendGrid Event Webhook POST, persists raw events to newsletter_events,
// then refreshes aggregate delivery counts on the newsletters row.
//
// Setup in SendGrid Dashboard → Settings → Mail Settings → Event Notifications:
//   HTTP POST URL: {SUPABASE_URL}/functions/v1/newsletter-webhook
//   Events to enable: delivered, bounce, dropped, deferred, open, click
//
// verify_jwt: false — called by SendGrid, not by a browser session.
// Required auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Optional secret: SENDGRID_WEBHOOK_SECRET
//   If set, the request must include the header X-Webhook-Secret matching this value.
//   Set it in both SendGrid (Notifications → "Send Custom Headers") and Supabase secrets.
//   Without this, the function URL itself acts as the shared secret — recommended to
//   pair with Supabase's IP allowlist for SendGrid's egress IPs in production.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

interface SendGridEvent {
  email: string
  timestamp: number // Unix epoch seconds
  event: string // delivered | bounce | dropped | deferred | open | click | ...
  sg_event_id?: string // SendGrid's dedup key
  sg_message_id?: string
  reason?: string // bounce/drop reason
  newsletter_id?: string // echoed from custom_args set in personalizations
  [key: string]: unknown
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  // --- Optional shared-secret verification ---
  const expectedSecret = Deno.env.get('SENDGRID_WEBHOOK_SECRET')
  if (expectedSecret) {
    const provided = req.headers.get('x-webhook-secret')
    if (provided !== expectedSecret) {
      console.warn('[WEBHOOK] Secret mismatch — rejected')
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }
  }

  let events: SendGridEvent[]
  try {
    events = await req.json()
    if (!Array.isArray(events)) throw new Error('payload is not an array')
  } catch (e) {
    console.error('[WEBHOOK] Bad payload', e)
    return new Response('Bad Request', { status: 400, headers: corsHeaders })
  }

  if (events.length === 0) {
    return new Response(JSON.stringify({ received: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Build rows for newsletter_events — filter out events without an email
  const rows = events
    .filter((e) => e.email)
    .map((e) => ({
      newsletter_id: e.newsletter_id ?? null,
      email: e.email,
      event: e.event,
      sg_event_id: e.sg_event_id ?? null,
      reason: e.reason ?? null,
      occurred_at: new Date(e.timestamp * 1000).toISOString(),
    }))

  if (rows.length > 0) {
    // upsert on sg_event_id to make the handler idempotent (SendGrid may retry)
    const { error: insertError } = await supabase
      .from('newsletter_events')
      .upsert(rows, { onConflict: 'sg_event_id', ignoreDuplicates: true })
    if (insertError) {
      console.error('[WEBHOOK] Insert error', insertError.message)
      // Return 500 so SendGrid retries
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Refresh aggregate counts for affected newsletters
  const affectedIds = [
    ...new Set(rows.filter((r) => r.newsletter_id).map((r) => r.newsletter_id as string)),
  ]
  if (affectedIds.length > 0) {
    const { error: rpcError } = await supabase.rpc('refresh_newsletter_delivery_stats', {
      p_ids: affectedIds,
    })
    if (rpcError) {
      // Non-fatal — events are already persisted; aggregates will be stale but correct on next webhook
      console.warn('[WEBHOOK] Aggregate refresh error', rpcError.message)
    }
  }

  console.log(`[WEBHOOK] Processed ${rows.length} events (${affectedIds.length} newsletters)`)

  return new Response(JSON.stringify({ received: rows.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
