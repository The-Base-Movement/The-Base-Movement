// @ts-ignore: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { hashOtp } from '../_shared/otp.ts'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'
import { checkPersistentRateLimit } from '../_shared/persistent-rate-limit.ts'
import { isGhanaRecoveryPhone, normalizeRecoveryPhone } from '../_shared/recovery-phone.ts'
import { isTwilioVerifyConfigured, startTwilioVerify } from '../_shared/twilio-verify.ts'
import { sendSms, sendInfobipSms } from '../_shared/sms.ts'
import { sendEmail } from '../_shared/email.ts'

const OTP_WINDOW_MS = 5 * 60 * 1000 // 5-minute window
const OTP_COOLDOWN_MS = 15 * 1000 // 15-second cooldown between resends
const OTP_MAX_PER_WINDOW = 10 // Max 10 OTP requests per 5 minutes

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
    const normalizedPhone = normalizeRecoveryPhone(rawPhone)
    const digitsOnly = rawPhone.replace(/\D/g, '')
    const ip = clientIp(req)

    // Rate limiting: 30 requests per 10 minutes per IP
    const rateCheck = await checkPersistentRateLimit(supabaseAdmin, `send-otp::${ip}`, 30, 600)
    if (!rateCheck.allowed) {
      return json(
        { error: `Too many reset requests. Please wait ${rateCheck.retry_after_sec} seconds.` },
        429
      )
    }

    // Flexible multi-format user lookup
    let user: { id: string; full_name: string; email?: string; phone_number?: string } | null = null

    // 1. Exact match on normalized phone (+32467814742 or +233541234567)
    const { data: exactMatch } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone_number')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    user = exactMatch ?? null

    // 2. Candidate match without '+' (e.g. 32467814742 or 233541234567)
    if (!user && digitsOnly) {
      const { data: noPlusMatch } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, phone_number')
        .eq('phone_number', digitsOnly)
        .maybeSingle()
      user = noPlusMatch ?? null
    }

    // 3. Suffix match on last 9 digits (handles 0541234567 vs +233541234567 or 0467814742 vs +32467814742)
    if (!user && digitsOnly.length >= 7) {
      const suffix = digitsOnly.slice(-9)
      const { data: suffixMatches } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, phone_number')
        .ilike('phone_number', `%${suffix}`)
        .limit(2)

      if (suffixMatches && suffixMatches.length === 1) {
        user = suffixMatches[0]
      }
    }

    if (!user) {
      return json(
        {
          error: `No registered member account was found with phone number ${normalizedPhone}. Please verify your registered number or use the Email recovery tab.`,
        },
        404
      )
    }

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
      return json(
        { error: 'Too many reset requests for this phone number. Please wait a few minutes.' },
        429
      )
    }

    // --- Smart Gateway Routing ---
    const isGhana = isGhanaRecoveryPhone(sendToPhone)
    const infobipApiKey = Deno.env.get('INFOBIP_API_KEY')?.trim()

    let dispatchSuccess = false
    let dispatchDetail = ''

    // Generate local 6-digit OTP code
    const buf = crypto.getRandomValues(new Uint32Array(1))
    const rawOtp = String((buf[0] % 900000) + 100000)
    const hashedOtp = await hashOtp(rawOtp, otpSecret)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const messageText = `Your The Base Movement verification code is: ${rawOtp}. Valid for 10 minutes.`

    // 1. Try Infobip for International numbers
    if (infobipApiKey && !isGhana) {
      const ibResult = await sendInfobipSms([sendToPhone], messageText)
      if (ibResult.ok) {
        await supabaseAdmin.from('password_reset_otps').insert({
          phone: sendToPhone,
          otp: hashedOtp,
          expires_at: expiresAt,
        })
        dispatchSuccess = true
        dispatchDetail = 'Dispatched via Infobip'
      } else {
        console.warn(
          '[SEND-OTP] Infobip dispatch failed, falling back to Twilio/mNotify:',
          ibResult.detail
        )
      }
    }

    // 2. Try mNotify for Ghana numbers
    if (!dispatchSuccess && isGhana) {
      const smsResult = await sendSms([sendToPhone], messageText, { mnotifyOnly: true })
      if (smsResult.ok) {
        await supabaseAdmin.from('password_reset_otps').insert({
          phone: sendToPhone,
          otp: hashedOtp,
          expires_at: expiresAt,
        })
        dispatchSuccess = true
        dispatchDetail = 'Dispatched via mNotify'
      } else {
        console.warn('[SEND-OTP] mNotify dispatch failed:', smsResult.detail)
        dispatchDetail = smsResult.detail
      }
    }

    // 3. Fallback Gateway: Twilio Verify
    if (!dispatchSuccess && !isGhana && isTwilioVerifyConfigured()) {
      try {
        await startTwilioVerify(sendToPhone)
        const hashedAuditToken = await hashOtp(crypto.randomUUID(), otpSecret)
        await supabaseAdmin.from('password_reset_otps').insert({
          phone: sendToPhone,
          otp: hashedAuditToken,
          expires_at: expiresAt,
        })
        dispatchSuccess = true
        dispatchDetail = 'Dispatched via Twilio Verify'
      } catch (tErr: unknown) {
        const msg = tErr instanceof Error ? tErr.message : String(tErr)
        console.warn(`[SEND-OTP] Twilio Verify failed: ${msg}`)
        dispatchDetail = msg
      }
    }

    // Dual-dispatch: If member also has an email on file, send a backup email copy
    if (user.email && user.email.trim()) {
      try {
        await sendEmail({
          to: user.email.trim(),
          subject: 'Your Security Verification Code - The Base Movement',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #004D25; margin-top: 0;">Password Reset Verification Code</h2>
              <p>Hello <strong>${user.full_name || 'Compatriot'}</strong>,</p>
              <p>You requested a security verification code for your account associated with <strong>${sendToPhone}</strong>.</p>
              <div style="background: #f4f6f8; text-align: center; padding: 15px; border-radius: 6px; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #004D25; margin: 20px 0;">
                ${rawOtp}
              </div>
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #999; text-align: center;">The Base Movement LBG — Official Member Platform</p>
            </div>
          `,
        })
      } catch (eErr) {
        console.warn('[SEND-OTP] Dual-dispatch email notification skipped:', eErr)
      }
    }

    if (!dispatchSuccess) {
      return json(
        {
          error: `SMS delivery failed (${dispatchDetail}). If you are overseas, please use the Email recovery tab or contact support.`,
        },
        400
      )
    }

    return json(
      {
        success: true,
        message: `A security verification code has been dispatched to ${sendToPhone}.`,
      },
      200
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SEND-OTP-ERROR] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
