// assign-admin-email
//
// Phone-registered members carry a placeholder auth email (<phone>@thebase.org)
// because Supabase auth requires one. Admins must sign in to the admin panel
// with a real email, so when such a member is appointed to an admin role this
// function switches their auth login email to a real address (and mirrors it
// to public.users.email). Their password is unchanged.
//
// Caller must be a privileged admin (SUPER_ADMIN / FOUNDER / EXECUTIVE).
//
// Body:
//   { user_id: string, check_only: true }            → { needsEmail, currentEmail }
//   { user_id: string, email: string }               → performs the switch
//
// Optional secret: SENDGRID_API_KEY (notifies the appointee of their login email)

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE']
const PLACEHOLDER_DOMAIN = '@thebase.org'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    const admin = createClient(supabaseUrl, serviceKey)

    // ── Authenticate + authorize the caller ──
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    if (!jwt) return json({ error: 'Not authenticated.' }, 401)

    const {
      data: { user: caller },
      error: callerError,
    } = await admin.auth.getUser(jwt)
    if (callerError || !caller) return json({ error: 'Not authenticated.' }, 401)

    // Role source of truth is the admins table (public.users has no role column).
    const { data: callerProfile } = await admin
      .from('admins')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()

    if (!callerProfile?.role || !PRIVILEGED_ROLES.includes(callerProfile.role)) {
      return json({ error: 'Not authorized to manage admin credentials.' }, 403)
    }

    // ── Load the target user ──
    const { user_id, email, check_only } = await req.json()
    if (!user_id) return json({ error: 'user_id is required.' }, 400)

    const { data: targetAuth, error: targetError } = await admin.auth.admin.getUserById(user_id)
    if (targetError || !targetAuth?.user) {
      return json({ error: 'Target user not found.' }, 404)
    }

    const currentAuthEmail = targetAuth.user.email ?? ''
    const needsEmail = currentAuthEmail.endsWith(PLACEHOLDER_DOMAIN)

    if (check_only) {
      const { data: profile } = await admin
        .from('users')
        .select('email')
        .eq('id', user_id)
        .maybeSingle()
      return json({
        needsEmail,
        currentEmail: needsEmail ? (profile?.email ?? null) : currentAuthEmail,
      })
    }

    // ── Perform the switch ──
    const newEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return json({ error: 'A valid email address is required.' }, 400)
    }
    if (newEmail.endsWith(PLACEHOLDER_DOMAIN)) {
      return json({ error: 'That domain is reserved for system accounts.' }, 400)
    }
    if (newEmail === currentAuthEmail.toLowerCase()) {
      return json({ success: true, message: 'Email already set.' })
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
      email: newEmail,
      email_confirm: true,
    })
    if (updateError) {
      const msg = updateError.message?.toLowerCase().includes('already')
        ? 'That email is already in use by another account.'
        : `Could not update login email: ${updateError.message}`
      return json({ error: msg }, 400)
    }

    await admin.from('users').update({ email: newEmail }).eq('id', user_id)

    // ── Notify the appointee (best-effort) ──
    if (sgKey) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: newEmail }] }],
            from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
            subject: 'Admin access granted — The Base Movement',
            content: [
              {
                type: 'text/plain',
                value:
                  `You have been granted administrative access to The Base Movement.\n\n` +
                  `Sign in to the admin panel with this email address (${newEmail}) and your existing password.\n\n` +
                  `For security, please set up two-factor authentication in Settings → Security after your first login.`,
              },
            ],
          }),
        })
      } catch (mailErr) {
        console.warn('[ASSIGN-ADMIN-EMAIL] Notification email failed:', mailErr)
      }
    }

    return json({ success: true, message: 'Admin login email assigned.' })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[ASSIGN-ADMIN-EMAIL] ${errorMessage}`)
    return json({ error: errorMessage }, 500)
  }
})
