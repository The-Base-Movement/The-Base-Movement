import { createClient } from '@supabase/supabase-js'

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

function getMonitorTarget() {
  const siteUrl =
    readServerEnv('PUBLIC_SITE_URL') ||
    readServerEnv('SITE_URL') ||
    'https://www.thebasemovement.org.gh'
  return new URL('/version.json', siteUrl).toString()
}

function isAuthorized(request: Request) {
  const cronSecret = readServerEnv('CRON_SECRET')
  if (!cronSecret) return false

  const authorization = request.headers.get('authorization')
  return authorization === `Bearer ${cronSecret}`
}

export const config = { runtime: 'nodejs' }

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 })
  }

  if (!isAuthorized(request)) {
    return json({ error: 'Unauthorized' }, { status: 401 })
  }

  const targetUrl = getMonitorTarget()
  const startedAt = Date.now()

  let ok = false
  let statusCode: number | null = null
  let latencyMs: number | null
  let errorMessage: string | null = null

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'user-agent': 'the-base-vercel-uptime-check',
        accept: 'application/json,text/plain,*/*',
      },
    })

    latencyMs = Date.now() - startedAt
    statusCode = response.status
    ok = response.ok
    if (!ok) errorMessage = `HTTP ${response.status}`
  } catch (error) {
    latencyMs = Date.now() - startedAt
    errorMessage = error instanceof Error ? error.message : 'Network request failed.'
  }

  try {
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('site_uptime_checks').insert({
      target_url: targetUrl,
      ok,
      status_code: statusCode,
      latency_ms: latencyMs,
      error_message: errorMessage,
      checker: 'vercel-cron',
    })

    if (error) {
      return json({ error: error.message }, { status: 500 })
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Failed to record uptime check.' },
      { status: 500 }
    )
  }

  return json({ ok, statusCode, latencyMs, errorMessage, targetUrl })
}
