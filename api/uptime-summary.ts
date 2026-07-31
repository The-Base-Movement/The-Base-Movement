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

function getSupabaseAdminClient() {
  const url = readServerEnv('SUPABASE_URL') || readServerEnv('VITE_SUPABASE_URL')
  const key = readServerEnv('SUPABASE_SERVICE_ROLE_KEY') || readServerEnv('SUPABASE_SERVICE_KEY')

  if (!url || !key) {
    throw new Error('Supabase server credentials are missing.')
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export const config = { runtime: 'nodejs' }

export default async function handler() {
  try {
    const intervalSeconds = Number.parseInt(
      readServerEnv('UPTIME_MONITOR_INTERVAL_SECONDS') || '300',
      10
    )
    const supabase = getSupabaseAdminClient()
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
