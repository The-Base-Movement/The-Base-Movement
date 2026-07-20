// Supabase "Send SMS" auth hook — routes Supabase phone-auth SMS through mNotify.
//
// Why: Supabase won't let you enable the Phone provider without an SMS provider,
// and mNotify isn't a native option. This hook satisfies that requirement using
// the existing mNotify integration, so the Phone provider can be turned on and
// phone+password login works again. (On a password login no SMS is sent, so this
// hook is only invoked for genuine OTP/verification sends.)
//
// Wire-up: Dashboard → Authentication → Hooks → Send SMS → HTTPS →
//   https://<project-ref>.supabase.co/functions/v1/send-sms-hook
// Supabase generates SEND_SMS_HOOK_SECRET (format "v1,whsec_<base64>") — set it as
// a function secret. Reuses MNOTIFY_API_KEY / MNOTIFY_SENDER_ID.
// Deploy with: supabase functions deploy send-sms-hook --no-verify-jwt
// (Supabase Auth calls this server-side with a Standard Webhooks signature, not a user JWT.)

// @ts-expect-error: Deno supports URL imports
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { sendSms } from '../_shared/sms.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // @ts-expect-error: Deno global
    const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET')
    if (!hookSecret) throw new Error('SEND_SMS_HOOK_SECRET is not configured')

    // Verify the Standard Webhooks signature and parse the payload atomically.
    const body = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(hookSecret.replace('v1,whsec_', ''))
    const { user, sms } = wh.verify(body, headers) as {
      user: { phone?: string | null }
      sms: { otp?: string }
    }

    const phone = user?.phone?.trim()
    const otp = sms?.otp?.trim()
    if (!phone || !otp) throw new Error('Hook payload missing user.phone or sms.otp')

    const result = await sendSms(
      [phone],
      `Your The Base Movement verification code is: ${otp}. Valid for 10 minutes.`
    )
    if (!result.ok) throw new Error(result.detail || 'mNotify send failed')

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[SEND-SMS-HOOK]', message)
    return new Response(JSON.stringify({ error: { message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
