// webauthn
//
// Biometric (WebAuthn / passkey) ceremonies for privileged admins, layered on
// top of device binding. Four actions:
//   register-begin / register-complete         -> enrol a platform authenticator
//   authenticate-begin / authenticate-complete -> verify it for sensitive admin actions
//
// The admin is always derived from the verified JWT. The RP ID is derived from
// the request Origin and validated against an allowlist, so the same code works
// on localhost, thebasemovement.creativeutil.com, and thebasemovement.com after
// the migration (extra origins can be added via ALLOWED_RP_ORIGINS).

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

function jwtAal(jwt: string): string | null {
  try {
    const encoded = jwt.split('.')[1]
    if (!encoded) return null
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded)).aal ?? null
  } catch {
    return null
  }
}

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
// origins. RP ID is the registrable domain (strip leading www.) so a single
// credential is valid on both https://thebasemovement.org.gh and
// https://www.thebasemovement.org.gh per the WebAuthn spec.
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

  // Hardcoded baseline: every origin the app actually serves from, so a
  // stale ALLOWED_RP_ORIGINS secret can never exclude the live production URL.
  // Keep in sync with the domains attached to the Vercel project.
  const BASELINE = [
    'https://thebasemovement.info',
    'https://www.thebasemovement.info',
    'https://thebasemovement.org.gh',
    'https://www.thebasemovement.org.gh',
    'https://thebasemovement.com',
    'https://www.thebasemovement.com',
    'https://thebasemovement.creativeutil.com',
    'https://nevermind-beta.vercel.app',
    'https://nevermind-stifflers-projects.vercel.app',
    'https://nevermind-git-main-stifflers-projects.vercel.app',
  ]
  // @ts-expect-error: Deno global
  const envOrigins = Deno.env.get('ALLOWED_RP_ORIGINS') ?? ''
  const extra = envOrigins
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
  const allowed = new Set([...BASELINE, ...extra])
  if (!allowed.has(origin)) return null

  // Strip leading 'www.' so the RP ID is the registrable domain. A credential
  // enrolled on www.thebasemovement.org.gh is then also valid on the bare domain
  // and vice versa, per the WebAuthn origin-validation spec.
  const rpID = host.startsWith('www.') ? host.slice(4) : host
  return { rpID, origin }
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

    if (body.rebind && jwtAal(jwt) !== 'aal2') {
      return json({ error: 'MFA verification is required for device recovery' }, 403)
    }

    // -- register-begin ---------------------------------------------------------
    if (action === 'register-begin') {
      if (body.rebind) {
        const { data: ownedDevice } = await supabase
          .from('admin_devices')
          .select('id')
          .eq('id', body.device_id)
          .eq('admin_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        if (!ownedDevice) return json({ error: 'Active device slot not found' }, 403)
      }

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

      if (body.rebind) {
        const { data: ownedDevice } = await supabase
          .from('admin_devices')
          .select('id')
          .eq('id', deviceId)
          .eq('admin_id', user.id)
          .eq('status', 'active')
          .maybeSingle()
        if (!ownedDevice) return json({ error: 'Active device slot not found' }, 403)
      }

      const { data: insertedCredential, error: insertError } = await supabase
        .from('admin_webauthn_credentials')
        .insert({
          admin_id: user.id,
          device_id: deviceId,
          credential_id: cred.id,
          public_key: isoBase64URL.fromBuffer(cred.publicKey),
          counter: cred.counter,
          transports: cred.transports ?? null,
        })
        .select('id')
        .single()
      if (insertError) return json({ error: 'Could not save biometric credential' }, 500)

      if (deviceId) {
        await supabase.from('admin_devices').update({ webauthn_enrolled: true }).eq('id', deviceId)
      }

      // Record a completed verification ceremony against the known slot without
      // rewriting the enrolled device fingerprint.
      if (deviceId && body.rebind && body.fingerprint_hash) {
        const ip = clientIp(req)
        const { location, isp } = await geoLocate(ip)
        const { error: rebindError } = await supabase.rpc('confirm_admin_device_step_up', {
          p_device_id: deviceId,
          p_fingerprint_hash: body.fingerprint_hash,
          p_ip: ip,
          p_location: location,
          p_user_agent: req.headers.get('user-agent'),
          p_isp: isp,
        })
        if (rebindError) {
          await supabase.from('admin_webauthn_credentials').delete().eq('id', insertedCredential.id)
          return json({ error: 'Device recovery could not be saved' }, 500)
        }
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

      // Record the verification against the known slot for activity/audit use.
      const deviceId = body.device_id ?? ch.device_id ?? null
      let stepUp = null
      if (deviceId && body.fingerprint_hash) {
        const ip = clientIp(req)
        const { location, isp } = await geoLocate(ip)
        const { data, error: stepUpError } = await supabase.rpc('confirm_admin_device_step_up', {
          p_device_id: deviceId,
          p_fingerprint_hash: body.fingerprint_hash,
          p_ip: ip,
          p_location: location,
          p_user_agent: req.headers.get('user-agent'),
          p_isp: isp,
        })
        if (stepUpError) {
          console.error('[webauthn] device step-up confirmation failed:', stepUpError)
          return json({ verified: false, error: 'Device verification could not be saved' }, 500)
        }
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
