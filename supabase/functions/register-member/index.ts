import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders } from '../_shared/cors.ts'

const MAX_BODY_BYTES = 50 * 1024 // 50 KB max payload

const sanitizeStr = (val: unknown, maxLen = 100): string => {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const contentLength = Number(req.headers.get('content-length') ?? '0')
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: 'Payload size exceeds limit.' }, 413)
    }

    const bodyText = await req.text()
    if (bodyText.length > MAX_BODY_BYTES) {
      return json({ error: 'Payload size exceeds limit.' }, 413)
    }

    let payload: Record<string, unknown> = {}
    try {
      payload = JSON.parse(bodyText)
    } catch {
      return json({ error: 'Invalid JSON payload.' }, 400)
    }

    const authEmail = sanitizeStr(payload.authEmail, 150)
    const phone = sanitizeStr(payload.phone, 20)
    const password = typeof payload.password === 'string' ? payload.password : ''
    const fullName = sanitizeStr(payload.fullName, 100)
    const refParam = sanitizeStr(payload.refParam, 50)
    const userRow =
      typeof payload.userRow === 'object' && payload.userRow !== null
        ? (payload.userRow as Record<string, unknown>)
        : {}

    if (!password || password.length < 8 || (!authEmail && !phone) || !fullName) {
      return json(
        { success: false, error: 'Missing or invalid required registration details.' },
        400
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    // Pre-check for duplicate without revealing specific account state
    const [phoneRes, emailRes] = await Promise.all([
      phone
        ? supabase.from('users').select('id').eq('phone_number', phone).limit(1)
        : Promise.resolve({ data: [], error: null }),
      authEmail
        ? supabase.from('users').select('id').ilike('email', authEmail).limit(1)
        : Promise.resolve({ data: [], error: null }),
    ])

    const genericSuccess = {
      success: true,
      message: 'If the registration details are valid, account setup has been initiated.',
    }

    if (emailRes.data?.length || phoneRes.data?.length) {
      // Prevent member enumeration by returning uniform success message
      return json(genericSuccess, 200)
    }

    // Create auth user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: authEmail || undefined,
      phone: authEmail ? undefined : phone,
      password,
      email_confirm: !!authEmail,
      phone_confirm: !authEmail,
      user_metadata: { full_name: fullName },
    })

    if (createErr || !created?.user) {
      console.warn(
        '[register-member] createUser attempt returned generic response:',
        createErr?.message
      )
      return json(genericSuccess, 200)
    }

    const userId = created.user.id

    // Explicit Schema Allowlist with Server-Generated Administrative State
    const sanitizedUserRow = {
      id: userId,
      full_name: fullName,
      email: authEmail || null,
      phone_number: phone || null,
      region: sanitizeStr(userRow.region, 50),
      constituency: sanitizeStr(userRow.constituency, 100),
      country: sanitizeStr(userRow.country, 50) || 'Ghana',
      network_type: sanitizeStr(userRow.network_type, 50) || 'Ghana Network',
      diaspora_country: sanitizeStr(userRow.diaspora_country, 50),
      city: sanitizeStr(userRow.city, 100),
      voters_id: sanitizeStr(userRow.voters_id, 30),
      polling_station: sanitizeStr(userRow.polling_station, 150),
      // Server-Enforced Administrative & Security Fields (Client values strictly overridden)
      role: 'member',
      status: 'Active',
      verification_status: 'Pending',
      registration_source: 'web',
      registered_by: userId,
      approval_status: 'approved',
    }

    // Insert into public.users. On failure, delete auth user.
    const { data: savedUser, error: dbErr } = await supabase
      .from('users')
      .insert(sanitizedUserRow)
      .select('registration_number')
      .single()

    if (dbErr) {
      await supabase.auth.admin
        .deleteUser(userId)
        .catch((e) => console.error('[register-member] rollback deleteUser failed:', e))
      console.warn('[register-member] users insert failed, rolled back:', dbErr.message)
      return json(genericSuccess, 200)
    }

    const registrationNumber = savedUser.registration_number

    if (refParam) {
      await supabase
        .rpc('award_referral_points', { p_new_member_id: userId })
        .catch((e: unknown) => console.warn('[register-member] referral RPC failed:', e))
    }

    const contactEmail = authEmail || sanitizedUserRow.email
    if (contactEmail) {
      const nameParts = fullName.split(/\s+/)
      fetch(`${supabaseUrl}/functions/v1/sync-resend-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({
          email: contactEmail,
          first_name: nameParts[0] ?? '',
          last_name: nameParts.slice(1).join(' '),
          reg_no: registrationNumber,
          region: sanitizedUserRow.region,
          constituency: sanitizedUserRow.constituency,
          source: 'member',
        }),
      }).catch((e) => console.warn('[register-member] Resend contact sync dispatch failed:', e))
    }

    return json({ success: true, userId, regNo: registrationNumber })
  } catch (err) {
    console.error('[register-member] error:', err)
    return json({ success: false, error: 'Registration failed. Please try again.' }, 500)
  }
})
