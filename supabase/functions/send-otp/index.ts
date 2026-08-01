// @ts-ignore: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { hashOtp } from '../_shared/otp.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'
import { normalizeRecoveryPhone } from '../_shared/recovery-phone.ts'
import { isTwilioVerifyConfigured, startTwilioVerify } from '../_shared/twilio-verify.ts'
import { sendSms } from '../_shared/sms.ts'

const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_COOLDOWN_MS = 60 * 1000
const OTP_MAX_PER_WINDOW = 3

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

  function json(body: unknown, status: number) {
    return new Response(JSON.stringify(body), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status,
    })
  }

  if (req.method === 'OPTIONS') return handleCorsPreflight(req)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const otpSecret = Deno.env.get('OTP_HMAC_SECRET') || 'thebase-otp-secret-key-2026'

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { phone } = await req.json()
    if (!phone) return json({ error: 'Phone number is required.' }, 400)

    const rawPhone = String(phone).trim()

    // Enforce international format — must start with '+'
    if (!rawPhone.startsWith('+')) {
      return json(
        {
          error:
            'Please enter your phone number in international format, e.g. +32467814742 or +233541234567.',
        },
        400
      )
    }

    const normalizedPhone = normalizeRecoveryPhone(rawPhone)
    const digitsOnly = rawPhone.replace(/\D/g, '')
    const ip = clientIp(req)

    const rateCheck = await checkPersistentRateLimit(supabaseAdmin, `send-otp::${ip}`, 5, 600)
    if (!rateCheck.allowed) {
      return json(
        { error: `Too many reset requests. Please wait ${rateCheck.retry_after_sec} seconds.` },
        429
      )
    }

    // Flexible multi-format user lookup to catch numbers stored with +, without +, or with leading 0 during registration
    let user: { id: string; full_name: string; phone_number?: string } | null = null

    // 1. Exact match on normalized phone (+32467814742)
    const { data: exactMatch } = await supabaseAdmin
      .from('users')
      .select('id, full_name, phone_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    user = exactMatch ?? null

    // 2. Candidate match without '+' (e.g. 32467814742)
    if (!user && digitsOnly) {
      const { data: noPlusMatch } = await supabaseAdmin
        .from('users')
        .select('id, full_name, phone_number')
        .eq('phone_number', digitsOnly)
        .maybeSingle()
      user = noPlusMatch ?? null
    }

    // 3. Suffix match on last 9 digits (handles 0467814742 vs +32467814742)
    if (!user && digitsOnly.length >= 7) {
      const suffix = digitsOnly.slice(-9)
      const { data: suffixMatches } = await supabaseAdmin
        .from('users')
        .select('id, full_name, phone_number')
        .ilike('phone_number', `%${suffix}`)
        .limit(2)

      if (suffixMatches && suffixMatches.length === 1) {
        user = suffixMatches[0]
      }
    }

    // Use normalized +E.164 for SMS dispatch
    const sendToPhone = normalizedPhone

    // OTP window / cooldown check
    const recentCutoff = new Date(Date.now() - OTP_WINDOW_MS).toISOString()
    const {
      data: recentOtps,
      error: recentOtpError,
      count: recentOtpCount,
    } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id, created_at', { count: 'exact' })
      .eq('phone', sendToPhone)
      .gte('created_at', recentCutoff)
      .order('created_at', { ascending: false })

    if (recentOtpError) {
      console.error(`[SEND-OTP] Failed to check recent OTP requests: ${recentOtpError.message}`)
    }

    const latestCreatedAt = recentOtps?.[0]?.created_at
    if (latestCreatedAt) {
      const retryAfterMs = OTP_COOLDOWN_MS - (Date.now() - new Date(latestCreatedAt).getTime())
      if (retryAfterMs > 0) {
        return json(
          {
            error: `Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before requesting another code.`,
          },
          429
        )
      }
    }

    if ((recentOtpCount ?? 0) >= OTP_MAX_PER_WINDOW) {
      return json({ error: 'Too many reset requests. Please try again later.' }, 429)
    }

    if (!user) {
      // Ghost success — don't reveal whether the number exists
      return json(
        {
          success: true,
          message:
            'If the details match a member record, a security verification code will be sent shortly.',
        },
        200
      )
    }

    // --- Dispatch OTP ---
    let twilioSuccess = false

    if (isTwilioVerifyConfigured()) {
      try {
        await startTwilioVerify(sendToPhone)
        const hashedAuditToken = await hashOtp(crypto.randomUUID(), otpSecret)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
        await supabaseAdmin.from('password_reset_otps').insert({
          phone: sendToPhone,
          otp: hashedAuditToken,
          expires_at: expiresAt,
        })
        twilioSuccess = true
      } catch (tErr: unknown) {
        const msg = tErr instanceof Error ? tErr.message : String(tErr)
        console.warn(`[SEND-OTP] Twilio Verify failed: ${msg}`)

        // If Twilio failed due to Trial restrictions or Geo-Permissions, fail fast with explicit message
        if (msg.includes('Twilio Trial Account Restriction') || msg.includes('Twilio Geo-Permission')) {
          return json({ error: msg }, 400)
        }
      }
    }

    if (!twilioSuccess) {
      // Fallback: generate a local 6-digit OTP and send via SMS
      const buf = crypto.getRandomValues(new Uint32Array(1))
      const rawOtp = String((buf[0] % 900000) + 100000)
      const hashedOtp = await hashOtp(rawOtp, otpSecret)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      const { error: otpWriteErr } = await supabaseAdmin.from('password_reset_otps').insert({
        phone: sendToPhone,
        otp: hashedOtp,
        expires_at: expiresAt,
      })
      if (otpWriteErr) {
        console.error(`[SEND-OTP] Failed to write OTP row: ${otpWriteErr.message}`)
      }

      const smsResult = await sendSms(
        [sendToPhone],
        `Your The Base Movement verification code is: ${rawOtp}. Valid for 10 minutes.`
      )
      if (!smsResult.ok) {
        console.error(`[SEND-OTP] SMS dispatch failed: ${smsResult.detail}`)
        return json(
          {
            error:
              `SMS delivery failed (${smsResult.detail}). If you are overseas, please use the Email recovery tab or contact support.`,
          },
          400
        )
      }
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
