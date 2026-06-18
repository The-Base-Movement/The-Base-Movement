// log-member-session
//
// Called right after a member signs in. Derives the member from the verified JWT
// (never trusts a client-supplied id), reads the TRUE client IP + user-agent from
// request headers, does a best-effort geo lookup, then records a row in
// member_sessions via the service role. Marks the new row current and clears the
// member's previous "current" flag so the dashboard shows one active session.
//
// Returns: { ok: true } on success.

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? null
}

// Friendly "Browser on OS" label from a user-agent string.
function deviceName(ua: string | null): string {
  if (!ua) return 'Unknown device'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iOS/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS'
  return `${browser} on ${os}`
}

// Best-effort geo lookup; never blocks if it fails. ipwho.is (https) first,
// ip-api.com as fallback. Mirrors capture-admin-device.
async function geoLocate(ip: string | null): Promise<string | null> {
  if (!ip) return null
  try {
    const res = await fetch(`https://ipwho.is/${ip}`)
    if (res.ok) {
      const g = await res.json()
      if (g && g.success !== false) {
        const parts = [g.city, g.region, g.country].filter(Boolean)
        if (parts.length) return parts.join(', ')
      }
    }
  } catch {
    // fall through
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`)
    if (res.ok) {
      const g = await res.json()
      if (g && g.status === 'success') {
        const parts = [g.city, g.regionName, g.country].filter(Boolean)
        if (parts.length) return parts.join(', ')
      }
    }
  } catch {
    // ignore — geo is non-essential
  }
  return null
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Identify the caller from the verified JWT.
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(jwt)
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    // 2. Authoritative server-side signals.
    const ip = clientIp(req)
    const device = deviceName(req.headers.get('user-agent'))
    const location = await geoLocate(ip)

    // 3. Demote the member's previous current session, then record the new one.
    await supabase
      .from('member_sessions')
      .update({ is_current: false })
      .eq('member_id', user.id)
      .eq('is_current', true)

    const { error } = await supabase.from('member_sessions').insert({
      member_id: user.id,
      device_name: device,
      ip_address: ip,
      location,
      is_current: true,
    })

    if (error) {
      console.error('[log-member-session] insert error:', error)
      return json({ error: 'Failed to record session' }, 500)
    }

    return json({ ok: true })
  } catch (err) {
    console.error('[log-member-session] error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
