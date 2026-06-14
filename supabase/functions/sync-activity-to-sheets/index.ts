// @ts-nocheck
// THE BASE: LEADERS AUTH ACTIVITY → GOOGLE SHEETS SYNC
//
// Appends new admin_device_activity rows to a Google Sheet. Designed to be
// called once a minute by pg_cron, so the sheet stays a near-live mirror of the
// Leaders Auth activity log.
//
// A cursor row in public.integration_sheets_sync tracks how far we've synced;
// each run only appends rows created after it, then advances the cursor.
//
// Required secrets (supabase secrets set ...):
//   GOOGLE_SERVICE_ACCOUNT  – the full service-account JSON key (as a string)
//   SHEET_ID                – the target spreadsheet ID (from its URL)
//   SHEET_TAB               – optional tab/sheet name (default "Activity")
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CURSOR = 'admin_device_activity'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const HEADER_ROW = [
  'Timestamp',
  'Leader',
  'Device',
  'Event',
  'IP address',
  'Location',
  'Fingerprint',
  'User agent',
]
const ACTION_LABEL: Record<string, string> = {
  enrolled: 'Enrolled',
  verified: 'Verified',
  step_up_passed: 'Step-up passed',
  step_up_required: 'Step-up required',
  blocked: 'Blocked',
  slot_reset: 'Slot reset',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// --- Google service-account auth (JWT bearer → access token) -----------------

function base64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/, '')
    .replace(/-----END [^-]+-----/, '')
    .replace(/\s+/g, '')
  const bin = atob(body)
  const der = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i)
  return der
}

async function getAccessToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claim = base64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: SCOPE,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    )
  )
  const unsigned = `${header}.${claim}`

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))
  )
  const jwt = `${unsigned}.${base64url(sig)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google token error: ${await res.text()}`)
  return (await res.json()).access_token
}

// --- Sheets helpers ----------------------------------------------------------

async function sheetIsEmpty(token: string, sheetId: string, tab: string): Promise<boolean> {
  const range = encodeURIComponent(`${tab}!A1:A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Sheets read error: ${await res.text()}`)
  const data = await res.json()
  return !data.values || data.values.length === 0
}

async function appendRows(token: string, sheetId: string, tab: string, rows: string[][]) {
  const range = encodeURIComponent(`${tab}!A1`)
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  )
  if (!res.ok) throw new Error(`Sheets append error: ${await res.text()}`)
}

// --- Handler -----------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const sheetId = Deno.env.get('SHEET_ID') ?? ''
    const tab = Deno.env.get('SHEET_TAB') ?? 'Activity'
    const saRaw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT') ?? ''
    if (!sheetId || !saRaw)
      return json({ error: 'Missing SHEET_ID or GOOGLE_SERVICE_ACCOUNT' }, 500)
    // Accept the key as raw JSON (dashboard paste) or base64 (CLI-friendly, no
    // shell quoting headaches with the multi-line private key).
    let saJson = saRaw.trim()
    if (!saJson.startsWith('{')) {
      saJson = new TextDecoder().decode(Uint8Array.from(atob(saJson), (c) => c.charCodeAt(0)))
    }
    const sa = JSON.parse(saJson)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Where did we leave off?
    const { data: cursor } = await supabase
      .from('integration_sheets_sync')
      .select('last_synced_at')
      .eq('name', CURSOR)
      .maybeSingle()
    const since = cursor?.last_synced_at ?? new Date(0).toISOString()

    // 2. New activity since then (ascending so the sheet reads top-to-bottom).
    const { data: rows, error } = await supabase
      .from('admin_device_activity')
      .select(
        'id, admin_id, device_type, action, ip_address, location, user_agent, metadata, created_at'
      )
      .gt('created_at', since)
      .order('created_at', { ascending: true })
      .limit(500)
    if (error) throw error
    if (!rows || rows.length === 0) return json({ appended: 0 })

    // 3. Resolve leader names.
    const ids = [...new Set(rows.map((r) => r.admin_id).filter(Boolean))]
    const names = new Map<string, string>()
    if (ids.length) {
      const { data: users } = await supabase.from('users').select('id, full_name').in('id', ids)
      for (const u of users ?? []) names.set(u.id, u.full_name ?? 'Unknown admin')
    }

    // 4. Authenticate to Google and append.
    const token = await getAccessToken(sa)
    if (await sheetIsEmpty(token, sheetId, tab)) {
      await appendRows(token, sheetId, tab, [HEADER_ROW])
    }

    const values = rows.map((r) => [
      r.created_at,
      r.admin_id ? (names.get(r.admin_id) ?? 'Unknown admin') : 'System',
      r.device_type ?? '',
      ACTION_LABEL[r.action] ?? r.action,
      r.ip_address ?? '',
      r.location ?? '',
      r.metadata && typeof r.metadata.fingerprint_hash === 'string'
        ? r.metadata.fingerprint_hash
        : '',
      r.user_agent ?? '',
    ])
    await appendRows(token, sheetId, tab, values)

    // 5. Advance the cursor to the newest row we appended.
    const newest = rows[rows.length - 1].created_at
    await supabase
      .from('integration_sheets_sync')
      .update({ last_synced_at: newest, updated_at: new Date().toISOString() })
      .eq('name', CURSOR)

    return json({ appended: values.length, through: newest })
  } catch (err) {
    console.error('[sync-activity-to-sheets]', err)
    return json({ error: String(err) }, 500)
  }
})
