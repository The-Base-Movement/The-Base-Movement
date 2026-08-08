// activity-feed â†’ Discord
//
// Near-real-time feed of member activity (logins, logouts, on-site actions).
// Invoked by a pg_cron job every few minutes. Reads new rows from
// user_activity_logs since a stored cursor, posts them to Discord
// (DISCORD_ACTIVITY_WEBHOOK_URL), then advances the cursor.
//
// Batched + capped (BATCH_LIMIT per run) so it never floods the channel or
// trips Discord's webhook rate limit; anything beyond the cap flows on the
// next run because the cursor only advances past what was actually posted.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CURSOR_KEY = 'activity_feed_cursor'
const BATCH_LIMIT = 50
const DISCORD_MAX = 1900 // stay under Discord's 2000-char message limit

interface ActivityRow {
  id: string
  user_id: string
  action_type: string | null
  description: string | null
  created_at: string
}

function icon(actionType: string | null): string {
  switch ((actionType || '').toLowerCase()) {
    case 'login':
      return 'ðŸŸ¢'
    case 'logout':
      return 'ðŸ”´'
    default:
      return 'â–«ï¸'
  }
}

function hhmm(iso: string): string {
  // Ghana is UTC+0, so UTC time is local time.
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

async function postToDiscord(webhookUrl: string, content: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Discord returned ${res.status}: ${detail}`)
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookUrl = Deno.env.get('DISCORD_ACTIVITY_WEBHOOK_URL')
    const cronToken = Deno.env.get('DISCORD_ACTIVITY_CRON_TOKEN')

    if (!webhookUrl) {
      console.error('[ACTIVITY-FEED] DISCORD_ACTIVITY_WEBHOOK_URL is not set.')
      return json({ error: 'DISCORD_ACTIVITY_WEBHOOK_URL secret missing.' }, 500, corsHeaders)
    }

    // Dedicated cron token (decoupled from the ambiguous injected service-role
    // key, whose format differs once a project migrates to sb_secret_* keys).
    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
    if (!cronToken || bearer !== cronToken) {
      return json({ error: 'Not authorized.' }, 401, corsHeaders)
    }

    const restHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    }

    // 1. Read the cursor (default: 15 minutes ago on first ever run).
    const cursorRes = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=eq.${CURSOR_KEY}&select=value`,
      { headers: restHeaders }
    )
    const cursorRows = cursorRes.ok ? await cursorRes.json() : []
    const cursor = cursorRows?.[0]?.value ?? new Date(Date.now() - 15 * 60 * 1000).toISOString()

    // 2. Fetch new activity since the cursor.
    const logsRes = await fetch(
      `${supabaseUrl}/rest/v1/user_activity_logs` +
        `?created_at=gt.${encodeURIComponent(cursor)}` +
        `&select=id,user_id,action_type,description,created_at` +
        `&order=created_at.asc&limit=${BATCH_LIMIT}`,
      { headers: restHeaders }
    )
    if (!logsRes.ok) {
      const detail = await logsRes.text()
      console.error(`[ACTIVITY-FEED] logs fetch failed ${logsRes.status}: ${detail}`)
      return json({ error: 'logs fetch failed', detail }, 502, corsHeaders)
    }
    const rows: ActivityRow[] = await logsRes.json()

    if (rows.length === 0) {
      return json({ success: true, posted: 0 }, 200, corsHeaders)
    }

    // 3. Resolve member names for the batch.
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]
    const nameById: Record<string, string> = {}
    if (ids.length > 0) {
      const usersRes = await fetch(
        `${supabaseUrl}/rest/v1/users?id=in.(${ids.join(',')})&select=id,full_name,region`,
        { headers: restHeaders }
      )
      if (usersRes.ok) {
        const users: { id: string; full_name: string | null; region: string | null }[] =
          await usersRes.json()
        for (const u of users) {
          nameById[u.id] = u.region
            ? `${u.full_name || 'Unknown'} (${u.region})`
            : u.full_name || 'Unknown'
        }
      }
    }

    // 4. Format compact lines and chunk to Discord's char limit.
    const lines = rows.map((r) => {
      const who = nameById[r.user_id] || 'Unknown member'
      const what = r.description || r.action_type || 'activity'
      return `${icon(r.action_type)} \`${hhmm(r.created_at)}\` **${who}** â€” ${what}`
    })

    const header = `**Member activity** Â· ${rows.length} event${rows.length === 1 ? '' : 's'}`
    const chunks: string[] = []
    let buf = header
    for (const line of lines) {
      if (buf.length + line.length + 1 > DISCORD_MAX) {
        chunks.push(buf)
        buf = ''
      }
      buf += (buf ? '\n' : '') + line
    }
    if (buf) chunks.push(buf)

    for (const chunk of chunks) {
      await postToDiscord(webhookUrl, chunk)
    }

    // 5. Advance the cursor to the newest row we posted.
    const newCursor = rows[rows.length - 1].created_at
    await fetch(`${supabaseUrl}/rest/v1/site_settings?on_conflict=key`, {
      method: 'POST',
      headers: { ...restHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: CURSOR_KEY, value: newCursor }),
    })

    return json({ success: true, posted: rows.length }, 200, corsHeaders)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[ACTIVITY-FEED-ERROR] ${msg}`)
    return json({ error: msg }, 500, corsHeaders)
  }
})
