import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Atomic member registration.
// -------------------------------------------------------------
// Creates the Supabase Auth user AND the public.users row as a single unit: if
// the profile insert fails, the just-created auth user is deleted (rollback) so
// no orphaned auth account is ever left behind. This replaces the old two-step
// client flow (auth.signUp then a separate insert) that could strand an auth
// user with no member row and lock the person out on retry with "already exists".
//
// Public by necessity — registrants have no account yet. Uses the service role
// server-side; the client never sees it. The avatar upload stays on the client
// (it needs the signed-in session + client-side crop) as an optional post-step.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const isDuplicateMsg = (m: string) => /already.*(registered|exists|been registered)/i.test(m || '')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { authEmail, phone, password, fullName, userRow, refParam } = await req.json()

    if (!password || (!authEmail && !phone) || !userRow || typeof userRow !== 'object') {
      return json({ success: false, error: 'Missing required registration details.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Pre-check for an existing member (clean, specific message).
    const [phoneRes, emailRes] = await Promise.all([
      phone
        ? supabase.from('users').select('id').eq('phone_number', phone).limit(1)
        : Promise.resolve({ data: [], error: null }),
      authEmail
        ? supabase.from('users').select('id').ilike('email', authEmail).limit(1)
        : Promise.resolve({ data: [], error: null }),
    ])
    if (emailRes.data?.length)
      return json({ success: false, error: 'duplicate', field: 'email' }, 409)
    if (phoneRes.data?.length)
      return json({ success: false, error: 'duplicate', field: 'phone' }, 409)

    // 2. Create the auth user (confirmed, so the client can sign in immediately).
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: authEmail || undefined,
      phone: authEmail ? undefined : phone,
      password,
      email_confirm: !!authEmail,
      phone_confirm: !authEmail,
      user_metadata: { full_name: fullName },
    })
    if (createErr || !created?.user) {
      const msg = createErr?.message || 'Could not create the account.'
      if (isDuplicateMsg(msg)) {
        return json(
          { success: false, error: 'duplicate', field: authEmail ? 'email' : 'phone' },
          409
        )
      }
      console.error('[register-member] createUser failed:', msg)
      return json({ success: false, error: msg }, 400)
    }

    const userId = created.user.id

    // 3. Insert the member profile. On ANY failure, roll back the auth user.
    const { error: dbErr } = await supabase.from('users').insert({ ...userRow, id: userId })
    if (dbErr) {
      await supabase.auth.admin
        .deleteUser(userId)
        .catch((e) => console.error('[register-member] rollback deleteUser failed:', e))
      if (dbErr.code === '23505') {
        return json(
          { success: false, error: 'duplicate', field: authEmail ? 'email' : 'phone' },
          409
        )
      }
      console.error('[register-member] users insert failed, rolled back:', dbErr.message)
      return json({ success: false, error: 'Could not save your details. Please try again.' }, 500)
    }

    // 4. Referral points — best-effort, never blocks a completed registration.
    if (refParam) {
      await supabase
        .rpc('award_referral_points', { p_new_member_id: userId })
        .catch((e: unknown) => console.warn('[register-member] referral RPC failed:', e))
    }

    return json({ success: true, userId, regNo: userRow.registration_number })
  } catch (err) {
    console.error('[register-member] error:', err)
    return json({ success: false, error: 'Registration failed. Please try again.' }, 500)
  }
})
