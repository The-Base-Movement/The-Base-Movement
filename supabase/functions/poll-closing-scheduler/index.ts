// @ts-nocheck
// THE BASE: POLL CLOSING SCHEDULER
// Triggered daily at 08:00 GMT via Supabase cron.
// Finds polls closing within the next 24 hours that haven't sent a closing
// notification, marks them notified (optimistic), then calls send-poll-notification
// for each one.
//
// Cron: 0 8 * * * (Supabase Dashboard → Database → Cron Jobs)
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
  await supabase.from('polls').update({ closing_notified: true }).in('id', ids)

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
