// @ts-nocheck
// admin-reset-password
//
// Lets a privileged admin trigger a password reset for any member from inside
// the app. Generates a Supabase recovery link (server-side, no reliance on
// Supabase Auth's own email delivery) and emails it to the member via SendGrid.
// The member clicks the link and lands on /reset-password to choose a new
// password themselves. The action link is also returned so the admin can copy
// and share it if email delivery fails (e.g. spam, phone-only members).
//
// Caller must be SUPER_ADMIN / FOUNDER / IT_MANAGER.
// Body: { user_id: string }

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getSenderEmail } from '../_shared/admin-auth.ts'
import { passwordResetEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']

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
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    // @ts-expect-error: Deno global
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.thebasemovement.org.gh'
    const admin = createClient(supabaseUrl, serviceKey)

    // Authn + authz the caller.
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    const {
      data: { user: caller },
    } = await admin.auth.getUser(jwt)
    if (!caller) return json({ error: 'Not authenticated.' }, 401)
    const { data: callerAdmin } = await admin
      .from('admins')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()
    if (!callerAdmin || !ALLOWED_ROLES.includes(callerAdmin.role)) {
      return json({ error: 'Not authorized to reset passwords.' }, 403)
    }

    const { user_id } = await req.json()
    if (!user_id) return json({ error: 'user_id is required.' }, 400)

    const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'
    function generateTempPassword(length = 10): string {
      const bytes = crypto.getRandomValues(new Uint8Array(length))
      return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('')
    }
    function normalizePhoneNumber(raw: string): string {
      const cleaned = (raw ?? '').trim()
      if (!cleaned) return ''
      if (cleaned.startsWith('+')) return cleaned
      const digits = cleaned.replace(/\D/g, '')
      if (!digits) return ''
      if (digits.startsWith('233')) return `+${digits}`
      if (digits.startsWith('0')) return `+233${digits.slice(1)}`
      return `+233${digits}`
    }
    async function getDummyEmail(phone: string): Promise<string> {
      const clean = phone.replace('+', '').trim()
      const msgBuffer = new TextEncoder().encode(clean)
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      return `${hashHex.slice(0, 16)}@thebase.org`
    }

    let targetEmail = ''
    let targetName = 'Patriot'
    let isProvisionedNow = false

    const { data: targetAuth, error: targetError } = await admin.auth.admin.getUserById(user_id)

    if (targetError || !targetAuth?.user) {
      // User not found in auth.users — check if they exist in public.users (imported member)
      const { data: profile, error: profileErr } = await admin
        .from('users')
        .select('registration_number, full_name, email, phone_number')
        .eq('id', user_id)
        .maybeSingle()

      if (profileErr || !profile) {
        return json({ error: 'Target user not found in directory or auth systems.' }, 404)
      }

      // Provision auth credentials on the fly
      const normalizedPhone = normalizePhoneNumber(profile.phone_number)
      const finalEmail =
        profile.email || (normalizedPhone ? await getDummyEmail(normalizedPhone) : '')
      if (!finalEmail) {
        return json(
          {
            error:
              'This member has no email address or phone number on file, so a login cannot be created.',
          },
          400
        )
      }

      const tempPassword = generateTempPassword()
      const createParams: Record<string, unknown> = {
        email: finalEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          reg_no: profile.registration_number,
          name: profile.full_name,
          must_change_password: true,
        },
      }
      if (normalizedPhone) {
        createParams.phone = normalizedPhone
        createParams.phone_confirm = true
      }

      const { data: newAuth, error: createError } = await admin.auth.admin.createUser(createParams)
      if (createError || !newAuth?.user) {
        return json(
          { error: `Could not provision auth login: ${createError?.message ?? 'Unknown'}` },
          400
        )
      }

      // Link public.users record to new auth user ID
      const { error: updateProfileErr } = await admin
        .from('users')
        .update({
          id: newAuth.user.id,
          must_change_password: true,
          temp_password_sent_at: new Date().toISOString(),
        })
        .eq('registration_number', profile.registration_number)

      if (updateProfileErr) {
        // Clean up created auth user to avoid orphan auths
        await admin.auth.admin.deleteUser(newAuth.user.id)
        return json(
          { error: `Failed to link member directory profile: ${updateProfileErr.message}` },
          400
        )
      }

      targetEmail = finalEmail
      targetName = profile.full_name
      isProvisionedNow = true
    } else {
      targetEmail = targetAuth.user.email ?? ''
      targetName = targetAuth.user.user_metadata?.name || 'Patriot'
    }

    if (!targetEmail) {
      return json(
        { error: 'This member has no email address on file, so a reset link cannot be sent.' },
        400
      )
    }

    // Generate the recovery link server-side. redirectTo must be in the project's
    // allowed redirect URLs (Auth → URL Configuration). The member lands on
    // /reset-password, which handles the PASSWORD_RECOVERY event.
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      return json({ error: `Could not generate reset link: ${linkErr?.message ?? 'unknown'}` }, 400)
    }
    const properties = linkData.properties as Record<string, unknown>
    const emailOtp = properties.email_otp as string
    const customLink = `${siteUrl}/reset-password?email=${encodeURIComponent(targetEmail)}&token=${emailOtp}`

    // Email the link via SendGrid (best-effort — only for real non-placeholder emails).
    let emailed = false
    const realEmail = targetEmail && !targetEmail.endsWith('@thebase.org') ? targetEmail : ''
    if (sgKey && realEmail) {
      try {
        const senderEmail = await getSenderEmail(admin)
        const html = passwordResetEmail({
          name: targetName,
          resetLink: customLink,
          expiryHours: 24,
        })
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: realEmail }] }],
            from: { email: senderEmail, name: 'The Base Movement' },
            subject: 'Reset your Base Movement password',
            content: [
              {
                type: 'text/plain',
                value:
                  `An administrator started a password reset for your account.\n\n` +
                  `Open this link to choose a new password (valid for 24 hours):\n${customLink}\n\n` +
                  `If you did not request this password reset, please ignore this email safely. Your account remains secure.`,
              },
              {
                type: 'text/html',
                value: html,
              },
            ],
          }),
        })
        emailed = res.ok
      } catch (e) {
        console.error('[admin-reset-password] email failed:', e)
      }
    }

    return json({ success: true, emailed, email: realEmail || targetEmail, actionLink: customLink })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[admin-reset-password] ${msg}`)
    return json({ error: msg }, 500)
  }
})
