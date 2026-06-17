// admin-reset-password
//
// Lets a privileged admin reset any member's login password from inside the app
// (no Supabase dashboard, no reliance on email delivery). Generates a temp
// password, sets it via the admin API, flags must_change_password, returns the
// temp password so the admin can read it on-screen, and emails it best-effort.
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
// Unambiguous character classes (no 0/O/1/l/I). Kept separate so we can
// guarantee one of each class — some Auth password policies require mixed
// classes and/or a symbol, and reject passwords that lack them with a 400.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghjkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%*?-_'
const ALL = UPPER + LOWER + DIGITS + SYMBOLS

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  })
}

function pick(charset: string): string {
  return charset[crypto.getRandomValues(new Uint8Array(1))[0] % charset.length]
}

// Returns a password that always contains at least one upper, lower, digit and
// symbol, so it satisfies any reasonable Supabase Auth strength requirement.
function generateTempPassword(length = 14): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)]
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => pick(ALL))
  const chars = [...required, ...rest]
  // Fisher–Yates shuffle so the required chars aren't always at the front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
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

    const tempPassword = generateTempPassword()
    const { error: updErr } = await admin.auth.admin.updateUserById(user_id, {
      password: tempPassword,
    })
    if (updErr) return json({ error: `Could not set password: ${updErr.message}` }, 400)

    await admin
      .from('users')
      .update({ must_change_password: true, temp_password_sent_at: new Date().toISOString() })
      .eq('id', user_id)

    // Best-effort email to a real address (placeholder phone emails are skipped).
    const email = target.user.email ?? ''
    let emailed = false
    const realEmail = email && !email.endsWith('@thebase.org') ? email : ''
    if (sgKey && realEmail) {
      try {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: realEmail }] }],
            from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
            subject: 'Your Base Movement password was reset',
            content: [
              {
                type: 'text/plain',
                value:
                  `An administrator reset your login password.\n\n` +
                  `Email: ${realEmail}\nTemporary password: ${tempPassword}\n\n` +
                  `Sign in at https://thebasemovement.creativeutil.com/login and change it immediately.`,
              },
            ],
          }),
        })
        emailed = res.ok
      } catch (e) {
        console.error('[admin-reset-password] email failed:', e)
      }
    }

    return json({ success: true, tempPassword, emailed, email: realEmail || null })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[admin-reset-password] ${msg}`)
    return json({ error: msg }, 500)
  }
})
