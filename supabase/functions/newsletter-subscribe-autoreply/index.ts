// @ts-nocheck
// NEWSLETTER SUBSCRIPTION AUTO-REPLY
// Sends a one-off acknowledgement email after a public newsletter signup.
// Called fire-and-forget from adminService.subscribeToNewsletter().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getSenderEmail } from '../_shared/admin-auth.ts'
import { newsletterSubscriberWelcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const sgKey = Deno.env.get('SENDGRID_API_KEY')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email } = await req.json()
    if (!email || typeof email !== 'string') throw new Error('email is required')

    const normalizedEmail = email.trim().toLowerCase()
    const { data: subscriber, error: subscriberErr } = await supabase
      .from('newsletter_subscribers')
      .select('email, phone_number, status')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (subscriberErr) throw new Error(`Subscriber lookup failed: ${subscriberErr.message}`)
    if (!subscriber || subscriber.status !== 'Active') {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscriber not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    let emailSent = false
    let smsSent = false

    if (sgKey) {
      const html = newsletterSubscriberWelcomeEmail({
        updatesUrl: 'https://thebasemovement.info/blog',
      })
      const senderEmail = await getSenderEmail(supabase)

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sgKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: normalizedEmail }] }],
          from: { email: senderEmail, name: 'The Base Movement' },
          subject: 'Welcome to The Base newsletter',
          content: [{ type: 'text/html', value: html }],
        }),
      })

      if (res.status !== 202) {
        const errText = await res.text()
        throw new Error(`SendGrid error ${res.status}: ${errText}`)
      }
      emailSent = true
    }

    if (subscriber.phone_number) {
      const sms = await sendSms(
        [subscriber.phone_number],
        'Welcome to The Base newsletter. You will receive movement updates by SMS when relevant. Visit thebasemovement.info/blog for the latest news.'
      )
      smsSent = sms.ok
    }

    return new Response(JSON.stringify({ sent: emailSent || smsSent, emailSent, smsSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[NEWSLETTER SUBSCRIBE AUTOREPLY]', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
