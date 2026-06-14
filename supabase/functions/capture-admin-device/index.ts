// capture-admin-device
//
// Called when a privileged admin enters the admin area. Derives the admin from
// the verified JWT (never trusts a client-supplied id), reads the TRUE client IP
// from request headers, confirms the user holds a tracked role, then runs the
// enrol-or-validate logic via the evaluate_admin_device RPC (service role).
//
// Returns: { tracked, decision, device_id, webauthn_required }
//   decision ∈ enrolled | verified | step_up_required | blocked
//   tracked=false  -> caller is not a device-tracked role; client treats as allow.

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Roles whose devices we bind. Keep in sync with DEVICE_TRACKED_ROLES on the client.
const TRACKED_ROLES = ['FOUNDER', 'FINANCE_OFFICER', 'EXECUTIVE', 'SUPER_ADMIN', 'MOVEMENT_LEADER']

const DEVICE_TYPES = ['desktop', 'tablet', 'mobile']

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

// Best-effort geo lookup; never blocks the capture if it fails. Tries
// ipwho.is (https, no key) first, then ip-api.com as a fallback.
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
    // fall through to the secondary provider
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

    // 2. Confirm the caller is a device-tracked admin role.
    const { data: admin } = await supabase
      .from('admins')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!admin || !TRACKED_ROLES.includes(admin.role)) {
      // Not tracked — nothing to capture; client proceeds normally.
      return json({ tracked: false, decision: 'verified' })
    }

    // 3. Read client-supplied device descriptors (identifiers, not secrets).
    const body = await req.json().catch(() => ({}))
    const { device_type, fingerprint_hash, device_name, os_type, browser } = body

    if (!fingerprint_hash || !DEVICE_TYPES.includes(device_type)) {
      return json({ error: 'device_type and fingerprint_hash are required' }, 400)
    }

    // 4. Authoritative server-side signals.
    const ip = clientIp(req)
    const userAgent = req.headers.get('user-agent')
    const location = await geoLocate(ip)

    // 5. Enrol-or-validate.
    const { data, error } = await supabase.rpc('evaluate_admin_device', {
      p_admin_id: user.id,
      p_role: admin.role,
      p_device_type: device_type,
      p_fingerprint_hash: fingerprint_hash,
      p_device_name: device_name ?? null,
      p_os_type: os_type ?? null,
      p_browser: browser ?? null,
      p_ip: ip,
      p_location: location,
      p_user_agent: userAgent,
    })

    if (error) {
      console.error('[capture-admin-device] rpc error:', error)
      return json({ error: 'Failed to evaluate device' }, 500)
    }

    return json({ tracked: true, ...data })
  } catch (err) {
    console.error('[capture-admin-device] error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
