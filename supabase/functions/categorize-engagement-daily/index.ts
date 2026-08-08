// Daily engagement categorization cron job.
//
// Invoked by pg_cron job (daily at 02:15 UTC).
// Calls the categorize_member_engagement() SQL function to categorize all active members
// by their last sign-in timestamp, then posts a summary to Discord.
//
// Required secrets: CRON_TOKEN (for pg_cron), DISCORD_MEMBERS_WEBHOOK_URL (optional)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { json, requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''

    if (!supabaseUrl) {
      console.error('[CATEGORIZE-ENGAGEMENT] SUPABASE_URL is not set.')
      return new Response(JSON.stringify({ error: 'SUPABASE_URL secret missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Call the SQL function to categorize all active members by engagement.
    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/categorize_member_engagement`, {
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
      console.error(`[CATEGORIZE-ENGAGEMENT] RPC error ${rpcRes.status}: ${detail}`)
      return new Response(
        JSON.stringify({ error: 'categorize_member_engagement RPC failed', detail }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502,
        }
      )
    }

    const rpcData = await rpcRes.json()
    const updatedCount = typeof rpcData === 'number' ? rpcData : Number(rpcData) || 0

    // Query breakdown: count by engagement_status for active/approved members.
    const breakdownRes = await fetch(
      `${supabaseUrl}/rest/v1/users?select=engagement_status&or=(status.eq.Active,status.eq.Approved)`,
      {
        method: 'GET',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    )

    let breakdown = { active: 0, dormant: 0, never: 0 }
    if (breakdownRes.ok) {
      const members = (await breakdownRes.json()) as Array<{ engagement_status: string | null }>
      for (const m of members) {
        if (m.engagement_status === 'Active') breakdown.active += 1
        else if (m.engagement_status === 'Dormant') breakdown.dormant += 1
        else if (m.engagement_status === 'Never') breakdown.never += 1
      }
    }

    console.log(
      `[CATEGORIZE-ENGAGEMENT] Updated ${updatedCount} members: ${breakdown.active} Active, ${breakdown.dormant} Dormant, ${breakdown.never} Never`
    )

    // Post Discord notification.
    const webhookUrl = Deno.env.get('DISCORD_MEMBERS_WEBHOOK_URL')
    if (webhookUrl) {
      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**Engagement Update**\nCategorized ${updatedCount} members: ${breakdown.active} Active, ${breakdown.dormant} Dormant, ${breakdown.never} Never`,
        }),
      })

      if (!discordRes.ok) {
        const detail = await discordRes.text()
        console.error(`[CATEGORIZE-ENGAGEMENT] Discord error ${discordRes.status}: ${detail}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updated: updatedCount,
        active: breakdown.active,
        dormant: breakdown.dormant,
        never: breakdown.never,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error(`[CATEGORIZE-ENGAGEMENT-ERROR] ${msg}`)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
