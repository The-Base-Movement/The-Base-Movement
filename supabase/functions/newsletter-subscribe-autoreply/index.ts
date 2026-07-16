// @ts-nocheck
// NEWSLETTER SUBSCRIPTION AUTO-REPLY
// Sends a one-off acknowledgement email after a public newsletter signup.
// Called fire-and-forget from adminService.subscribeToNewsletter().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getSenderEmail } from '../_shared/admin-auth.ts'
import { newsletterSubscriberWelcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import { sendEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RECENT_SUBSCRIPTION_WINDOW_MS = 10 * 60 * 1000

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const { email, phone, subscriberId } = await req.json()
    if (!email || typeof email !== 'string') throw new Error('email is required')
    if (!subscriberId || typeof subscriberId !== 'string') {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscriber id required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = normalizePhone(phone)
    const { data: subscriber, error: subscriberErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, phone_number, status, created_at')
      .eq('id', subscriberId)
      .maybeSingle()

    if (subscriberErr) throw new Error(`Subscriber lookup failed: ${subscriberErr.message}`)
    if (!subscriber || subscriber.status !== 'Active') {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscriber not active' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    if (normalizeEmail(subscriber.email ?? '') !== normalizedEmail) {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscriber mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    if (normalizedPhone && normalizePhone(subscriber.phone_number) !== normalizedPhone) {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscriber mismatch' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    const createdAt =
      typeof subscriber.created_at === 'string' ? Date.parse(subscriber.created_at) : NaN
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > RECENT_SUBSCRIPTION_WINDOW_MS) {
      return new Response(JSON.stringify({ skipped: true, reason: 'subscription not recent' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Capture the subscriber into Resend marketing contacts (fire-and-forget),
    // tagged source=newsletter so they're distinguishable from members.
    fetch(`${supabaseUrl}/functions/v1/sync-sendgrid-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ email: normalizedEmail, source: 'newsletter', status: 'Subscriber' }),
    }).catch((e) => console.warn('[newsletter-autoreply] Resend contact sync dispatch failed:', e))

    let emailSent = false
    let smsSent = false

    {
      const html = newsletterSubscriberWelcomeEmail({
        updatesUrl: 'https://www.thebasemovement.org.gh/blog',
      })
      const senderEmail = await getSenderEmail(supabase)

      const r = await sendEmail({
        to: normalizedEmail,
        from: `The Base Movement <${senderEmail}>`,
        subject: 'Welcome to The Base newsletter',
        html,
      })

      if (!r.ok) {
        throw new Error(`Resend send failed: ${r.detail}`)
      }
      emailSent = true
    }

    if (subscriber.phone_number) {
      const sms = await sendSms(
        [subscriber.phone_number],
        'Welcome to The Base newsletter. You will receive movement updates by SMS when relevant. Visit www.thebasemovement.org.gh/blog for the latest news.'
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
