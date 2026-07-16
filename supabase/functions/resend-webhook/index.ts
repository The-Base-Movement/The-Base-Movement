// @ts-nocheck
// THE BASE: RESEND WEBHOOK
// Receives Resend email events, persists them to newsletter_events, then
// refreshes aggregate delivery counts on the newsletters row. This is the
// Resend replacement for the old SendGrid Event Webhook (newsletter-webhook).
//
// Setup in Resend Dashboard → Webhooks → Add Endpoint:
//   Endpoint URL: {SUPABASE_URL}/functions/v1/resend-webhook
//   Events: email.delivered, email.bounced, email.complained,
//           email.opened, email.clicked, email.delivery_delayed
//   Copy the "Signing Secret" (whsec_...) into the Supabase secret below.
//
// verify_jwt: false — called by Resend, not a browser session (see config.toml).
// Required secret: RESEND_WEBHOOK_SECRET  (the whsec_... signing secret)
// Auto-injected:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Linking: send-newsletter tags each email with { name: 'newsletter_id', value }.
// Resend echoes tags in the webhook payload, so we recover the newsletter id here.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

// Resend event type → the event strings refresh_newsletter_delivery_stats aggregates on.
const EVENT_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounce',
  'email.complained': 'dropped',
  'email.opened': 'open',
  'email.clicked': 'click',
  'email.delivery_delayed': 'deferred',
}

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

// Svix signature verification (the scheme Resend uses).
async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  body: string
): Promise<boolean> {
  // Reject stale timestamps (>5 min) to prevent replay.
  const ts = Number(svixTimestamp)
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const secretBytes = base64ToBytes(secret.replace(/^whsec_/, ''))
  const signedContent = `${svixId}.${svixTimestamp}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent))
  const expected = bytesToBase64(new Uint8Array(sigBuf))

  // Header is space-separated "v1,<sig>" entries; match any.
  return svixSignature
    .split(' ')
    .map((part) => part.split(',')[1])
    .some((sig) => sig === expected)
}

function extractNewsletterId(tags: unknown): string | null {
  if (!tags) return null
  if (Array.isArray(tags)) {
    const t = tags.find((x) => x?.name === 'newsletter_id')
    return t?.value ?? null
  }
  if (typeof tags === 'object') {
    const v = (tags as Record<string, unknown>).newsletter_id
    return typeof v === 'string' ? v : null
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) {
    console.error('[RESEND-WEBHOOK] RESEND_WEBHOOK_SECRET not configured — refusing to process')
    return new Response('Service Unavailable', { status: 503, headers: corsHeaders })
  }

  const svixId = req.headers.get('svix-id') ?? ''
  const svixTimestamp = req.headers.get('svix-timestamp') ?? ''
  const svixSignature = req.headers.get('svix-signature') ?? ''
  const rawBody = await req.text()

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing signature headers', { status: 400, headers: corsHeaders })
  }

  const valid = await verifySvixSignature(secret, svixId, svixTimestamp, svixSignature, rawBody)
  if (!valid) {
    console.warn('[RESEND-WEBHOOK] Signature verification failed — rejected')
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  let payload: { type?: string; created_at?: string; data?: Record<string, unknown> }
  try {
    payload = JSON.parse(rawBody)
  } catch (e) {
    console.error('[RESEND-WEBHOOK] Bad JSON', e)
    return new Response('Bad Request', { status: 400, headers: corsHeaders })
  }

  const event = EVENT_MAP[payload.type ?? '']
  const data = payload.data ?? {}
  const emailId = (data.email_id as string) ?? null
  const to = data.to
  const email = Array.isArray(to) ? to[0] : (to as string | undefined)

  // Ignore event types we don't track (e.g. email.sent) — ack so Resend stops retrying.
  if (!event || !email || !emailId) {
    return new Response(JSON.stringify({ received: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const newsletterId = extractNewsletterId(data.tags)
  const row = {
    newsletter_id: newsletterId,
    email,
    event,
    // Reuse the sg_event_id column (partial-unique) as the idempotency key.
    // One row per (email, event type) — retries and repeat opens collapse.
    sg_event_id: `${emailId}:${event}`,
    reason: (data.reason as string) ?? null,
    occurred_at: payload.created_at ?? new Date().toISOString(),
  }

  const { error: insertError } = await supabase
    .from('newsletter_events')
    .upsert([row], { onConflict: 'sg_event_id', ignoreDuplicates: true })
  if (insertError) {
    console.error('[RESEND-WEBHOOK] Insert error', insertError.message)
    // 500 so Resend retries.
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (newsletterId) {
    const { error: rpcError } = await supabase.rpc('refresh_newsletter_delivery_stats', {
      p_ids: [newsletterId],
    })
    if (rpcError) {
      // Non-fatal — the event is persisted; aggregates catch up on the next event.
      console.warn('[RESEND-WEBHOOK] Aggregate refresh error', rpcError.message)
    }
  }

  return new Response(JSON.stringify({ received: 1 }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
