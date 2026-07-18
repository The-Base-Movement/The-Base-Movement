import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { normalizePhoneNumber } from '../_shared/phone.ts'

type BackfillRequest = {
  limit?: number
  dryRun?: boolean
  startAfterId?: string
  ids?: string[]
  auto?: boolean
  source?: string
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function usableEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const email = input.trim()
  return EMAIL_RE.test(email) ? email : null
}

// Create an auth account for a member: prefer phone, fall back to email.
async function createAuthUser(
  id: string,
  normalizedPhone: string | null,
  email: string | null
): Promise<{ via: 'phone' | 'email' | null; error?: { message: string } }> {
  let error: { message: string } | null = null
  if (normalizedPhone) {
    const res = await supabase.auth.admin.createUser({
      id,
      phone: normalizedPhone,
      phone_confirm: true,
      password: randomPassword(24),
    })
    if (!res.error) return { via: 'phone' }
    error = res.error
  }
  if (email) {
    const res = await supabase.auth.admin.createUser({
      id,
      email,
      email_confirm: true,
      password: randomPassword(24),
    })
    if (!res.error) return { via: 'email' }
    error = res.error
  }
  return { via: null, error: error ?? { message: 'no usable contact' } }
}

// Run tasks with bounded concurrency.
async function runPooled<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    const res = await Promise.all(chunk.map(fn))
    out.push(...res)
  }
  return out
}

async function postMembersDiscord(content: string): Promise<void> {
  const url = Deno.env.get('DISCORD_MEMBERS_WEBHOOK_URL')
  if (!url) return
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => {})
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const BACKFILL_SECRET_KEY =
  Deno.env.get('BACKFILL_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const BACKFILL_JOB_TOKEN = Deno.env.get('BACKFILL_JOB_TOKEN')

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required')
if (!BACKFILL_SECRET_KEY) throw new Error('BACKFILL_SECRET_KEY is required')

const supabase = createClient(SUPABASE_URL, BACKFILL_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function randomPassword(length = 24): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function isNotFoundAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const msg = 'message' in err ? String((err as { message?: string }).message ?? '') : ''
  const status = 'status' in err ? Number((err as { status?: number }).status ?? NaN) : NaN
  return status === 404 || /not\s*found/i.test(msg)
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (BACKFILL_JOB_TOKEN) {
      const authHeader = req.headers.get('authorization') || ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
      if (token !== BACKFILL_JOB_TOKEN) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const body = (await req.json().catch(() => ({}))) as BackfillRequest
    const limit = Math.min(Math.max(body.limit ?? 200, 1), 500)
    const dryRun = body.dryRun ?? true
    const startAfterId = body.startAfterId
    const targetIds = Array.isArray(body.ids) ? body.ids.filter((v) => typeof v === 'string') : null

    // Auto mode: drain unprovisioned members via RPC, log an audit row, and report to Discord.
    // Called in real time by the on-insert trigger and by the backstop cron.
    if (body.auto) {
      const source = typeof body.source === 'string' ? body.source : 'auto'
      let provisioned = 0
      let viaPhone = 0
      let viaEmail = 0
      let failed = 0
      const autoFailures: Array<{ id: string; reason: string }> = []
      const MAX_BATCHES = 10 // ~2000 accounts/invocation; self-chains if more remain

      for (let batch = 0; batch < MAX_BATCHES; batch++) {
        const { data: rows, error: rpcErr } = await supabase.rpc('get_unprovisioned_member_ids', {
          p_limit: 200,
        })
        if (rpcErr) {
          return new Response(JSON.stringify({ ok: false, error: `rpc_error:${rpcErr.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const pending = (rows ?? []) as Array<{
          id: string
          phone_number: string | null
          email: string | null
        }>
        if (pending.length === 0) break
        if (dryRun) {
          provisioned += pending.length
          break
        }

        const results = await runPooled(pending, 8, async (row) => {
          const id = String(row.id)
          const normalizedPhone = normalizePhoneNumber(String(row.phone_number ?? ''))
          const email = usableEmail(row.email)
          if (!normalizedPhone && !email) return { via: null, id, reason: 'no_contact' }
          const res = await createAuthUser(id, normalizedPhone, email)
          return { via: res.via, id, reason: res.error?.message }
        })

        for (const r of results) {
          if (r.via === 'phone') {
            provisioned++
            viaPhone++
          } else if (r.via === 'email') {
            provisioned++
            viaEmail++
          } else {
            failed++
            if (autoFailures.length < 50)
              autoFailures.push({ id: r.id, reason: `create_error:${r.reason ?? 'unknown'}` })
          }
        }

        if (pending.length < 200) break
      }

      const { data: reportData } = await supabase.rpc('member_sync_report')
      const report = (reportData ?? {}) as {
        unlinked_total?: number
        no_contact?: number
        dup_contact_groups?: number
        dup_name_groups_context?: number
      }
      const dupGroups = report.dup_contact_groups ?? 0
      // Only record/notify when the run actually did something — otherwise every
      // idle backstop tick and every registration would spam the log and Discord.
      const didWork = provisioned > 0 || failed > 0

      if (!dryRun && didWork) {
        await supabase.from('import_audit').insert({
          source,
          provisioned,
          via_phone: viaPhone,
          via_email: viaEmail,
          failed,
          report,
        })
      }

      // Self-continue only if we made progress (prevents looping on un-creatable rows).
      let more = false
      if (!dryRun && provisioned > 0) {
        const { data: check } = await supabase.rpc('get_unprovisioned_member_ids', { p_limit: 1 })
        more = Array.isArray(check) && check.length > 0
        if (more) {
          fetch(`${SUPABASE_URL}/functions/v1/backfill-auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${BACKFILL_JOB_TOKEN ?? ''}`,
            },
            body: JSON.stringify({ auto: true, dryRun: false, source }),
          }).catch(() => {})
        }
      }

      if (!dryRun && didWork) {
        await postMembersDiscord(
          `🔄 **Member auth sync** (${source})\n` +
            `Provisioned **${provisioned}** (📱 ${viaPhone} / ✉️ ${viaEmail})` +
            (failed ? `, failed ${failed}` : '') +
            `\nUnlinked remaining: ${report.unlinked_total ?? '?'} (no contact: ${report.no_contact ?? '?'})` +
            `\nDuplicate members (same phone/email): ${dupGroups}` +
            (more ? `\n_more pending — continuing…_` : '')
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          mode: 'auto',
          source,
          dryRun,
          provisioned,
          viaPhone,
          viaEmail,
          failed,
          continuing: more,
          report,
          failures: autoFailures,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let query = supabase.from('users').select('id, phone_number, email')

    if (targetIds && targetIds.length > 0) {
      // Targeted mode: provision exactly these ids, no cursor paging.
      query = query.in('id', targetIds.slice(0, 500))
    } else {
      // Scan mode: anyone reachable by phone OR email.
      query = query
        .or('phone_number.not.is.null,email.not.is.null')
        .order('id', { ascending: true })
        .limit(limit)
      if (startAfterId) {
        query = query.gt('id', startAfterId)
      }
    }

    const { data: candidates, error: candidatesError } = await query

    if (candidatesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to load candidates', details: candidatesError.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const users = candidates ?? []

    let scanned = 0
    let alreadyLinked = 0
    let missingAuth = 0
    let noContact = 0
    let created = 0
    let createdViaPhone = 0
    let createdViaEmail = 0
    let createFailed = 0
    const failures: Array<{ id: string; reason: string }> = []

    for (const row of users) {
      scanned += 1
      const id = String(row.id)
      const normalizedPhone = normalizePhoneNumber(String(row.phone_number ?? ''))
      const email = usableEmail(row.email)

      if (!normalizedPhone && !email) {
        noContact += 1
        if (failures.length < 50) failures.push({ id, reason: 'no_contact' })
        continue
      }

      const { data: existing, error: getErr } = await supabase.auth.admin.getUserById(id)

      if (!getErr && existing?.user) {
        alreadyLinked += 1
        continue
      }

      if (getErr && !isNotFoundAuthError(getErr)) {
        createFailed += 1
        if (failures.length < 50) failures.push({ id, reason: `lookup_error:${getErr.message}` })
        continue
      }

      missingAuth += 1

      if (dryRun) continue

      // Prefer phone; fall back to email if phone is absent or GoTrue rejects it.
      let createErr: { message: string } | null = null
      if (normalizedPhone) {
        const res = await supabase.auth.admin.createUser({
          id,
          phone: normalizedPhone,
          phone_confirm: true,
          password: randomPassword(24),
        })
        if (!res.error) {
          created += 1
          createdViaPhone += 1
          continue
        }
        createErr = res.error
      }

      if (email) {
        const res = await supabase.auth.admin.createUser({
          id,
          email,
          email_confirm: true,
          password: randomPassword(24),
        })
        if (!res.error) {
          created += 1
          createdViaEmail += 1
          continue
        }
        createErr = res.error
      }

      createFailed += 1
      if (failures.length < 50) {
        failures.push({ id, reason: `create_error:${createErr?.message ?? 'unknown'}` })
      }
    }

    const targeted = Boolean(targetIds && targetIds.length > 0)
    const nextCursor = !targeted && users.length > 0 ? String(users[users.length - 1].id) : null

    return new Response(
      JSON.stringify({
        ok: true,
        dryRun,
        mode: targeted ? 'targeted' : 'scan',
        limit,
        startAfterId: startAfterId ?? null,
        nextCursor,
        scanned,
        alreadyLinked,
        missingAuth,
        noContact,
        created,
        createdViaPhone,
        createdViaEmail,
        createFailed,
        failures,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
