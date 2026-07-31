// @ts-ignore: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { peekRateLimit, recordFailedAttempt } from '../_shared/persistent-rate-limit.ts'
import { isTwilioVerifyConfigured, checkTwilioVerify } from '../_shared/twilio-verify.ts'
import { normalizeRecoveryPhone } from '../_shared/recovery-phone.ts'
import { hashOtp } from '../_shared/otp.ts'

const FAILURE_DELAY_MS = 800

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

  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const otpSecret = Deno.env.get('OTP_HMAC_SECRET') || 'thebase-otp-secret-key-2026'
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { phone, otp, newPassword } = await req.json()
    if (!phone || !otp || !newPassword) {
      return json({ error: 'Phone, OTP, and new password are required.' }, 400)
    }
    if (String(newPassword).length < 8) {
      return json({ error: 'Password must be at least 8 characters long.' }, 400)
    }

    const normalizedPhone = normalizeRecoveryPhone(phone)
    const throttleKey = `verify-otp::${clientIp(req)}::${normalizedPhone}`
    const rateCheck = await peekRateLimit(supabaseAdmin, throttleKey, 8, 900)
    if (!rateCheck.allowed) {
      return json(
        {
          error: `Too many verification attempts. Please wait ${rateCheck.retry_after_sec} seconds.`,
        },
        429
      )
    }

    let approved = false

    if (isTwilioVerifyConfigured()) {
      try {
        approved = await checkTwilioVerify(normalizedPhone, String(otp).trim())
      } catch (tErr: unknown) {
        console.warn(`[VERIFY-OTP] Twilio check failed:`, tErr)
      }
    }

    if (!approved) {
      // Fallback check against local password_reset_otps table
      const hashedInputOtp = await hashOtp(String(otp).trim(), otpSecret)
      const now = new Date().toISOString()

      const { data: validOtp } = await supabaseAdmin
        .from('password_reset_otps')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('otp', hashedInputOtp)
        .eq('used', false)
        .gte('expires_at', now)
        .maybeSingle()

      if (validOtp) {
        approved = true
      }
    }

    if (!approved) {
      await recordFailedAttempt(supabaseAdmin, throttleKey, 900)
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, registration_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    if (userError || !user) {
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    let authUserId = user.id
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      password: newPassword,
      user_metadata: { must_change_password: false },
    })

    if (authError) {
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
      } as never)
      if (createError || !created.user) {
        throw new Error(
          `Auth account activation failed: ${createError?.message || 'No user returned'}`
        )
      }

      authUserId = created.user.id
    }

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ must_change_password: false })
      .eq('id', authUserId)
    if (profileError) throw new Error(`Profile update failed: ${profileError.message}`)

    const { data: latestAudit } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id')
      .eq('phone', normalizedPhone)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latestAudit?.id) {
      const { error: auditError } = await supabaseAdmin
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', latestAudit.id)
      if (auditError) {
        console.warn(`[VERIFY-OTP] Failed to update audit row: ${auditError.message}`)
      }
    }

    return json({ success: true, message: 'Your password has been successfully reset.' }, 200)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[VERIFY-OTP-ERROR] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
