// phone-login
//
// Members who registered with a phone number sign in by phone. The client
// normally translates the phone into the placeholder email <phone>@thebase.org,
// but once a member is appointed admin their auth email is switched to a real
// address (see assign-admin-email) and that translation breaks.
//
// This function resolves phone → actual auth email server-side and performs
// the password sign-in, so phone login keeps working for everyone. The email
// is never revealed without a correct password.
//
// Body: { identifier?: string, phone?: string, password: string }
// Returns: { access_token, refresh_token } or a generic 401.

// @ts-ignore: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import {
  checkPersistentRateLimit,
  peekRateLimit,
  recordFailedAttempt,
} from '../_shared/persistent-rate-limit.ts'

function phoneCandidates(raw: string): { exact: string[]; suffix: string | null } {
  const cleaned = raw.trim()
  const digits = cleaned.replace(/\D/g, '')
  const exact = new Set<string>()

  if (cleaned.startsWith('+')) exact.add(cleaned)
  if (digits.startsWith('233')) exact.add(`+${digits}`)
  if (digits.startsWith('0')) exact.add(`+233${digits.slice(1)}`)
  if (digits) {
    exact.add(`+${digits}`)
    exact.add(`+233${digits}`)
  }

  const suffix = digits.startsWith('233')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits
  return { exact: Array.from(exact), suffix: suffix.length >= 7 ? suffix : null }
}

const GENERIC_FAIL = 'Invalid login credentials'
const FAILURE_DELAY_MS = 900

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

async function resolveProfile(
  admin: SupabaseClient,
  identifier: string
): Promise<{ id: string } | null> {
  const trimmed = identifier.trim()
  const digits = trimmed.replace(/\D/g, '')
  const looksLikePhone = digits.length >= 7 && /^[+\d\s().-]+$/.test(trimmed)
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)

  if (looksLikeEmail) {
    const { data } = await admin.from('users').select('id').ilike('email', trimmed).limit(2)

    if (data?.length === 1) return data[0]
    return null
  }

  if (/^TBM-[A-Z]{2}-\d+$/i.test(trimmed)) {
    const { data } = await admin
      .from('users')
      .select('id')
      .eq('registration_number', trimmed.toUpperCase())
      .maybeSingle()

    return data
  }

  if (!looksLikePhone) return null

  const candidates = phoneCandidates(trimmed)
  if (candidates.exact.length) {
    const { data } = await admin
      .from('users')
      .select('id')
      .in('phone_number', candidates.exact)
      .limit(2)

    if (data?.length === 1) return data[0]
    if ((data?.length ?? 0) > 1) return null
  }

  if (candidates.suffix) {
    const { data } = await admin
      .from('users')
      .select('id')
      .ilike('phone_number', `%${candidates.suffix}`)
      .limit(2)

    if (data?.length === 1) return data[0]
  }

  return null
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })

  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // @ts-ignore: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-ignore: Deno global
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const loginIdentifier =
      typeof body.identifier === 'string'
        ? body.identifier
        : typeof body.phone === 'string'
          ? body.phone
          : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!loginIdentifier || !password) {
      return json({ error: GENERIC_FAIL }, 401)
    }

    const ip = clientIp(req)

    const ipRateCheck = await checkPersistentRateLimit(admin, `phone-login::${ip}`, 20, 300)
    if (!ipRateCheck.allowed) {
      return json(
        {
          error: `Too many login attempts. Please try again in ${ipRateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

    const throttleKey = `phone-login::${loginIdentifier.toLowerCase()}`
    const rateCheck = await peekRateLimit(admin, throttleKey, 10, 300)
    if (!rateCheck.allowed) {
      return json(
        {
          error: `Too many login attempts. Please wait ${rateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

    // Resolve the member's auth account by phone number or registration number.
    // Local diaspora numbers can share a leading 0 with Ghana numbers, so after
    // exact matches we allow a unique suffix match and reject ambiguous results.
    const profile = await resolveProfile(admin, loginIdentifier)

    if (!profile) {
      await recordFailedAttempt(admin, throttleKey, 300)
      await delay(FAILURE_DELAY_MS)
      return json({ error: GENERIC_FAIL }, 401)
    }

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id)
    if (authUserError || (!authUser?.user?.email && !authUser?.user?.phone)) {
      await recordFailedAttempt(admin, throttleKey, 300)
      await delay(FAILURE_DELAY_MS)
      return json({ error: GENERIC_FAIL }, 401)
    }

    // Sign in with the real auth email or phone using the anon client so the resulting
    // session is a normal user session (not service-role)
    const anon = createClient(supabaseUrl, anonKey)
    const signInCredentials = authUser.user.email
      ? { email: authUser.user.email, password }
      : { phone: authUser.user.phone ?? '', password }

    const { data, error } = await anon.auth.signInWithPassword(signInCredentials)

    if (error || !data.session) {
      // Fallback: Check if user has a valid legacy SHA-512 password from Site A
      const { data: isLegacyValid } = await admin.rpc('verify_legacy_password', {
        p_identifier: loginIdentifier,
        p_plain_password: password,
      })

      if (isLegacyValid) {
        // Legacy password verified! Update the user's password in auth.users
        await admin.auth.admin.updateUserById(profile.id, { password })

        // Re-attempt sign in with the newly updated password
        const { data: legacySessionData, error: legacySessionErr } =
          await anon.auth.signInWithPassword(signInCredentials)

        if (!legacySessionErr && legacySessionData?.session) {
          return json({
            access_token: legacySessionData.session.access_token,
            refresh_token: legacySessionData.session.refresh_token,
          })
        }
      }

      await recordFailedAttempt(admin, throttleKey, 300)
      await delay(FAILURE_DELAY_MS)
      return json({ error: GENERIC_FAIL }, 401)
    }

    return json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[PHONE-LOGIN] ${errorMessage}`)
    return json({ error: 'Login failed. Please try again.' }, 500)
  }
})
