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
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

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

serve(async (req: Request) => {
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
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://thebasemovement.info'
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

    const { data: target, error: targetErr } = await admin.auth.admin.getUserById(user_id)
    if (targetErr || !target?.user) return json({ error: 'Target user not found.' }, 404)

    // A real (non-placeholder) email is required to receive the reset link.
    const email = target.user.email ?? ''
    const realEmail = email && !email.endsWith('@thebase.org') ? email : ''
    if (!realEmail) {
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
      email: realEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      return json({ error: `Could not generate reset link: ${linkErr?.message ?? 'unknown'}` }, 400)
    }
    const properties = linkData.properties as Record<string, unknown>
    const emailOtp = properties.email_otp as string
    const customLink = `${siteUrl}/reset-password?email=${encodeURIComponent(realEmail)}&token=${emailOtp}`

    // Email the link via SendGrid (best-effort — the link is also returned).
    let emailed = false
    if (sgKey) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: realEmail }] }],
            from: { email: 'noreply@thebasemovement.info', name: 'The Base Movement' },
            subject: 'Reset your Base Movement password',
            content: [
              {
                type: 'text/plain',
                value:
                  `An administrator started a password reset for your account.\n\n` +
                  `Open this link to choose a new password (valid for 1 hour):\n${customLink}\n\n` +
                  `If you didn't expect this, you can ignore this email.`,
              },
              {
                type: 'text/html',
                value:
                  `<p>An administrator started a password reset for your account.</p>` +
                  `<p><a href="${customLink}" style="display:inline-block;padding:12px 20px;` +
                  `background:#006B3F;color:#fff;border-radius:8px;text-decoration:none;` +
                  `font-family:sans-serif">Choose a new password</a></p>` +
                  `<p style="font-family:sans-serif;font-size:13px;color:#555">` +
                  `This link is valid for 1 hour. If you didn't expect this, ignore this email.</p>`,
              },
            ],
          }),
        })
        emailed = res.ok
      } catch (e) {
        console.error('[admin-reset-password] email failed:', e)
      }
    }

    return json({ success: true, emailed, email: realEmail, actionLink: customLink })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[admin-reset-password] ${msg}`)
    return json({ error: msg }, 500)
  }
})
