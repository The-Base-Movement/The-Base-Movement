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

async function resolveProfile(admin: ReturnType<typeof createClient>, identifier: string) {
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-expect-error: Deno global
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const { identifier, phone, password } = await req.json()
    const loginIdentifier = String(identifier || phone || '').trim()
    if (!loginIdentifier || !password) {
      return json({ error: 'Identifier and password are required.' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Resolve the member's auth account by phone number or registration number.
    // Local diaspora numbers can share a leading 0 with Ghana numbers, so after
    // exact matches we allow a unique suffix match and reject ambiguous results.
    const profile = await resolveProfile(admin, loginIdentifier)

    if (!profile) return json({ error: GENERIC_FAIL }, 401)

    const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(profile.id)
    if (authUserError || !authUser?.user?.email) return json({ error: GENERIC_FAIL }, 401)

    // Sign in with the real auth email using the anon client so the resulting
    // session is a normal user session (not service-role)
    const anon = createClient(supabaseUrl, anonKey)
    const { data, error } = await anon.auth.signInWithPassword({
      email: authUser.user.email,
      password,
    })

    if (error || !data.session) return json({ error: GENERIC_FAIL }, 401)

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
