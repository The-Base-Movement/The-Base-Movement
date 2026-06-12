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
// Body: { phone: string, password: string }
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

function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) return cleaned
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+${digits}`
}

const GENERIC_FAIL = 'Invalid login credentials'

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

    const { phone, password } = await req.json()
    if (!phone || !password) {
      return json({ error: 'Phone and password are required.' }, 400)
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const admin = createClient(supabaseUrl, serviceKey)

    // Resolve the member's auth account by phone number
    const { data: profile } = await admin
      .from('users')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

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
