// Weekly "week in review" activity digest → #notifications.
//
// Invoked by a pg_cron job. Pulls a 7-day activity rollup from the
// activity_digest_summary() RPC and posts a summary embed to the default
// notifications Discord channel (DISCORD_WEBHOOK_URL).

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    // @ts-expect-error: Deno global
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')

    if (!webhookUrl) {
      console.error('[ACTIVITY-DIGEST] DISCORD_WEBHOOK_URL is not set.')
      return json({ error: 'DISCORD_WEBHOOK_URL secret missing.' }, 500, corsHeaders)
    }

    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/activity_digest_summary`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    })

    if (!rpcRes.ok) {
      const detail = await rpcRes.text()
      console.error(`[ACTIVITY-DIGEST] RPC error ${rpcRes.status}: ${detail}`)
      return json({ error: 'activity RPC failed', detail }, 502, corsHeaders)
    }

    const d = await rpcRes.json()
    const reg = d.registrations ?? {}
    const don = d.donations ?? {}
    const ord = d.store_orders ?? {}
    const news = d.newsletters ?? {}
    const ghs = (n: unknown) =>
      `₵ ${Number(n ?? 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const num = (n: unknown) => String(n ?? 0)

    const embed = {
      title: '📅 Week in Review',
      description: 'Platform activity over the last 7 days.',
      color: 0x006b3f,
      fields: [
        {
          name: '🇬🇭 New Compatriots',
          value: `**${num(reg.total)}** total\n• Ghana: ${num(reg.ghana)}\n• Diaspora: ${num(reg.diaspora)}`,
          inline: true,
        },
        {
          name: '💰 Donations',
          value: `**${num(don.count)}** received\n• Verified: ${ghs(don.verified_total)}`,
          inline: true,
        },
        {
          name: '🛒 Store Orders',
          value: `**${num(ord.count)}** placed\n• Paid: ${ghs(ord.paid_total)}`,
          inline: true,
        },
        {
          name: '📢 Content',
          value: `• Posts published: ${num(d.blog_posts_published)}\n• Newsletters sent: ${num(news.sent)} (${num(news.recipients)} recipients)`,
          inline: false,
        },
      ],
      footer: { text: 'The Base Movement — automated weekly activity digest' },
      timestamp: d.generated_at ?? new Date().toISOString(),
    }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!discordRes.ok) {
      const detail = await discordRes.text()
      console.error(`[ACTIVITY-DIGEST] Discord error ${discordRes.status}: ${detail}`)
      return json(
        { error: `Discord returned ${discordRes.status}`, detail },
        discordRes.status,
        corsHeaders
      )
    }

    return json({ success: true }, 200, corsHeaders)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[ACTIVITY-DIGEST-ERROR] ${msg}`)
    return json({ error: msg }, 500, corsHeaders)
  }
})
