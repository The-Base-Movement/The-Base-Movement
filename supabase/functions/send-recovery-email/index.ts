// @ts-nocheck
// send-recovery-email
//
// Generates a recovery link using the Supabase Auth Admin API and sends it
// via Resend using the user-provided API key.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { passwordResetEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.thebasemovement.org.gh'

    const { email } = await req.json()
    if (!email || !String(email).trim()) {
      return json({ error: 'Email address is required.' }, 400)
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const cleanEmail = String(email).trim()

    // Lookup user in public.users to get their name
    const { data: profile } = await admin
      .from('users')
      .select('full_name')
      .ilike('email', cleanEmail)
      .maybeSingle()

    const targetName = profile?.full_name || 'Compatriot'

    // Generate the recovery link server-side.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    })

    if (linkErr) {
      console.warn('[send-recovery-email] generateLink error:', linkErr.message)
      // Return success to prevent email enumeration
      return json({ success: true, message: 'If the details match a member record, a password reset link has been dispatched.' })
    }

    if (!linkData?.properties) {
      return json({ success: true, message: 'If the details match a member record, a password reset link has been dispatched.' })
    }

    const properties = linkData.properties as Record<string, unknown>
    const emailOtp = properties.email_otp as string
    const customLink = `${siteUrl}/reset-password?email=${encodeURIComponent(cleanEmail)}&token=${emailOtp}`

    if (!resendApiKey) {
      console.warn('[send-recovery-email] RESEND_API_KEY secret is not set in Supabase.')
      return json({ success: true, message: 'If the details match a member record, a password reset link has been dispatched.' })
    }

    const html = passwordResetEmail({
      name: targetName,
      resetLink: customLink,
      expiryHours: 1,
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'The Base Movement <noreply@thebasemovement.org.gh>',
        to: [cleanEmail],
        subject: 'Reset your Base Movement password',
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[send-recovery-email] Resend error:', res.status, errText)
    }

    return json({ success: true, message: 'If the details match a member record, a password reset link has been dispatched.' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[send-recovery-email] ${msg}`)
    return json({ error: msg }, 400)
  }
})
