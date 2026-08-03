// @ts-nocheck
// admin-reset-password
//
// Lets a privileged admin trigger a password reset for any member from inside
// the app. Resolves the member's auth account (by id, then by email/phone for
// imported members whose directory id != auth id, else provisions one), then
// sends the member an email recovery link so they control the new password.
//
// Caller must be SUPER_ADMIN / FOUNDER.
// Body: { user_id: string }

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getSenderEmail } from '../_shared/admin-auth.ts'
import { passwordResetEmail } from '../_shared/email-templates.ts'
// @ts-expect-error: Deno supports URL imports
import { sendEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_ROLES = ['SUPER_ADMIN', 'FOUNDER']

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
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://www.thebasemovement.org.gh'
    const admin = createClient(supabaseUrl, serviceKey)

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

    const tempPassword = generateTempPassword()
    let authUserId: string | null = null
    let targetEmail = ''
    let targetName = 'Compatriot'

    const { data: targetAuth } = await admin.auth.admin.getUserById(user_id)
    if (targetAuth?.user) {
      authUserId = targetAuth.user.id
      targetEmail = targetAuth.user.email ?? ''
      targetName = targetAuth.user.user_metadata?.name || 'Compatriot'
    } else {
      const { data: profile } = await admin
        .from('users')
        .select('registration_number, full_name, email, phone_number')
        .eq('id', user_id)
        .maybeSingle()
      if (!profile) {
        return json({ error: 'Target user not found in directory or auth systems.' }, 404)
      }

      const normalizedPhone = normalizePhoneNumber(profile.phone_number)
      if (!profile.email && !normalizedPhone) {
        return json(
          {
            error:
              'This member has no email address or phone number on file, so a login cannot be created.',
          },
          400
        )
      }
      targetName = profile.full_name || 'Compatriot'

      const { data: existingRows } = await admin.rpc('admin_lookup_auth_user', {
        p_email: profile.email ?? '',
        p_phone: normalizedPhone ?? '',
      })
      const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows
      if (existing?.id) {
        authUserId = existing.id
        targetEmail = existing.email ?? profile.email ?? ''
      } else {
        const createParams: Record<string, unknown> = {
          password: tempPassword,
          user_metadata: {
            reg_no: profile.registration_number,
            name: profile.full_name,
            must_change_password: true,
          },
        }
        if (profile.email) {
          createParams.email = profile.email
          createParams.email_confirm = true
        }
        if (normalizedPhone) {
          createParams.phone = normalizedPhone
          createParams.phone_confirm = true
        }
        const { data: newAuth, error: createError } =
          await admin.auth.admin.createUser(createParams)
        if (createError || !newAuth?.user) {
          console.error('[admin-reset-password] provision failed:', createError?.message)
          return json(
            { error: `Could not provision auth login: ${createError?.message ?? 'Unknown'}` },
            400
          )
        }
        authUserId = newAuth.user.id
        targetEmail = profile.email || ''
        const { error: linkErr } = await admin
          .from('users')
          .update({
            id: newAuth.user.id,
            must_change_password: true,
            temp_password_sent_at: new Date().toISOString(),
          })
          .eq('registration_number', profile.registration_number)
        if (linkErr) {
          await admin.auth.admin.deleteUser(newAuth.user.id)
          return json({ error: `Failed to link member directory profile: ${linkErr.message}` }, 400)
        }
      }
    }

    if (!authUserId) return json({ error: 'Could not resolve the member account.' }, 400)
    if (!targetEmail) {
      return json(
        {
          error:
            'A verified email address is required for administrator-initiated password resets.',
        },
        400
      )
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: targetEmail,
      options: { redirectTo: `${siteUrl}/reset-password` },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[admin-reset-password] recovery link unavailable:', linkErr?.message)
      return json({ error: 'Failed to start email password recovery for this member.' }, 503)
    }

    const properties = linkData.properties as Record<string, unknown>
    const emailOtp = properties.email_otp as string
    const customLink = `${siteUrl}/reset-password?email=${encodeURIComponent(targetEmail)}&token=${emailOtp}`

    try {
      const senderEmail = await getSenderEmail(admin)
      const html = passwordResetEmail({
        name: targetName,
        resetLink: customLink,
        expiryHours: 24,
      })
      const r = await sendEmail({
        to: targetEmail,
        from: `The Base Movement <${senderEmail}>`,
        subject: 'Reset your Base Movement password',
        html,
        text:
          `An administrator started a password reset for your account.\n\n` +
          `Open the reset link we sent you to choose a new password. The link is valid for 24 hours.\n\n` +
          `If you did not request this password reset, please ignore this email safely. Your account remains secure.`,
      })
      if (!r.ok) {
        console.error('[admin-reset-password] email delivery failed:', r.detail)
        return json({ error: 'Failed to deliver password reset email.' }, 502)
      }
    } catch (e) {
      console.error('[admin-reset-password] email failed:', e)
      return json({ error: 'Failed to deliver password reset email.' }, 502)
    }

    // Trigger instant password reset webhook alert (non-fatal)
    try {
      await fetch(`${supabaseUrl}/functions/v1/password-reset-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: 'instant_alert',
          event_type: 'admin_reset_triggered',
          user_id: authUserId,
          full_name: targetName,
          email: targetEmail,
          triggered_by: `admin:${caller.id}`,
        }),
      })
    } catch (whErr) {
      console.warn('[admin-reset-password] Webhook dispatch warning:', whErr)
    }

    return json({
      success: true,
      emailed: true,
      email: targetEmail,
      message: 'Password reset email sent to the member.',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[admin-reset-password] ${msg}`)
    return json({ error: msg }, 500)
  }
})
