// @ts-nocheck
// THE BASE: NEWSLETTER SCHEDULER
// Triggered on a cron schedule (every minute via Supabase Cron or external scheduler).
// Finds all newsletters with status = 'scheduled' and scheduled_at <= now(),
// then invokes send-newsletter for each one.
//
// Invoke via cron:  POST {SUPABASE_URL}/functions/v1/newsletter-scheduler
// Suggested cron:   every 1 minute (Supabase Dashboard → Edge Functions → Cron)
//
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()

  // This endpoint is intended for Supabase Cron or other operator-owned
  // automation only. Do not allow ordinary authenticated user JWTs to force
  // service-role newsletter dispatch.
  if (!jwt || jwt !== serviceKey) {
    return new Response(JSON.stringify({ error: 'Not authorized.' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Fetch all newsletters due to send
  const { data: due, error } = await supabase
    .from('newsletters')
    .select('id, subject, body_html, audience_type, audience_value, audience_filters, sent_by')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error) {
    console.error('[SCHEDULER] Query error', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!due || due.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[SCHEDULER] Dispatching ${due.length} newsletter(s)`)

  // Mark each as 'sent' optimistically so concurrent runs don't double-dispatch
  const ids = due.map((n: { id: string }) => n.id)
  await supabase.from('newsletters').update({ status: 'sent', error_message: null }).in('id', ids)

  // Invoke send-newsletter for each one
  const results: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const n of due as Array<{
    id: string
    subject: string
    body_html: string
    audience_type: string
    audience_value: string | null
    audience_filters: unknown
    sent_by: string | null
  }>) {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        newsletter_id: n.id,
        subject: n.subject,
        body_html: n.body_html,
        audience_type: n.audience_type,
        audience_value: n.audience_value,
        audience_filters: n.audience_filters ?? [],
        sent_by: n.sent_by,
      }),
    })

    if (res.ok) {
      results.push({ id: n.id, ok: true })
    } else {
      const errText = await res.text()
      console.error(`[SCHEDULER] send-newsletter failed for ${n.id}: ${errText}`)
      // Revert to failed so the UI shows it
      await supabase
        .from('newsletters')
        .update({ status: 'failed', error_message: `Scheduler: ${errText}` })
        .eq('id', n.id)
      results.push({ id: n.id, ok: false, error: errText })
    }
  }

  return new Response(JSON.stringify({ dispatched: due.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
