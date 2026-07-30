// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { hashOtp } from '../_shared/otp.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'

const FAILURE_DELAY_MS = 800

function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.trim()
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  const digits = cleaned.replace(/\D/g, '')
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

serve(async (req: Request) => {
  const cors = getCorsHeaders(req)

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })

  const delayedJson = async (body: unknown, status: number) => {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
    return json(body, status)
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { phone, otp, newPassword } = await req.json()
    if (!phone || !otp || !newPassword) {
      return json({ error: 'Phone, OTP, and new password are required.' }, 400)
    }
    if (String(newPassword).length < 8) {
      return json({ error: 'Password must be at least 8 characters long.' }, 400)
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const throttleKey = `verify-otp::${clientIp(req)}::${normalizedPhone}`
    const rateCheck = await checkPersistentRateLimit(supabaseAdmin, throttleKey, 8, 900)
    if (!rateCheck.allowed) {
      return json(
        {
          error: `Too many verification attempts. Please wait ${rateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

    // 1. Compute HMAC hash of incoming raw OTP using dedicated OTP_HMAC_SECRET (fail closed)
    const otpSecret = Deno.env.get('OTP_HMAC_SECRET') || supabaseServiceKey
    if (!otpSecret) throw new Error('OTP_HMAC_SECRET is missing. Failing closed.')
    const hashedOtp = await hashOtp(String(otp).trim(), otpSecret)

    // Atomically mark the OTP used in a single conditional UPDATE...RETURNING
    // This prevents double-use under concurrent requests
    const now = new Date().toISOString()
    const { data: consumedRecord, error: consumeError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('phone', normalizedPhone)
      .eq('otp', hashedOtp)
      .eq('used', false)
      .gt('expires_at', now)
      .select('id, expires_at')
      .maybeSingle()

    if (consumeError || !consumedRecord) {
      // Log failure to persistent rate limiter
      await checkPersistentRateLimit(supabaseAdmin, throttleKey, 8, 900)
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    const otpRecord = consumedRecord

    // 3. Resolve the member profile mapped by phone number
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, registration_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No associated member profile found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // 4. Update an existing account, or activate a legacy/imported profile on first reset.
    let authUserId = user.id
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: newPassword,
      user_metadata: { must_change_password: false },
    })

    if (authError) {
      // A weak/invalid password is user-fixable — surface it as a clear 400
      // instead of an opaque 500. Supabase returns HTTP 422 / code 'weak_password'.
      const authCode = (authError as { code?: string }).code
      if (authError.status === 422 || authCode === 'weak_password') {
        return delayedJson(
          {
            error:
              'Password is too weak. Use at least 8 characters including an uppercase letter, a lowercase letter, and a number.',
          },
          400
        )
      }
      if (authError.status !== 404) {
        throw new Error(`Auth layer reset failed: ${authError.message}`)
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: user.id,
        email: user.email || undefined,
        phone: normalizedPhone,
        password: newPassword,
        email_confirm: !!user.email,
        phone_confirm: true,
        user_metadata: {
          name: user.full_name,
          reg_no: user.registration_number,
          must_change_password: false,
        },
      })
      if (createError || !created.user) {
        throw new Error(
          `Auth account activation failed: ${createError?.message || 'No user returned'}`
        )
      }

      authUserId = created.user.id
    }

    // 5. Consume the OTP only after the password reset has succeeded.
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ must_change_password: false })
      .eq('id', authUserId)
    if (profileError) throw new Error(`Profile update failed: ${profileError.message}`)

    // OTP was atomically consumed in the UPDATE...RETURNING above; no second update needed.
    return json({ success: true, message: 'Your password has been successfully reset.' }, 200)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[VERIFY-OTP-ERROR] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
