// @ts-nocheck
// THE BASE: NEWSLETTER SEND
// Fetches emails matching the audience filter, wraps body in broadcastEmail
// template, sends via SendGrid /v3/mail/send in batches of 1,000, and updates
// the newsletters row.
//
// Required secret: SENDGRID_API_KEY
// Auto-injected:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { broadcastEmail } from '../_shared/email-templates.ts'

const BATCH_SIZE = 1000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { newsletter_id, subject, body_html, audience_type, audience_value } = await req.json()

    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    if (!sgKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recipient emails based on audience
    let emails: string[] = []

    if (audience_type === 'role') {
      const { data, error } = await supabase
        .from('admins')
        .select('id')
        .eq('role', audience_value ?? '')
      if (error) throw error
      const ids = (data ?? []).map((r: { id: string }) => r.id)
      if (ids.length > 0) {
        const { data: users, error: uErr } = await supabase
          .from('users')
          .select('email')
          .in('id', ids)
          .not('email', 'is', null)
          .neq('email', '')
        if (uErr) throw uErr
        emails = (users ?? []).map((u: { email: string }) => u.email)
      }
    } else {
      let query = supabase
        .from('users')
        .select('email')
        .not('email', 'is', null)
        .neq('email', '')
        .is('deleted_at', null)

      if (audience_type !== 'all' && audience_value) {
        query = query.eq(audience_type, audience_value)
      }

      const { data, error } = await query
      if (error) throw error
      emails = (data ?? []).map((u: { email: string }) => u.email)
    }

    if (emails.length === 0) {
      await supabase
        .from('newsletters')
        .update({ recipient_count: 0, status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', newsletter_id)
      return new Response(JSON.stringify({ sent: 0, batches: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Build branded HTML
    const html = broadcastEmail({
      subject,
      preheader: subject,
      body: `<div style="line-height:1.65;color:#444">${body_html}</div>`,
      ctaLabel: 'Go to your dashboard →',
      ctaUrl: 'https://nevermind-beta.vercel.app/dashboard',
    })

    // Send in batches
    let batchCount = 0
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sgKey}`,
        },
        body: JSON.stringify({
          personalizations: batch.map((email) => ({ to: [{ email }] })),
          from: { email: 'brastyphler17@gmail.com', name: 'The Base Movement' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })

      if (res.status !== 202) {
        const errText = await res.text()
        await supabase
          .from('newsletters')
          .update({ status: 'failed', error_message: `SendGrid error ${res.status}: ${errText}` })
          .eq('id', newsletter_id)
        throw new Error(`SendGrid batch ${batchCount + 1} failed: ${res.status} ${errText}`)
      }

      batchCount++
      console.warn(`[NEWSLETTER] Batch ${batchCount} sent (${batch.length} emails)`)
    }

    // Update record with final counts
    await supabase
      .from('newsletters')
      .update({ recipient_count: emails.length, status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', newsletter_id)

    return new Response(JSON.stringify({ sent: emails.length, batches: batchCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[NEWSLETTER-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
