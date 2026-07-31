import { createClient } from '@supabase/supabase-js'

import { summarizeUptimeChecks } from '../src/lib/uptimeMonitoring'

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  })
}

function readServerEnv(name: string): string | undefined {
  return process.env[name] || undefined
}

export function resolveSupabaseSummaryCredentials(
  readEnv: (name: string) => string | undefined = readServerEnv
) {
  const url = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL')
  const anonKey = readEnv('SUPABASE_ANON_KEY') || readEnv('VITE_SUPABASE_ANON_KEY')

  if (!url) {
    throw new Error('Supabase URL is missing.')
  }

  if (!anonKey) {
    throw new Error('Supabase anon credentials are missing.')
  }

  return { url, key: anonKey }
}

function getSupabaseSummaryClient(authorization: string | null) {
  if (!authorization) {
    throw new Error('Admin session token missing for uptime summary.')
  }

  const credentials = resolveSupabaseSummaryCredentials()

  return createClient(credentials.url, credentials.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  })
}

export const config = { runtime: 'nodejs' }

export default async function handler(request: Request) {
  try {
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, { status: 405 })
    }

    const intervalSeconds = Number.parseInt(
      readServerEnv('UPTIME_MONITOR_INTERVAL_SECONDS') || '86400',
      10
    )
    const authorization = request.headers.get('authorization')
    const supabase = getSupabaseSummaryClient(authorization)
    const { data, error } = await supabase
      .from('site_uptime_checks')
      .select('checked_at, ok, status_code, latency_ms, error_message, target_url')
      .order('checked_at', { ascending: false })
      .limit(20000)

    if (error) {
      return json({ error: 'Failed to load uptime summary.' }, { status: 500 })
    }

    const checks = (data ?? []).map((row) => ({
      checkedAt: String(row.checked_at),
      ok: Boolean(row.ok),
      statusCode: typeof row.status_code === 'number' ? row.status_code : null,
      latencyMs: typeof row.latency_ms === 'number' ? row.latency_ms : null,
      errorMessage: row.error_message ? String(row.error_message) : null,
    }))

    const summary = summarizeUptimeChecks(checks, { intervalSeconds })
    const targetUrl = data?.[0]?.target_url ?? null

    return json({
      ...summary,
      targetUrl,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Admin session token missing for uptime summary.'
    ) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    return json({ error: 'Failed to load uptime summary.' }, { status: 500 })
  }
}
