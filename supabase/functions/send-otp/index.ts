// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import {
  getRetryAfterMs,
  registerAttempt,
  type RateLimitEntry,
} from '../_shared/password-reset-rate-limit.ts'
import { sendSms } from '../_shared/sms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_COOLDOWN_MS = 60 * 1000
const OTP_MAX_PER_WINDOW = 3
const IP_WINDOW_MS = 10 * 60 * 1000
const IP_MAX_ATTEMPTS = 6
const IP_LOCKOUT_MS = 15 * 60 * 1000
const ipThrottleStore = new Map<string, RateLimitEntry>()

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function json(body: unknown, status: number) {
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { phone, reg_no } = await req.json()
    if (!phone || !reg_no) {
      return json({ error: 'Phone and registration number are required.' }, 400)
    }

    const now = Date.now()
    const ip = clientIp(req)
    const currentIpThrottle = ipThrottleStore.get(ip)
    const retryAfterMs = getRetryAfterMs(now, currentIpThrottle)
    if (retryAfterMs > 0) {
      return json(
        {
          error: `Too many reset requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        },
        429
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    const recentCutoff = new Date(Date.now() - OTP_WINDOW_MS).toISOString()
    const {
      data: recentOtps,
      error: recentOtpError,
      count: recentOtpCount,
    } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id, created_at', { count: 'exact' })
      .eq('phone', normalizedPhone)
      .gte('created_at', recentCutoff)
      .order('created_at', { ascending: false })

    if (recentOtpError) {
      throw new Error(`Failed to check recent OTP requests: ${recentOtpError.message}`)
    }

    const latestCreatedAt = recentOtps?.[0]?.created_at
    if (latestCreatedAt) {
      const retryAfterMs = OTP_COOLDOWN_MS - (Date.now() - new Date(latestCreatedAt).getTime())
      if (retryAfterMs > 0) {
        return new Response(
          JSON.stringify({
            error: `Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before requesting another code.`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        )
      }
    }

    if ((recentOtpCount ?? 0) >= OTP_MAX_PER_WINDOW) {
      return json({ error: 'Too many reset requests. Please try again later.' }, 429)
    }

    // 1. Verify user profile exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('phone_number', normalizedPhone)
      .eq('registration_number', reg_no.trim())
      .maybeSingle()

    if (userError || !user) {
      ipThrottleStore.set(
        ip,
        registerAttempt(now, currentIpThrottle, IP_WINDOW_MS, IP_MAX_ATTEMPTS, IP_LOCKOUT_MS)
      )
      return json(
        {
          success: true,
          message:
            'If the details match a member record, a security verification code will be sent shortly.',
        },
        200
      )
    }

    // 2. Generate a secure 6-digit OTP code
    const buf = crypto.getRandomValues(new Uint32Array(1))
    const otp = String((buf[0] % 900000) + 100000)

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now

    // 3. Store the OTP securely
    const { error: otpError } = await supabaseAdmin.from('password_reset_otps').insert({
      phone: normalizedPhone,
      otp,
      expires_at: expiresAt,
    })

    if (otpError) {
      throw new Error(`Failed to store OTP: ${otpError.message}`)
    }

    ipThrottleStore.set(
      ip,
      registerAttempt(now, currentIpThrottle, IP_WINDOW_MS, IP_MAX_ATTEMPTS, IP_LOCKOUT_MS)
    )

    // 4. Send SMS via MNotify
    const sms = await sendSms(
      [normalizedPhone],
      `Your The Base Movement verification OTP code is: ${otp}. Valid for 10 minutes.`
    )
    if (!sms.ok) {
      console.warn(
        `[OTP-DEBUG] SMS dispatch failed (${sms.detail}) for ${user.full_name} (${normalizedPhone})`
      )
    }

    return json(
      {
        success: true,
        message: 'A security verification code has been dispatched to your mobile number.',
      },
      200
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SEND-OTP-ERROR] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
