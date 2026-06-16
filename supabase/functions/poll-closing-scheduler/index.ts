// @ts-nocheck
// THE BASE: POLL CLOSING SCHEDULER
// Runs hourly via Supabase cron. Two jobs:
//   1. Auto-close: any Active poll whose end_date has passed → status 'Closed',
//      announced to #polls.
//   2. Closing-soon: Active polls closing within 24h that haven't been notified
//      are marked (optimistic) and sent to send-poll-notification.
//
// Cron: 0 * * * * (pg_cron). Closing-soon is idempotent via closing_notified,
// so the hourly cadence does not re-notify.
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date().toISOString()
  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // ── Auto-close polls whose scheduled end_date has passed ──────────────────
  const { data: expired, error: expiredErr } = await supabase
    .from('polls')
    .select('id, question, title, total_votes')
    .eq('status', 'Active')
    .lte('end_date', now)

  if (expiredErr) {
    console.error('[POLL-SCHEDULER] Expired query error', expiredErr.message)
  } else if (expired && expired.length > 0) {
    const expiredIds = expired.map((p: { id: string }) => p.id)
    const { error: closeErr } = await supabase
      .from('polls')
      .update({ status: 'Closed' })
      .in('id', expiredIds)

    if (closeErr) {
      console.error('[POLL-SCHEDULER] Failed to auto-close polls', closeErr.message)
    } else {
      // Announce each auto-closed poll to #polls (non-fatal).
      for (const p of expired as Array<{
        question: string | null
        title: string | null
        total_votes: number | null
      }>) {
        await fetch(`${supabaseUrl}/functions/v1/discord-notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            channel: 'polls',
            embeds: [
              {
                title: '🗳️ Poll Closed',
                description: `**${p.question ?? p.title ?? 'Poll'}**`,
                color: 0x6f7a71,
                fields: [{ name: 'Total votes', value: String(p.total_votes ?? 0), inline: true }],
                footer: { text: 'Auto-closed on schedule' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        }).catch((e: unknown) => console.error('[POLL-SCHEDULER] Discord notify failed', e))
      }
      console.log(`[POLL-SCHEDULER] Auto-closed ${expiredIds.length} poll(s)`)
    }
  }

  // Find active polls closing within the next 24h that haven't been notified
  const { data: polls, error } = await supabase
    .from('polls')
    .select('id, title')
    .eq('status', 'Active')
    .eq('closing_notified', false)
    .gte('end_date', now)
    .lte('end_date', in24h)

  if (error) {
    console.error('[POLL-SCHEDULER] Query error', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!polls || polls.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log(`[POLL-SCHEDULER] Dispatching notifications for ${polls.length} poll(s)`)

  // Mark notified optimistically — prevents double-send on concurrent cron runs
  const ids = polls.map((p: { id: string }) => p.id)
  const { error: markError } = await supabase
    .from('polls')
    .update({ closing_notified: true })
    .in('id', ids)

  if (markError) {
    console.error(
      '[POLL-SCHEDULER] Failed to mark polls as notified — aborting to prevent double-send',
      markError.message
    )
    return new Response(
      JSON.stringify({ error: 'Failed to mark polls as notified', detail: markError.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const poll of polls as Array<{ id: string; title: string }>) {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-poll-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ pollId: poll.id }),
    })

    if (res.ok) {
      results.push({ id: poll.id, ok: true })
      console.log(`[POLL-SCHEDULER] Notified poll ${poll.id}`)
    } else {
      const errText = await res.text()
      console.error(`[POLL-SCHEDULER] Failed for poll ${poll.id}: ${errText}`)
      // Do NOT revert closing_notified — a missed send is preferable to a double-send
      results.push({ id: poll.id, ok: false, error: errText })
    }
  }

  return new Response(JSON.stringify({ dispatched: polls.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})
