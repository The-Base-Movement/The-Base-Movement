import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { normalizePhoneNumber } from '../_shared/phone.ts'

type BackfillRequest = {
  limit?: number
  dryRun?: boolean
  startAfterId?: string
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

    let query = supabase
      .from('users')
      .select('id, phone_number')
      .not('phone_number', 'is', null)
      .neq('phone_number', '')
      .order('id', { ascending: true })
      .limit(limit)

    if (startAfterId) {
      query = query.gt('id', startAfterId)
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
    let invalidPhone = 0
    let created = 0
    let createFailed = 0
    const failures: Array<{ id: string; reason: string }> = []

    for (const row of users) {
      scanned += 1
      const id = String(row.id)
      const normalizedPhone = normalizePhoneNumber(String(row.phone_number ?? ''))

      if (!normalizedPhone) {
        invalidPhone += 1
        if (failures.length < 50) failures.push({ id, reason: 'invalid_phone' })
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

      const { error: createErr } = await supabase.auth.admin.createUser({
        id,
        phone: normalizedPhone,
        phone_confirm: true,
        password: randomPassword(24),
      })

      if (createErr) {
        createFailed += 1
        if (failures.length < 50) failures.push({ id, reason: `create_error:${createErr.message}` })
      } else {
        created += 1
      }
    }

    const nextCursor = users.length > 0 ? String(users[users.length - 1].id) : null

    return new Response(
      JSON.stringify({
        ok: true,
        dryRun,
        limit,
        startAfterId: startAfterId ?? null,
        nextCursor,
        scanned,
        alreadyLinked,
        missingAuth,
        invalidPhone,
        created,
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
