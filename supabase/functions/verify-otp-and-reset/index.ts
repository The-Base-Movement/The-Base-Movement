// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import {
  getRetryAfterMs,
  registerAttempt,
  type RateLimitEntry,
} from '../_shared/password-reset-rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FAILURE_DELAY_MS = 800
const VERIFY_WINDOW_MS = 10 * 60 * 1000
const VERIFY_MAX_ATTEMPTS = 8
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000
const verifyThrottleStore = new Map<string, RateLimitEntry>()

async function delayedJson(body: unknown, status: number) {
  await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { phone, otp, newPassword } = await req.json()
    if (!phone || !otp || !newPassword) {
      return new Response(JSON.stringify({ error: 'Phone, OTP, and new password are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    if (String(newPassword).length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)
    const now = Date.now()
    const throttleKey = `${clientIp(req)}::${normalizedPhone}`
    const currentThrottle = verifyThrottleStore.get(throttleKey)
    const retryAfterMs = getRetryAfterMs(now, currentThrottle)
    if (retryAfterMs > 0) {
      return new Response(
        JSON.stringify({
          error: `Too many verification attempts. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    // 1. Fetch and validate OTP code
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id, expires_at')
      .eq('phone', normalizedPhone)
      .eq('otp', otp.trim())
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpRecord) {
      verifyThrottleStore.set(
        throttleKey,
        registerAttempt(
          now,
          currentThrottle,
          VERIFY_WINDOW_MS,
          VERIFY_MAX_ATTEMPTS,
          VERIFY_LOCKOUT_MS
        )
      )
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    // 2. Check if code has expired
    const isExpired = new Date(otpRecord.expires_at) < new Date()
    if (isExpired) {
      verifyThrottleStore.set(
        throttleKey,
        registerAttempt(
          now,
          currentThrottle,
          VERIFY_WINDOW_MS,
          VERIFY_MAX_ATTEMPTS,
          VERIFY_LOCKOUT_MS
        )
      )
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

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

    const { error: updateOtpError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('phone', normalizedPhone)
    if (updateOtpError) {
      throw new Error(`Failed to invalidate verification code: ${updateOtpError.message}`)
    }
    verifyThrottleStore.delete(throttleKey)

    return new Response(
      JSON.stringify({ success: true, message: 'Your password has been successfully reset.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[VERIFY-OTP-ERROR] ${errorMessage}`)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
