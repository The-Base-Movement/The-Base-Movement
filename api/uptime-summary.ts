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
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY') || readEnv('SUPABASE_SERVICE_KEY')
  const anonKey = readEnv('SUPABASE_ANON_KEY') || readEnv('VITE_SUPABASE_ANON_KEY')

  if (!url) {
    throw new Error('Supabase URL is missing.')
  }

  if (serviceKey) {
    return { url, key: serviceKey, mode: 'service' as const }
  }

  if (anonKey) {
    return { url, key: anonKey, mode: 'anon' as const }
  }

  throw new Error('Supabase summary credentials are missing.')
}

function getSupabaseSummaryClient(authorization: string | null) {
  const credentials = resolveSupabaseSummaryCredentials()

  if (credentials.mode === 'anon' && !authorization) {
    throw new Error('Admin session token missing for uptime summary.')
  }

  return createClient(credentials.url, credentials.key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global:
      credentials.mode === 'anon' && authorization
        ? { headers: { Authorization: authorization } }
        : undefined,
  })
}

export const config = { runtime: 'nodejs' }

export default async function handler(request: Request) {
  try {
    const intervalSeconds = Number.parseInt(
      readServerEnv('UPTIME_MONITOR_INTERVAL_SECONDS') || '86400',
      10
    )
    const authorization = request.headers.get('authorization')
    const supabase = getSupabaseSummaryClient(authorization)
    const { data, error } = await supabase
      .from('site_uptime_checks')
      .select('checked_at, ok, status_code, latency_ms, error_message, target_url')
      .order('checked_at', { ascending: true })
      .limit(20000)

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }

    const checks = (data ?? []).map((row) => ({
      checkedAt: String(row.checked_at),
      ok: Boolean(row.ok),
      statusCode: typeof row.status_code === 'number' ? row.status_code : null,
      latencyMs: typeof row.latency_ms === 'number' ? row.latency_ms : null,
      errorMessage: row.error_message ? String(row.error_message) : null,
    }))

    const summary = summarizeUptimeChecks(checks, { intervalSeconds })
    const targetUrl = data?.[data.length - 1]?.target_url ?? null

    return json({
      ...summary,
      targetUrl,
    })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Failed to load uptime summary.' },
      { status: 500 }
    )
  }
}
