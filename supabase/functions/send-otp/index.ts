// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-expect-error: Deno global
    const atApiKey = Deno.env.get('AT_API_KEY')
    // @ts-expect-error: Deno global
    const atUsername = Deno.env.get('AT_USERNAME')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { phone, reg_no } = await req.json()
    if (!phone || !reg_no) {
      return new Response(
        JSON.stringify({ error: 'Phone and registration number are required.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const normalizedPhone = normalizePhoneNumber(phone)

    // 1. Verify user profile exists in database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('phone_number', normalizedPhone)
      .eq('registration_number', reg_no.trim())
      .maybeSingle()

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'No member profile found matching registration and phone number.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
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

    // 4. Send SMS via Africa's Talking API
    if (atApiKey && atUsername) {
      try {
        const smsRes = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            apiKey: atApiKey,
          },
          body: new URLSearchParams({
            username: atUsername,
            to: normalizedPhone,
            message: `Your The Base Movement verification OTP code is: ${otp}. Valid for 10 minutes.`,
            from: 'THEBASE',
          }),
        })
        if (!smsRes.ok) {
          const smsErrText = await smsRes.text()
          console.error(`[OTP-SMS] Africa's Talking returned error:`, smsErrText)
        }
      } catch (smsErr) {
        console.error(`[OTP-SMS] Network dispatch error:`, smsErr)
      }
    } else {
      console.warn(
        `[OTP-DEBUG] SMS provider credentials missing. Plaintext OTP for ${user.full_name} (${normalizedPhone}) is: ${otp}`
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'A security verification code has been dispatched to your mobile number.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SEND-OTP-ERROR] ${errorMessage}`)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
