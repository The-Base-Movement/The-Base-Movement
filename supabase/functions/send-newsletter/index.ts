// @ts-nocheck
// THE BASE: NEWSLETTER SEND
// Fetches emails matching the audience filter, wraps body in broadcastEmail
// template, sends via SendGrid /v3/mail/send in batches of 1,000, and updates
// the newsletters row.
//
// Required secret: SENDGRID_API_KEY
// Auto-injected:   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageNewsletters, json, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

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
<style>
@media only screen and (max-width:600px){
  body{padding:0!important}
  .ew{width:100%!important;border-radius:0!important}
  .eh td{padding:12px 16px!important}
  .logo{height:28px!important;width:auto!important}
  .hero{height:90px!important}
  .hero-t{font-size:30px!important}
  .bd{padding:20px 16px 18px!important}
  .subj{font-size:21px!important;line-height:1.2!important}
  .ft{padding:14px 16px!important}
  .cta{padding:12px 20px!important;font-size:13px!important}
  .pills{flex-wrap:wrap!important}
}
</style>
</head>
<body style="margin:0;padding:24px 0;background:#f4f4f4;font-family:'Work Sans',Arial,sans-serif;font-size:14px;color:#1a1a1a">
<div class="ew" style="max-width:600px;margin:0 auto;width:100%">`

const SHELL_CLOSE = `</div></body></html>`

const TOP_BAR = `<div style="height:5px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F)"></div>`

function emailHeader(tag: string) {
  // Table layout: Outlook Win32 ignores display:flex, so we use a 2-cell table.
  // Mobile @media shrinks the logo via .logo class.
  return `
  <table class="eh" width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background:#181d19;border-collapse:collapse">
    <tr>
      <td style="padding:18px 28px;vertical-align:middle">
        <img class="logo" src="https://thebasemovement.creativeutil.com/branding/logo.png"
          alt="The Base Movement" height="36" width="auto"
          style="height:36px;width:auto;display:block;border:0;max-width:180px" />
      </td>
      <td style="padding:18px 28px;vertical-align:middle;text-align:right;white-space:nowrap">
        <span style="font-family:'Public Sans',Arial;font-weight:800;font-size:9px;color:rgba(255,255,255,.5);letter-spacing:.08em;text-transform:uppercase">${tag}</span>
      </td>
    </tr>
  </table>`
}

function emailFooter(lines: string) {
  return `
  <div class="ft" style="background:#f9f9f9;padding:16px 28px;font-size:11px;color:#aaa;font-family:'Public Sans',Arial;font-weight:700;letter-spacing:.04em;line-height:1.7">
    ${lines}
    <div style="width:80px;height:3px;background:linear-gradient(to right,#CE1126,#DAA520,#006B3F);border-radius:99px;margin-top:10px"></div>
  </div>`
}

function ctaButton(label: string, url: string, color = '#006B3F') {
  return `<a class="cta" href="${url}" style="display:block;background:${color};color:#fff;text-align:center;padding:14px 28px;border-radius:4px;font-family:'Public Sans',Arial;font-weight:800;font-size:14px;text-decoration:none;margin:20px 0">${label}</a>`
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
    <div class="hero" style="background:${heroBg};height:140px;display:flex;align-items:center;justify-content:center;overflow:hidden">
      <span class="hero-t" style="font-family:'Public Sans',Arial;font-weight:800;font-size:48px;color:rgba(255,255,255,.25);letter-spacing:-.04em">${heroText}</span>
    </div>
    <div class="bd" style="padding:28px 28px 24px">
      <div style="font-size:15px;font-weight:700;margin-bottom:18px;color:#181d19">${greeting}</div>
      <h1 class="subj" style="font-family:'Public Sans',Arial;font-weight:800;font-size:26px;letter-spacing:-.02em;line-height:1.15;color:#181d19;margin:0 0 14px">${d.subject}</h1>
      <div class="pills" style="display:flex;gap:6px;margin-bottom:14px">${regionPill}${fieldPill}</div>
      ${d.body}
      ${ctaButton(d.ctaLabel, d.ctaUrl)}
    </div>
    ${emailFooter(`You're receiving this because you are a verified member of The Base. · <a href="%%UNSUB%%" style="color:#aaa">Unsubscribe</a><br>The Base Movement · Accra, Ghana · thebasemovement.creativeutil.com`)}
  </div>
${SHELL_CLOSE}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Recipient {
  email: string
  id: string
}

// Announce a sent newsletter to the #content Discord channel. Non-fatal.
async function notifyContent(subject: string, recipientCount: number) {
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    await fetch(`${url}/functions/v1/discord-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        channel: 'content',
        embeds: [
          {
            title: '📨 Newsletter Sent',
            description: `**${subject}**`,
            color: 0x5865f2,
            fields: [{ name: 'Recipients', value: String(recipientCount), inline: true }],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    })
  } catch (e) {
    console.error('[NEWSLETTER] Discord notify failed:', e)
  }
}

// Fetch {email, id} pairs for a single audience filter, respecting opt-out
async function fetchRecipientsForFilter(
  supabase: ReturnType<typeof createClient>,
  type: string,
  value: string | null
): Promise<Recipient[]> {
  if (type === 'role') {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('role', value ?? '')
    if (error) throw error
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    if (ids.length === 0) return []
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, email')
      .in('id', ids)
      .not('email', 'is', null)
      .neq('email', '')
      .eq('newsletter_opt_out', false)
    if (uErr) throw uErr
    return (users ?? []).map((u: { id: string; email: string }) => ({ id: u.id, email: u.email }))
  }

  let query = supabase
    .from('users')
    .select('id, email')
    .not('email', 'is', null)
    .neq('email', '')
    .is('deleted_at', null)
    .eq('newsletter_opt_out', false)

  if (type !== 'all' && value) {
    query = query.eq(type, value)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((u: { id: string; email: string }) => ({ id: u.id, email: u.email }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!sgKey) {
      return json({ skipped: true, reason: 'SENDGRID_API_KEY not set' }, 200, corsHeaders)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey)

    const authz = await requireAuthorizedAdmin(req, supabase, canManageNewsletters, {
      allowServiceRole: true,
      serviceRoleKey: serviceKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      newsletter_id,
      subject,
      body_html,
      audience_type,
      audience_value,
      audience_filters,
      sent_by,
    } = await req.json()

    const baseNewsletterRow = {
      id: newsletter_id,
      subject,
      body_html,
      audience_type,
      audience_value: audience_value ?? null,
      audience_filters: Array.isArray(audience_filters) ? audience_filters : [],
      sent_by: sent_by ?? authz.callerUserId,
      error_message: null,
    }

    const { error: upsertError } = await supabase
      .from('newsletters')
      .upsert(baseNewsletterRow, { onConflict: 'id' })
    if (upsertError) {
      throw new Error(upsertError.message)
    }

    // Collect unique {email, id} pairs — deduplicated by email via Map
    const recipientMap = new Map<string, string>() // email → id

    const filters: Array<{ type: string; value: string | null }> =
      Array.isArray(audience_filters) && audience_filters.length > 0
        ? audience_filters
        : [{ type: audience_type ?? 'all', value: audience_value ?? null }]

    // Batch all constituency filters into one IN(...) query
    const constituencyValues = filters
      .filter((f) => f.type === 'constituency' && f.value)
      .map((f) => f.value as string)

    // Batch all chapter filters into one IN(...) query
    const chapterValues = filters
      .filter((f) => f.type === 'chapter' && f.value)
      .map((f) => f.value as string)

    const otherFilters = filters.filter((f) => f.type !== 'constituency' && f.type !== 'chapter')

    if (constituencyValues.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .not('email', 'is', null)
        .neq('email', '')
        .is('deleted_at', null)
        .eq('newsletter_opt_out', false)
        .in('constituency', constituencyValues)
      if (error) throw error
      for (const u of data ?? []) {
        const { id, email } = u as { id: string; email: string }
        if (!recipientMap.has(email)) recipientMap.set(email, id)
      }
    }

    if (chapterValues.length > 0) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .not('email', 'is', null)
        .neq('email', '')
        .is('deleted_at', null)
        .eq('newsletter_opt_out', false)
        .in('chapter', chapterValues)
      if (error) throw error
      for (const u of data ?? []) {
        const { id, email } = u as { id: string; email: string }
        if (!recipientMap.has(email)) recipientMap.set(email, id)
      }
    }

    for (const filter of otherFilters) {
      const batch = await fetchRecipientsForFilter(supabase, filter.type, filter.value)
      for (const r of batch) {
        if (!recipientMap.has(r.email)) recipientMap.set(r.email, r.id)
      }
    }

    const recipients: Recipient[] = Array.from(recipientMap.entries()).map(([email, id]) => ({
      email,
      id,
    }))

    if (recipients.length === 0) {
      await supabase
        .from('newsletters')
        .update({ recipient_count: 0, status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', newsletter_id)
      return json({ sent: 0, batches: 0 }, 200, corsHeaders)
    }

    // Build the base URL for unsubscribe links
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''

    // Build branded HTML — footer uses %%UNSUB%% substitution tag
    const html = broadcastEmail({
      subject,
      preheader: subject,
      body: `<div style="line-height:1.65;color:#444">${body_html}</div>`,
      ctaLabel: 'Go to your dashboard →',
      ctaUrl: 'https://thebasemovement.creativeutil.com/dashboard',
    })

    // Helper: URL-safe base64 encode a user UUID
    function encodeToken(id: string): string {
      return btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    }

    // Send in batches
    let batchCount = 0
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sgKey}`,
        },
        body: JSON.stringify({
          personalizations: batch.map(({ email, id }) => ({
            to: [{ email }],
            substitutions: {
              '%%UNSUB%%': `${supabaseUrl}/functions/v1/newsletter-unsubscribe?token=${encodeToken(id)}`,
            },
            // custom_args are echoed back in SendGrid event webhooks — used to link
            // delivery events to the correct newsletters row
            custom_args: { newsletter_id },
          })),
          from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
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
      console.warn(`[NEWSLETTER] Batch ${batchCount} sent (${batch.length} recipients)`)
    }

    // Update record with final counts
    await supabase
      .from('newsletters')
      .update({
        recipient_count: recipients.length,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', newsletter_id)

    await notifyContent(subject, recipients.length)

    return json({ sent: recipients.length, batches: batchCount }, 200, corsHeaders)
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err)
    console.error('[NEWSLETTER-ERROR]', message)
    return json({ error: message }, 500, corsHeaders)
  }
})
