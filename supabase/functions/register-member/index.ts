import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'

const MAX_BODY_BYTES = 50 * 1024 // 50 KB max payload

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/
const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/

const ALLOWED_NETWORKS = ['Ghana Network', 'Diaspora Network']
const ALLOWED_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
  'Diaspora',
]

const clientIp = (req: Request) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  req.headers.get('x-real-ip') ||
  req.headers.get('cf-connecting-ip') ||
  'unknown'

const sanitizeStr = (val: unknown, maxLen = 100): string => {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return handleCorsPreflight(req)

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const ip = clientIp(req)
    const rateCheck = await checkPersistentRateLimit(supabase, `register-member::${ip}`, 5, 600)
    if (!rateCheck.allowed) {
      return json(
        {
          error: `Too many registration attempts. Please wait ${rateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

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

    // Strict Runtime Schema Validations
    if (!fullName || fullName.length < 2) {
      return json({ success: false, error: 'Full name must be at least 2 characters.' }, 400)
    }

    if (authEmail && !EMAIL_REGEX.test(authEmail)) {
      return json({ success: false, error: 'Invalid email address format.' }, 400)
    }

    if (phone && !PHONE_REGEX.test(phone.replace(/\s+/g, ''))) {
      return json({ success: false, error: 'Invalid phone number format (E.164 expected).' }, 400)
    }

    if (!authEmail && !phone) {
      return json({ success: false, error: 'Either email or phone number is required.' }, 400)
    }

    if (!PASSWORD_POLICY_REGEX.test(password)) {
      return json(
        {
          success: false,
          error:
            'Password must be at least 8 characters long and contain uppercase, lowercase, and a number.',
        },
        400
      )
    }

    const networkType = sanitizeStr(userRow.network_type, 50) || 'Ghana Network'
    if (!ALLOWED_NETWORKS.includes(networkType)) {
      return json({ success: false, error: 'Invalid network_type specified.' }, 400)
    }
    // Derive the platform value expected by the DB trigger
    const platform = networkType === 'Diaspora Network' ? 'DIASPORA' : 'GHANA'

    const region = sanitizeStr(userRow.region, 50)
    const constituency = sanitizeStr(userRow.constituency, 100)
    const country =
      sanitizeStr(userRow.country, 50) || (networkType === 'Ghana Network' ? 'Ghana' : '')
    const diasporaCountry = sanitizeStr(userRow.diaspora_country, 50)

    if (networkType === 'Ghana Network') {
      if (region && !ALLOWED_REGIONS.includes(region)) {
        return json({ success: false, error: `Invalid region: ${region}` }, 400)
      }
      if (region && constituency) {
        // ghana_constituencies links to ghana_regions via region_id (no direct region text column)
        const { data: regionRow } = await supabase
          .from('ghana_regions')
          .select('id')
          .ilike('name', region)
          .limit(1)
          .single()

        const { data: regionConstituencies } = regionRow
          ? await supabase
              .from('ghana_constituencies')
              .select('name')
              .eq('region_id', regionRow.id)
          : { data: null }

        const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
        const inputNorm = norm(constituency)
        const matchedConstituency = regionConstituencies?.find((c: any) => norm(c.name) === inputNorm)

        if (!matchedConstituency) {
          return json(
            {
              success: false,
              error: `Constituency '${constituency}' does not belong to region '${region}'.`,
            },
            400
          )
        }
      }

    } else if (networkType === 'Diaspora Network') {
      const activeCountry = diasporaCountry || country
      if (!activeCountry || activeCountry.toLowerCase() === 'ghana') {
        return json(
          { success: false, error: 'Diaspora Network requires a valid overseas country.' },
          400
        )
      }
    }

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

    // Explicit Schema Allowlist matching public.users table columns exactly
    const sanitizedUserRow = {
      id: userId,
      full_name: fullName,
      email: authEmail || null,
      phone_number: phone || null,
      platform,
      region: region || null,
      constituency: constituency || null,
      country: country || null,
      chapter: sanitizeStr(userRow.chapter, 100) || null,
      city: sanitizeStr(userRow.city, 100) || null,
      district: sanitizeStr(userRow.district, 100) || null,
      voters_id_card: sanitizeStr(userRow.voters_id_card || userRow.voters_id, 30) || null,
      polling_station_code:
        sanitizeStr(userRow.polling_station_code || userRow.polling_station, 150) || null,
      education_level: sanitizeStr(userRow.education_level, 50) || null,
      emergency_name: sanitizeStr(userRow.emergency_name, 100) || null,
      emergency_relationship: sanitizeStr(userRow.emergency_relationship, 50) || null,
      emergency_phone: sanitizeStr(userRow.emergency_phone, 20) || null,
      children_count: typeof userRow.children_count === 'number' ? userRow.children_count : null,
      residential_address: sanitizeStr(userRow.residential_address, 200) || null,
      birth_year: typeof userRow.birth_year === 'number' ? userRow.birth_year : null,
      religion: sanitizeStr(userRow.religion, 50) || null,
      secondary_phone: sanitizeStr(userRow.secondary_phone, 20) || null,
      referred_by:
        refParam ||
        (typeof userRow.referred_by === 'string' ? sanitizeStr(userRow.referred_by, 50) : null),
      status: 'Active',
      verification_status: 'Pending',
      registration_source: sanitizeStr(userRow.registration_source, 20) || 'web',
      registered_by: userId,
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
      try {
        await supabase.rpc('award_referral_points', { p_new_member_id: userId })
      } catch (e: unknown) {
        console.warn('[register-member] referral RPC failed:', e)
      }
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
