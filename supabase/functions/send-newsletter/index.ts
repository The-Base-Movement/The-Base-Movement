// @ts-nocheck
// THE BASE: NEWSLETTER SEND
// Fetches emails matching the audience filter, wraps body in broadcastEmail
// template, sends via SendGrid /v3/mail/send in batches of 1,000, and updates
// the newsletters row.
//
// Required secret: SENDGRID_API_KEY
// Auto-injected:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const BATCH_SIZE = 1000

// ---------------------------------------------------------------------------
// Inline email template (avoids shared-import bundling issues in MCP deploy)
// ---------------------------------------------------------------------------

const SHELL_OPEN = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;700;800&family=Work+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:32px 0;background:#f4f4f4;font-family:'Work Sans',Arial,sans-serif;font-size:14px;color:#1a1a1a">
<div style="max-width:600px;margin:0 auto">`

const SHELL_CLOSE = `</div></body></html>`

const TOP_BAR = `<div style="height:5px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F)"></div>`

function emailHeader(tag: string) {
  return `
  <div style="background:#181d19;padding:20px 28px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:28px;height:28px;background:#CE1126;border-radius:4px;display:flex;align-items:center;justify-content:center;font-family:'Public Sans',Arial;font-weight:800;font-size:13px;color:#fff">B</div>
      <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:14px;color:#fff">The Base Movement</span>
    </div>
    <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">${tag}</span>
  </div>`
}

function emailFooter(lines: string) {
  return `
  <div style="background:#f9f9f9;padding:16px 28px;font-size:11px;color:#aaa;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;line-height:1.7">
    ${lines}
    <div style="width:80px;height:3px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F);border-radius:99px;margin-top:10px"></div>
  </div>`
}

function ctaButton(label: string, url: string, color = '#006B3F') {
  return `<a href="${url}" style="display:block;background:${color};color:#fff;text-align:center;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:20px 0">${label}</a>`
}

interface BroadcastEmailData {
  subject: string
  preheader: string
  greeting?: string
  body: string
  region?: string
  heroText?: string
  heroColor?: string
  ctaLabel: string
  ctaUrl: string
}

function broadcastEmail(d: BroadcastEmailData): string {
  const greeting = d.greeting ?? 'Patriots —'
  const heroBg = d.heroColor ?? 'linear-gradient(135deg,#181d19,#0f1310)'
  const heroText = d.heroText ?? 'The Base'

  const regionPill = d.region
    ? `<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-family:'Public Sans',Arial;font-weight:800;font-size:10px;background:rgba(218,165,32,.1);color:#7d5d12;border:1px solid rgba(218,165,32,.25)">${d.region}</span>`
    : ''
  const fieldPill = `<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-family:'Public Sans',Arial;font-weight:800;font-size:10px;background:rgba(0,107,63,.1);color:#006B3F;border:1px solid rgba(0,107,63,.2)">Field report</span>`

  return `${SHELL_OPEN}
  <div style="font-size:10px;color:#888;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;background:#f4f4f4;padding:10px 24px">
    ${d.preheader}
  </div>
  <div style="background:#fff;border-radius:4px;overflow:hidden">
    ${TOP_BAR}
    ${emailHeader('Movement update')}
    <div style="background:${heroBg};height:140px;display:flex;align-items:center;justify-content:center">
      <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:48px;color:rgba(255,255,255,.25);letter-spacing:-.04em">${heroText}</span>
    </div>
    <div style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">${greeting}</div>
      <h1 style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">${d.subject}</h1>
      <div style="display:flex;gap:6px;margin-bottom:14px">${regionPill}${fieldPill}</div>
      ${d.body}
      ${ctaButton(d.ctaLabel, d.ctaUrl)}
    </div>
    ${emailFooter(`You're receiving this because you are a verified member of The Base. · <a href="#" style="color:#aaa">Unsubscribe</a><br>The Base Movement · Accra, Ghana · nevermind-beta.vercel.app`)}
  </div>
${SHELL_CLOSE}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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
