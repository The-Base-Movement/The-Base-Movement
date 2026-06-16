// Weekly security digest → Discord.
//
// Invoked by a pg_cron job. Pulls the security posture + recent activity summary
// from the security_posture_summary() RPC (using this function's own service-role
// key) and posts a formatted embed to the dedicated security Discord channel.
//
// Required secret: DISCORD_SECURITY_WEBHOOK_URL (a webhook on a SEPARATE channel
// from the general notifications one).

// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Thresholds above which a metric is treated as "attention needed" and tints the
// embed. These are the expected/acceptable baselines as of 2026-06-16.
const BASELINE = {
  secdef_fns_anon_executable: 29,
  storage_public_listing_policies: 3,
  rls_disabled_tables: 0,
  always_true_policies: 43,
  secdef_fns_mutable_search_path: 0,
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    // @ts-expect-error: Deno global
    const webhookUrl = Deno.env.get('DISCORD_SECURITY_WEBHOOK_URL')

    if (!webhookUrl) {
      console.error('[SECURITY-DIGEST] DISCORD_SECURITY_WEBHOOK_URL is not set.')
      return new Response(
        JSON.stringify({ error: 'DISCORD_SECURITY_WEBHOOK_URL secret missing.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Pull the posture summary via the service-role-only RPC.
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/security_posture_summary`, {
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
      console.error(`[SECURITY-DIGEST] RPC error ${rpcRes.status}: ${detail}`)
      return new Response(JSON.stringify({ error: 'posture RPC failed', detail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502,
      })
    }

    const data = await rpcRes.json()
    const posture = data.posture ?? {}
    const activity = data.activity_7d ?? {}
    const totals = data.totals ?? {}

    // Flag any posture metric that has drifted above its accepted baseline.
    const drifted: string[] = []
    for (const [key, base] of Object.entries(BASELINE)) {
      const val = Number(posture[key] ?? 0)
      if (val > base) drifted.push(`${key}: ${val} (was ≤ ${base})`)
    }
    const failed = Number(activity.failed_or_denied_events ?? 0)
    const attention = drifted.length > 0 || failed > 0

    const fmt = (n: unknown) => String(n ?? 0)
    const embed = {
      title: attention ? '🛡️ Security Digest — attention needed' : '🛡️ Security Digest — all clear',
      description: attention
        ? '⚠️ One or more metrics drifted from baseline or failed/denied events occurred. Review below.'
        : 'No configuration drift and no failed/denied admin events in the last 7 days.',
      color: attention ? 0xce1126 : 0x006b3f,
      fields: [
        {
          name: 'Configuration posture',
          value: [
            `• SECURITY DEFINER fns callable by anon: **${fmt(posture.secdef_fns_anon_executable)}**`,
            `• Public storage listing policies: **${fmt(posture.storage_public_listing_policies)}**`,
            `• Tables with RLS disabled: **${fmt(posture.rls_disabled_tables)}**`,
            `• Always-true RLS policies: **${fmt(posture.always_true_policies)}**`,
            `• SECURITY DEFINER fns w/ mutable search_path: **${fmt(posture.secdef_fns_mutable_search_path)}**`,
          ].join('\n'),
        },
        {
          name: 'Activity (last 7 days)',
          value: [
            `• Audit events: **${fmt(activity.audit_events)}**`,
            `• Failed / denied events: **${fmt(activity.failed_or_denied_events)}**`,
            `• Admins added: **${fmt(activity.admins_added)}**`,
            `• New admin devices: **${fmt(activity.new_admin_devices)}**`,
          ].join('\n'),
        },
        {
          name: 'Totals',
          value: `• Admins: **${fmt(totals.admins)}**\n• Verified 2FA factors: **${fmt(totals.verified_mfa_factors)}**`,
        },
      ] as { name: string; value: string }[],
      footer: { text: 'The Base Movement — automated weekly security digest' },
      timestamp: data.generated_at ?? new Date().toISOString(),
    }

    if (drifted.length > 0) {
      embed.fields.push({ name: 'Drift detected', value: drifted.map((d) => `• ${d}`).join('\n') })
    }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    if (!discordRes.ok) {
      const detail = await discordRes.text()
      console.error(`[SECURITY-DIGEST] Discord error ${discordRes.status}: ${detail}`)
      return new Response(
        JSON.stringify({ error: `Discord returned ${discordRes.status}`, detail }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: discordRes.status,
        }
      )
    }

    return new Response(JSON.stringify({ success: true, attention }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[SECURITY-DIGEST-ERROR] ${msg}`)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
