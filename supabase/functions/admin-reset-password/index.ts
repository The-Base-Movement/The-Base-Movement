// @ts-nocheck
// admin-reset-password
//
// Lets a privileged admin trigger a password reset for any member from inside
// the app. Resolves the member's auth account (by id, then by email/phone for
// imported members whose directory id != auth id, else provisions one), then:
//   1. Preferred: emails a Supabase recovery link so the member sets their own
//      password. This needs a usable email identity on the account.
//   2. Fallback: when no email link can be generated (phone-only accounts, or
//      accounts whose email has no auth identity), sets a temporary password
//      directly and returns it for the admin to share.
//
// Caller must be SUPER_ADMIN / FOUNDER / IT_MANAGER.
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

    const tempPassword = generateTempPassword()
    let authUserId: string | null = null
    let targetEmail = ''
    let targetName = 'Compatriot'
    let isProvisionedNow = false

    // 1. Resolve the member's auth account.
    const { data: targetAuth } = await admin.auth.admin.getUserById(user_id)
    if (targetAuth?.user) {
      authUserId = targetAuth.user.id
      targetEmail = targetAuth.user.email ?? ''
      targetName = targetAuth.user.user_metadata?.name || 'Compatriot'
    } else {
      // Not found by id — common for imported members whose directory id differs
      // from their auth id. Look up the directory row, then resolve/provision.
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

      // Does an auth account already exist under a different id (email/phone match)?
      const { data: existingRows } = await admin.rpc('admin_lookup_auth_user', {
        p_email: profile.email ?? '',
        p_phone: normalizedPhone ?? '',
      })
      const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows
      if (existing?.id) {
        authUserId = existing.id
        targetEmail = existing.email ?? profile.email ?? ''
      } else {
        // No account anywhere — provision one and link the directory row to it.
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
        isProvisionedNow = true
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

    // 2. Preferred: email a recovery link so the member sets their own password.
    //    Only works when the account has a usable email identity.
    if (targetEmail) {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: targetEmail,
        options: { redirectTo: `${siteUrl}/reset-password` },
      })
      if (!linkErr && linkData?.properties?.action_link) {
        const properties = linkData.properties as Record<string, unknown>
        const emailOtp = properties.email_otp as string
        const customLink = `${siteUrl}/reset-password?email=${encodeURIComponent(targetEmail)}&token=${emailOtp}`
        let emailed = false
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
              `Open this link to choose a new password (valid for 24 hours):\n${customLink}\n\n` +
              `If you did not request this password reset, please ignore this email safely. Your account remains secure.`,
          })
          emailed = r.ok
        } catch (e) {
          console.error('[admin-reset-password] email failed:', e)
        }
        return json({
          success: true,
          emailed,
          email: targetEmail,
          actionLink: customLink,
          tempPassword: isProvisionedNow ? tempPassword : undefined,
        })
      }
      console.error(
        '[admin-reset-password] recovery link unavailable, using temp password:',
        linkErr?.message
      )
    }

    // 3. Fallback: set a temporary password directly. Works for phone-only
    //    accounts and accounts whose email has no auth identity (recovery links
    //    can't be generated for those). The admin shares it with the member.
    const { error: updateErr } = await admin.auth.admin.updateUserById(authUserId, {
      password: tempPassword,
    })
    if (updateErr) return json({ error: `Failed to reset password: ${updateErr.message}` }, 400)
    await admin
      .from('users')
      .update({ must_change_password: true, temp_password_sent_at: new Date().toISOString() })
      .eq('id', authUserId)
    return json({
      success: true,
      emailed: false,
      email: targetEmail || null,
      tempPassword,
      message:
        'Password reset. Share this temporary password with the member; they will be asked to change it on first login.',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[admin-reset-password] ${msg}`)
    return json({ error: msg }, 500)
  }
})
