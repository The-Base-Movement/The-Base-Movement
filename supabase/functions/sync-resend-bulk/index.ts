// @ts-nocheck
// THE BASE: RESEND BULK CONTACT SYNC
// Fetches all members (+ active newsletter subscribers) from the database and
// upserts them into Resend via the bulk CSV import endpoint.
//
// Required secrets: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocation: POST (no body required)
// Returns: { total, import_id }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageNewsletters, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

interface MemberRow {
  id: string
  email: string
  full_name: string | null
  registration_number: string | null
  region: string | null
  constituency: string | null
  platform: string | null
  status: string | null
  engagement_status: string | null
}

function splitName(full: string | null): { first_name: string; last_name: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  return {
    first_name: parts[0] ?? '',
    last_name: parts.slice(1).join(' '),
  }
}

const CSV_HEADERS = [
  'email',
  'first_name',
  'last_name',
  'reg_no',
  'region',
  'constituency',
  'platform',
  'membership_status',
  'engagement_status',
  'source',
] as const

/** Quote every field: names and constituencies legitimately contain commas. */
function csvRow(values: string[]): string {
  return values.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')
}

// Maps our CSV headers onto Resend's contact fields. Anything not named here
// (reg_no, region, …) is declared as a custom property so it lands on the
// contact record and stays available for segment filters.
const COLUMN_MAP = {
  email: 'email',
  first_name: 'first_name',
  last_name: 'last_name',
  properties: Object.fromEntries(
    [
      'reg_no',
      'region',
      'constituency',
      'platform',
      'membership_status',
      'engagement_status',
      'source',
    ].map((k) => [k, { column: k, type: 'string' }])
  ),
}

// Broadcasts can only target a segment — a contact that belongs to none is
// unreachable — so every imported contact joins the account-wide "General"
// segment. Narrower audiences (e.g. never-signed-in) are filtered in the Resend
// dashboard on the engagement_status property, which this import keeps current.
const GENERAL_SEGMENT_ID = 'fac06974-9216-4466-a43a-6a73a6f04552'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const resendApiKey: string | undefined = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'RESEND_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Auth: the nightly pg_cron auto-sync sends the shared cron job token
    // (BACKFILL_JOB_TOKEN — project-wide secret); the manual admin button sends an
    // admin JWT. Accept either. This function runs verify_jwt=false (see
    // supabase/config.toml) so the non-JWT cron token reaches us.
    const cronToken = Deno.env.get('BACKFILL_JOB_TOKEN')
    const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const isCron = !!cronToken && bearer === cronToken
    if (!isCron) {
      const authz = await requireAuthorizedAdmin(req, supabase, canManageNewsletters)
      if (!authz.ok) {
        return new Response(await authz.response.text(), {
          status: authz.response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch every member with an email. PostgREST caps a response at 1,000 rows,
    // so page explicitly — an unpaginated select silently returns only the first
    // page and reports it as the whole roll.
    const PAGE = 1000
    const members: MemberRow[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id, email, full_name, registration_number, region, constituency, platform, status, engagement_status'
        )
        .not('email', 'is', null)
        .neq('email', '')
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw error
      const rows = (data ?? []) as MemberRow[]
      members.push(...rows)
      if (rows.length < PAGE) break
    }

    // Keep only rows with a syntactically valid email, keyed by lowercased
    // address so a duplicate address becomes one contact.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const byEmail = new Map<string, string[]>()
    for (const m of members) {
      const email = (m.email ?? '').trim()
      if (!EMAIL_RE.test(email)) continue
      const { first_name, last_name } = splitName(m.full_name)
      byEmail.set(email.toLowerCase(), [
        email,
        first_name,
        last_name,
        m.registration_number ?? '',
        m.region ?? '',
        m.constituency ?? '',
        m.platform ?? '',
        m.status ?? '',
        m.engagement_status ?? 'Never',
        'member',
      ])
    }

    // Also back-fill active newsletter subscribers. A subscriber who is already
    // a member keeps the richer member record.
    const { data: subsData } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'Active')
      .not('email', 'is', null)
    for (const s of subsData ?? []) {
      const email = (s.email ?? '').trim()
      if (!EMAIL_RE.test(email) || byEmail.has(email.toLowerCase())) continue
      byEmail.set(email.toLowerCase(), [
        email,
        '',
        '',
        '',
        '',
        '',
        '',
        'Subscriber',
        '',
        'newsletter',
      ])
    }

    const total = byEmail.size
    if (total === 0) {
      return new Response(JSON.stringify({ total: 0, import_id: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const csv = [csvRow([...CSV_HEADERS]), ...Array.from(byEmail.values(), csvRow)].join('\n')

    // One bulk import beats one request per contact: Resend rate-limits to
    // ~2 req/s, so 9k+ contacts as individual calls cannot finish inside a
    // single invocation. The import is processed asynchronously on their side.
    const form = new FormData()
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'contacts.csv')
    form.append('column_map', JSON.stringify(COLUMN_MAP))
    form.append('on_conflict', 'upsert')
    form.append('segments', JSON.stringify([{ id: GENERAL_SEGMENT_ID }]))

    const res = await fetch('https://api.resend.com/contacts/imports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}` },
      body: form,
    })
    const body = await res.text()
    if (!res.ok) {
      console.error('[SYNC-RESEND-BULK] import rejected:', res.status, body)
      return new Response(JSON.stringify({ total, error: `HTTP ${res.status}`, detail: body }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const parsed = JSON.parse(body)
    return new Response(JSON.stringify({ total, import_id: parsed?.id ?? null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[RESEND-BULK-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
