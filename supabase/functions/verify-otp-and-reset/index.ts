// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FAILURE_DELAY_MS = 800

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
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    // 2. Check if code has expired
    const isExpired = new Date(otpRecord.expires_at) < new Date()
    if (isExpired) {
      return delayedJson({ error: 'Invalid or expired verification code.' }, 400)
    }

    // 3. Mark the OTP as used to prevent replay attacks
    const { error: updateOtpError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpRecord.id)

    if (updateOtpError) {
      throw new Error(`Failed to invalidate verification code: ${updateOtpError.message}`)
    }

    // 4. Resolve the auth user ID from public users table mapped by phone number
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No associated member profile found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // 5. Update user's password in auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: { must_change_password: false },
    })

    if (authError) {
      throw new Error(`Auth layer reset failed: ${authError.message}`)
    }

    // 6. Update database profiles setting must_change_password to false
    await supabaseAdmin.from('users').update({ must_change_password: false }).eq('id', user.id)
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('phone', normalizedPhone)

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
