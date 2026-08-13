// Nightly voice-note storage purge.
//
// Nothing deletes expired messages in this system — expires_at is only a display
// filter — so without this job every voice note would be kept forever and the
// 60-second cap would merely slow the growth rather than bound it.
//
// Two sweeps:
//   1. Expired — messages past expires_at that still carry audio. The file is
//      deleted and audio_url cleared; the row and its duration stay so the bubble
//      can show "Voice note expired" instead of the message vanishing.
//   2. Orphans — files in the bucket no live message points at. Recalls null
//      audio_url immediately (which revokes playback at once), and an upload whose
//      message insert failed leaves a file behind. Both land here.
//
// Deleting rows from storage.objects in SQL would not free the underlying file,
// so removal goes through the storage API with the service role.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BUCKET = 'voice-notes'
// Files younger than this are never treated as orphans: an upload and its message
// insert are not atomic, so a brand-new file may briefly have no row pointing at it.
const ORPHAN_GRACE_HOURS = 1

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!supabaseUrl || !serviceKey) {
    console.error('[PURGE-VOICE-NOTES] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.')
    return json({ error: 'Supabase credentials missing.' }, 500, corsHeaders)
  }

  const authz = requireServiceRoleCall(req, serviceKey)
  if (!authz.ok) {
    return new Response(await authz.response.text(), {
      status: authz.response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rest = (path: string, init: RequestInit = {}) =>
    fetch(`${supabaseUrl}${path}`, {
      ...init,
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

  /** Remove a batch of paths from the bucket. Returns how many the API accepted. */
  const removeFiles = async (paths: string[]): Promise<number> => {
    if (paths.length === 0) return 0
    let removed = 0
    // The storage remove endpoint takes a list; chunk it so one huge night does
    // not produce a single oversized request.
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100)
      const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: chunk }),
      })
      if (!res.ok) {
        console.error('[PURGE-VOICE-NOTES] storage delete failed:', res.status, await res.text())
        continue
      }
      removed += chunk.length
    }
    return removed
  }

  try {
    // ── Sweep 1: expired messages still holding audio ──────────────────────
    const expiredRes = await rest(
      `/rest/v1/messages?select=id,audio_url&audio_url=not.is.null&expires_at=lt.${new Date().toISOString()}&limit=1000`
    )
    if (!expiredRes.ok) {
      const body = await expiredRes.text()
      console.error('[PURGE-VOICE-NOTES] expired query failed:', expiredRes.status, body)
      return json({ error: 'Could not read expired messages.' }, 500, corsHeaders)
    }
    const expired = (await expiredRes.json()) as { id: string; audio_url: string }[]

    const expiredRemoved = await removeFiles(expired.map((m) => m.audio_url))

    // Clear the reference only after the file is gone, so a failed delete is
    // retried on the next run rather than being silently forgotten.
    let cleared = 0
    if (expiredRemoved > 0 && expired.length > 0) {
      const ids = expired.map((m) => m.id)
      const clearRes = await rest(`/rest/v1/messages?id=in.(${ids.join(',')})`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ audio_url: null }),
      })
      if (clearRes.ok) cleared = ids.length
      else console.error('[PURGE-VOICE-NOTES] clearing audio_url failed:', await clearRes.text())
    }

    // ── Sweep 2: orphaned files ────────────────────────────────────────────
    // The set difference runs in SQL. Reading storage.objects over REST would
    // depend on the storage schema being exposed to PostgREST, and would mean
    // pulling every referenced audio_url across the wire to diff in memory.
    let orphansRemoved = 0
    const orphansRes = await rest('/rest/v1/rpc/list_orphaned_voice_notes', {
      method: 'POST',
      body: JSON.stringify({ grace_hours: ORPHAN_GRACE_HOURS, max_rows: 2000 }),
    })

    if (orphansRes.ok) {
      const orphans = (await orphansRes.json()) as string[]
      orphansRemoved = await removeFiles(orphans)
    } else {
      console.error('[PURGE-VOICE-NOTES] orphan lookup failed:', await orphansRes.text())
    }

    const summary = {
      expiredFound: expired.length,
      expiredRemoved,
      referencesCleared: cleared,
      orphansRemoved,
    }
    console.log('[PURGE-VOICE-NOTES]', JSON.stringify(summary))
    return json({ ok: true, ...summary }, 200, corsHeaders)
  } catch (err) {
    console.error('[PURGE-VOICE-NOTES] unexpected failure:', err)
    return json({ error: 'Purge failed.' }, 500, corsHeaders)
  }
})
