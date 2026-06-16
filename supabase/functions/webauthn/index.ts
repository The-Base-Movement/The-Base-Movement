// webauthn
//
// Biometric (WebAuthn / passkey) ceremonies for privileged admins, layered on
// top of device binding. Four actions:
//   register-begin / register-complete         -> enrol a platform authenticator
//   authenticate-begin / authenticate-complete -> verify it (used for step-up)
//
// The admin is always derived from the verified JWT. The RP ID is derived from
// the request Origin and validated against an allowlist, so the same code works
// on localhost today, thebasemovement.creativeutil.com now, and thebasemovement.com
// after the migration (just add it to ALLOWED_RP_ORIGINS).

// @ts-expect-error: Deno URL import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno URL import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  // @ts-expect-error: Deno URL import
} from 'https://esm.sh/@simplewebauthn/server@13.1.1'
// @ts-expect-error: Deno URL import
import { isoBase64URL } from 'https://esm.sh/@simplewebauthn/server@13.1.1/helpers'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RP_NAME = 'The Base Movement'

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

// Best-effort geo lookup (ipwho.is, then ip-api.com); never throws.
async function geoLocate(
  ip: string | null
): Promise<{ location: string | null; isp: string | null }> {
  if (!ip) return { location: null, isp: null }
  try {
    const res = await fetch(`https://ipwho.is/${ip}`)
    if (res.ok) {
      const g = await res.json()
      if (g && g.success !== false) {
        const parts = [g.city, g.region, g.country].filter(Boolean)
        const isp = g.connection?.isp || g.connection?.org || null
        return { location: parts.length ? parts.join(', ') : null, isp }
      }
    }
  } catch {
    // fall through
  }
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org`
    )
    if (res.ok) {
      const g = await res.json()
      if (g && g.status === 'success') {
        const parts = [g.city, g.regionName, g.country].filter(Boolean)
        return { location: parts.length ? parts.join(', ') : null, isp: g.isp || g.org || null }
      }
    }
  } catch {
    // ignore
  }
  return { location: null, isp: null }
}

// Origin allowlist: localhost (any port) for dev, plus configured production
// origins. RP ID is the hostname of the validated origin.
function resolveRp(origin: string | null): { rpID: string; origin: string } | null {
  if (!origin) return null
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return null
  }
  const host = url.hostname
  if (host === 'localhost' || host === '127.0.0.1') return { rpID: host, origin }

  // @ts-expect-error: Deno global
  const allowed = (Deno.env.get('ALLOWED_RP_ORIGINS') ?? 'https://thebasemovement.creativeutil.com')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
  return allowed.includes(origin) ? { rpID: host, origin } : null
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

    const rp = resolveRp(req.headers.get('origin'))
    if (!rp) return json({ error: 'Origin not allowed' }, 403)

    // Identify caller from JWT.
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(jwt)
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const action: string = body.action

    // -- register-begin ---------------------------------------------------------
    if (action === 'register-begin') {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      const { data: existing } = await supabase
        .from('admin_webauthn_credentials')
        .select('credential_id, transports')
        .eq('admin_id', user.id)

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rp.rpID,
        userID: new TextEncoder().encode(user.id),
        userName: profile?.email ?? user.email ?? user.id,
        userDisplayName: profile?.full_name ?? profile?.email ?? 'Admin',
        attestationType: 'none',
        excludeCredentials: (existing ?? []).map(
          (c: { credential_id: string; transports: string[] | null }) => ({
            id: c.credential_id,
            transports: c.transports ?? undefined,
          })
        ),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform', // Windows Hello / Face ID / Touch ID
        },
      })

      await supabase.from('admin_webauthn_challenges').upsert({
        admin_id: user.id,
        purpose: 'registration',
        challenge: options.challenge,
        device_id: body.device_id ?? null,
      })

      return json({ options })
    }

    // -- register-complete ------------------------------------------------------
    if (action === 'register-complete') {
      const { data: ch } = await supabase
        .from('admin_webauthn_challenges')
        .select('challenge, device_id')
        .eq('admin_id', user.id)
        .eq('purpose', 'registration')
        .maybeSingle()
      if (!ch) return json({ error: 'No registration challenge in progress' }, 400)

      const verification = await verifyRegistrationResponse({
        response: body.credential,
        expectedChallenge: ch.challenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpID,
      })

      if (!verification.verified || !verification.registrationInfo) {
        return json({ verified: false, error: 'Biometric verification failed' }, 400)
      }

      const cred = verification.registrationInfo.credential
      const deviceId = body.device_id ?? ch.device_id ?? null

      await supabase.from('admin_webauthn_credentials').insert({
        admin_id: user.id,
        device_id: deviceId,
        credential_id: cred.id,
        public_key: isoBase64URL.fromBuffer(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports ?? null,
      })

      if (deviceId) {
        await supabase.from('admin_devices').update({ webauthn_enrolled: true }).eq('id', deviceId)
      }

      // Step-up enrolment (a known slot whose fingerprint changed but had no
      // passkey yet): rebind the slot to the new fingerprint after enrolling.
      if (deviceId && body.rebind && body.fingerprint_hash) {
        const ip = clientIp(req)
        const { location, isp } = await geoLocate(ip)
        await supabase.rpc('confirm_admin_device_step_up', {
          p_device_id: deviceId,
          p_fingerprint_hash: body.fingerprint_hash,
          p_ip: ip,
          p_location: location,
          p_user_agent: req.headers.get('user-agent'),
          p_isp: isp,
        })
      }

      await supabase
        .from('admin_webauthn_challenges')
        .delete()
        .eq('admin_id', user.id)
        .eq('purpose', 'registration')

      return json({ verified: true })
    }

    // -- authenticate-begin -----------------------------------------------------
    if (action === 'authenticate-begin') {
      const { data: creds } = await supabase
        .from('admin_webauthn_credentials')
        .select('credential_id, transports')
        .eq('admin_id', user.id)

      if (!creds || creds.length === 0) {
        // 200 so the client can branch to enrolment without parsing an error body.
        return json({ noCredentials: true })
      }

      const options = await generateAuthenticationOptions({
        rpID: rp.rpID,
        userVerification: 'preferred',
        allowCredentials: creds.map(
          (c: { credential_id: string; transports: string[] | null }) => ({
            id: c.credential_id,
            transports: c.transports ?? undefined,
          })
        ),
      })

      await supabase.from('admin_webauthn_challenges').upsert({
        admin_id: user.id,
        purpose: 'authentication',
        challenge: options.challenge,
        device_id: body.device_id ?? null,
      })

      return json({ options })
    }

    // -- authenticate-complete --------------------------------------------------
    if (action === 'authenticate-complete') {
      const { data: ch } = await supabase
        .from('admin_webauthn_challenges')
        .select('challenge, device_id')
        .eq('admin_id', user.id)
        .eq('purpose', 'authentication')
        .maybeSingle()
      if (!ch) return json({ error: 'No authentication challenge in progress' }, 400)

      const credId = body.credential?.id
      const { data: stored } = await supabase
        .from('admin_webauthn_credentials')
        .select('id, credential_id, public_key, counter, transports')
        .eq('admin_id', user.id)
        .eq('credential_id', credId)
        .maybeSingle()
      if (!stored) return json({ verified: false, error: 'Unknown credential' }, 400)

      const verification = await verifyAuthenticationResponse({
        response: body.credential,
        expectedChallenge: ch.challenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpID,
        credential: {
          id: stored.credential_id,
          publicKey: isoBase64URL.toBuffer(stored.public_key),
          counter: Number(stored.counter),
          transports: stored.transports ?? undefined,
        },
      })

      if (!verification.verified) {
        return json({ verified: false, error: 'Biometric verification failed' }, 400)
      }

      await supabase
        .from('admin_webauthn_credentials')
        .update({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', stored.id)

      await supabase
        .from('admin_webauthn_challenges')
        .delete()
        .eq('admin_id', user.id)
        .eq('purpose', 'authentication')

      // If this was a step-up for a known device slot, rebind the new fingerprint.
      const deviceId = body.device_id ?? ch.device_id ?? null
      let stepUp = null
      if (deviceId && body.fingerprint_hash) {
        const ip = clientIp(req)
        const { location, isp } = await geoLocate(ip)
        const { data } = await supabase.rpc('confirm_admin_device_step_up', {
          p_device_id: deviceId,
          p_fingerprint_hash: body.fingerprint_hash,
          p_ip: ip,
          p_location: location,
          p_user_agent: req.headers.get('user-agent'),
          p_isp: isp,
        })
        stepUp = data
      }

      return json({ verified: true, stepUp })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    console.error('[webauthn] error:', err)
    return json({ error: 'Internal error' }, 500)
  }
})
