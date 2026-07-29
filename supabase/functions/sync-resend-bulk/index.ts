// @ts-nocheck
// THE BASE: RESEND BULK CONTACT SYNC
// Fetches all members (+ active newsletter subscribers) from the database and
// upserts them into the Resend global contacts list.
//
// Required secrets: RESEND_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocation: POST (no body required; admin-auth enforced via service role)
// Returns: { total, success, failed }

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

async function syncResendContactsInBulk(contacts: Record<string, unknown>[], resendApiKey: string) {
  // Resend rate-limits to ~2 requests/second. The previous 8 concurrent workers
  // with no throttle and no retry meant most calls came back 429 and were
  // counted as permanent failures — 651 of 1,007 on the last run.
  const CONCURRENCY_LIMIT = 2
  const MAX_RETRIES = 4
  let index = 0
  const results = { success: 0, failed: 0, rate_limited: 0 }
  const failureReasons: Record<string, number> = {}

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  /** Single request with backoff on 429, so throttling delays rather than drops. */
  async function send(url: string, method: string, body: unknown): Promise<Response | null> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify(body),
      })
      if (res.status !== 429) return res
      results.rate_limited++
      // Exponential backoff, honouring Retry-After when Resend supplies it.
      const retryAfter = Number(res.headers.get('retry-after') ?? 0)
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500)
    }
    return null
  }

  async function worker() {
    while (index < contacts.length) {
      const currentIdx = index++
      const contact = contacts[currentIdx]
      if (!contact) break

      try {
        const createRes = await send('https://api.resend.com/contacts', 'POST', contact)
        if (createRes?.ok) {
          results.success++
          await sleep(500) // stay under ~2 req/s per worker
          continue
        }

        // Already exists → update instead.
        const updateRes = await send(
          `https://api.resend.com/contacts/${encodeURIComponent(contact.email as string)}`,
          'PATCH',
          {
            first_name: contact.first_name,
            last_name: contact.last_name,
            properties: contact.properties,
          }
        )

        if (updateRes?.ok) {
          results.success++
        } else {
          results.failed++
          // Record why, rather than swallowing it: a silent failure count is
          // indistinguishable from a healthy run at a glance.
          const key = updateRes ? `HTTP ${updateRes.status}` : 'rate limit exhausted'
          failureReasons[key] = (failureReasons[key] ?? 0) + 1
        }
        await sleep(500)
      } catch (err: unknown) {
        results.failed++
        const key = err instanceof Error ? err.message.slice(0, 60) : 'unknown'
        failureReasons[key] = (failureReasons[key] ?? 0) + 1
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, contacts.length) }, () =>
    worker()
  )
  await Promise.all(workers)

  if (Object.keys(failureReasons).length > 0) {
    console.error('[SYNC-RESEND-BULK] failures by reason:', JSON.stringify(failureReasons))
  }

  return { ...results, failure_reasons: failureReasons }
}

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

    // Ensure contact properties exist in Resend
    const props = [
      { key: 'reg_no', type: 'string' },
      { key: 'region', type: 'string' },
      { key: 'constituency', type: 'string' },
      { key: 'platform', type: 'string' },
      { key: 'membership_status', type: 'string' },
      { key: 'source', type: 'string' },
      // Lets Resend segment on who has never signed in — the audience the
      // activation campaign targets. Computed nightly by categorize-engagement-daily.
      { key: 'engagement_status', type: 'string' },
    ]
    for (const prop of props) {
      try {
        await fetch('https://api.resend.com/contact-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(prop),
        })
      } catch {
        // Safe to ignore if already exists or schema setup fails
      }
    }

    // Fetch members with an email, resuming from where the last run stopped.
    //
    // Two constraints force a cursor. PostgREST caps a response at 1,000 rows,
    // so the previous unpaginated query silently synced only the first ~1,000 of
    // 9,422 members and reported that as the total. And Resend's ~2 req/s limit
    // means a full pass takes far longer than one function invocation, so a run
    // that always restarts at the beginning would never reach the tail.
    //
    // Each run therefore processes a bounded slice ordered by id and stores the
    // last id reached; the nightly cron converges over successive nights and
    // wraps to the start once the end is passed.
    const PER_RUN = 600
    const CURSOR_KEY = 'resend_sync_cursor'

    const { data: cursorRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', CURSOR_KEY)
      .maybeSingle()
    const cursor = cursorRow?.value ?? ''

    async function fetchFrom(afterId: string) {
      let q = supabase
        .from('users')
        .select(
          'id, email, full_name, registration_number, region, constituency, platform, status, engagement_status'
        )
        .not('email', 'is', null)
        .neq('email', '')
        .order('id', { ascending: true })
        .limit(PER_RUN)
      if (afterId) q = q.gt('id', afterId)
      const { data: rows, error } = await q
      if (error) throw error
      return (rows ?? []) as MemberRow[]
    }

    let data = await fetchFrom(cursor)
    // Reached the end of the roll — wrap around so the next pass refreshes
    // everyone rather than stalling permanently on an exhausted cursor.
    if (data.length === 0 && cursor) {
      data = await fetchFrom('')
    }

    const nextCursor = data.length > 0 ? data[data.length - 1].id : ''
    if (nextCursor) {
      await supabase
        .from('site_settings')
        .upsert({ key: CURSOR_KEY, value: nextCursor }, { onConflict: 'key' })
    }

    // Keep only rows with a syntactically valid email.
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const members: MemberRow[] = (data ?? [])
      .map((m: MemberRow) => ({ ...m, email: (m.email ?? '').trim() }))
      .filter((m: MemberRow) => EMAIL_RE.test(m.email))

    // Build member contact objects, keyed by lowercased email for dedup.
    const byEmail = new Map<string, Record<string, unknown>>()
    for (const m of members) {
      const { first_name, last_name } = splitName(m.full_name)
      byEmail.set(m.email.toLowerCase(), {
        email: m.email,
        first_name,
        last_name,
        unsubscribed: false,
        properties: {
          reg_no: m.registration_number ?? '',
          region: m.region ?? '',
          constituency: m.constituency ?? '',
          platform: m.platform ?? '',
          membership_status: m.status ?? '',
          engagement_status: m.engagement_status ?? 'Never',
          source: 'member',
        },
      })
    }

    // Also back-fill active newsletter subscribers (source=newsletter). A
    // subscriber who is already a member keeps the richer member record.
    const { data: subsData } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'Active')
      .not('email', 'is', null)
    for (const s of subsData ?? []) {
      const email = (s.email ?? '').trim()
      if (!EMAIL_RE.test(email) || byEmail.has(email.toLowerCase())) continue
      byEmail.set(email.toLowerCase(), {
        email,
        first_name: '',
        last_name: '',
        unsubscribed: false,
        properties: {
          reg_no: '',
          region: '',
          constituency: '',
          platform: '',
          membership_status: 'Subscriber',
          source: 'newsletter',
        },
      })
    }

    const contacts = Array.from(byEmail.values())
    const total = contacts.length

    if (total === 0) {
      return new Response(JSON.stringify({ total: 0, success: 0, failed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Sync in bulk using concurrency queue
    const syncResult = await syncResendContactsInBulk(contacts, resendApiKey)

    return new Response(
      // Surface why a run underperformed. A bare success/failed pair reads as a
      // healthy run at a glance even when two thirds of it was rate-limited.
      JSON.stringify({
        total,
        success: syncResult.success,
        failed: syncResult.failed,
        rate_limited_retries: syncResult.rate_limited,
        failure_reasons: syncResult.failure_reasons,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
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
