import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InstantAlertPayload {
  action?: 'instant_alert' | 'weekly_summary'
  event_type?:
    | 'password_updated'
    | 'reset_requested'
    | 'admin_reset_triggered'
    | 'recovery_approved'
    | 'recovery_rejected'
    | string
  user_id?: string
  email?: string
  phone?: string
  full_name?: string
  ip_address?: string
  triggered_by?: string
  metadata?: Record<string, unknown>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const webhookUrl =
      Deno.env.get('DISCORD_ALERTS_WEBHOOK_URL') ||
      Deno.env.get('DISCORD_SECURITY_WEBHOOK_URL') ||
      Deno.env.get('DISCORD_WEBHOOK_URL') ||
      'https://discordapp.com/api/webhooks/1532836370991812709/-ofQreWQH8cyTL_sH5hwOVFCoJCoYr7GlD5vYjDHY-ypBesTTBUCr2nitrKuKuNsdZhk'

    const supabase = createClient(supabaseUrl, serviceKey)

    const body: InstantAlertPayload = await req.json().catch(() => ({}))
    const action = body.action || (body.event_type ? 'instant_alert' : 'weekly_summary')

    if (action === 'weekly_summary') {
      // 1. Fetch 7-day weekly activity summary from DB
      const { data: summaryData, error: summaryErr } = await supabase.rpc(
        'get_weekly_password_activity_summary'
      )

      if (summaryErr) {
        console.error('[PASSWORD-RESET-WEBHOOK] Error fetching weekly summary:', summaryErr)
        return new Response(JSON.stringify({ error: summaryErr.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }

      const summary = summaryData || {}
      const nowStr = new Date().toISOString()

      const embed = {
        title: 'ðŸ“Š Weekly Password & Security Summary',
        description: 'Automated 7-day summary report of member password updates & reset requests.',
        color: 0x006b3f, // Ghana Green
        fields: [
          {
            name: 'ðŸ“ˆ 7-Day Activity Totals',
            value: [
              `â€¢ Total Security Events: **${summary.total_events || 0}**`,
              `â€¢ Passwords Updated: **${summary.password_updated || 0}**`,
              `â€¢ Member Reset Requests: **${summary.reset_requested || 0}**`,
              `â€¢ Admin Resets Initiated: **${summary.admin_reset_triggered || 0}**`,
              `â€¢ Account Recoveries Approved: **${summary.recovery_approved || 0}**`,
            ].join('\n'),
          },
          {
            name: 'ðŸ“… Reporting Window',
            value: `From <t:${Math.floor(new Date(summary.period_start || Date.now() - 7 * 86400000).getTime() / 1000)}:f> to <t:${Math.floor(Date.now() / 1000)}:f>`,
          },
        ],
        footer: { text: 'The Base Movement â€” Automated Security Operations' },
        timestamp: nowStr,
      }

      // Send to webhook if available
      let webhookSent = false
      if (webhookUrl) {
        const discordRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embeds: [embed] }),
        })
        webhookSent = discordRes.ok
      }

      return new Response(
        JSON.stringify({ success: true, action: 'weekly_summary', summary, webhookSent }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 2. Handle Instant Alert
    const eventType = body.event_type || 'password_updated'
    const email = body.email || ''
    const phone = body.phone || ''
    const fullName = body.full_name || 'Member / User'
    const ip = body.ip_address || 'N/A'
    const triggeredBy = body.triggered_by || 'user'

    // Log to DB audit table
    await supabase.rpc('log_password_event', {
      p_user_id: body.user_id || null,
      p_event_type: eventType,
      p_email: email || null,
      p_phone: phone || null,
      p_full_name: fullName || null,
      p_ip_address: ip || null,
      p_triggered_by: triggeredBy,
      p_metadata: body.metadata || {},
    })

    // Prepare Discord Embed based on event_type
    let eventTitle = 'ðŸ” Password Activity Alert'
    let eventColor = 0x006b3f // Green
    let eventDescription = 'A password event was recorded.'

    if (eventType === 'password_updated') {
      eventTitle = 'ðŸ”‘ Password Updated'
      eventColor = 0x006b3f // Green
      eventDescription = `Password was successfully changed for **${fullName}**.`
    } else if (eventType === 'reset_requested') {
      eventTitle = 'ðŸ“© Password Reset Requested'
      eventColor = 0xfcd116 // Yellow / Gold
      eventDescription = `A password reset OTP/link was requested for **${fullName}**.`
    } else if (eventType === 'admin_reset_triggered') {
      eventTitle = 'ðŸ›¡ï¸ Admin Triggered Password Reset'
      eventColor = 0xe65100 // Orange
      eventDescription = `An administrator initiated a password reset link for **${fullName}**.`
    } else if (eventType === 'recovery_approved') {
      eventTitle = 'âœ… Password Recovery Request Approved'
      eventColor = 0x7b1fa2 // Purple
      eventDescription = `Account recovery request was approved for **${fullName}**.`
    } else if (eventType === 'reset_failed') {
      eventTitle = 'ðŸš¨ Failed Password Reset Attempt'
      eventColor = 0xd32f2f // Red
      eventDescription = `A password reset attempt failed for phone/account **${phone || fullName}** (Invalid/expired OTP or invalid credentials).`
    } else if (eventType === 'rate_limit_exceeded') {
      eventTitle = 'âš ï¸ Password Reset Rate Limit Exceeded'
      eventColor = 0xc62828 // Dark Red
      eventDescription = `Multiple invalid password reset attempts were detected and throttled for **${phone || fullName}**.`
    }

    const embed = {
      title: eventTitle,
      description: eventDescription,
      color: eventColor,
      fields: [
        {
          name: 'ðŸ‘¤ Member / Account',
          value: `â€¢ **Name:** ${fullName}\nâ€¢ **Phone:** ${phone || 'N/A'}\nâ€¢ **Email:** ${email || 'N/A'}`,
          inline: true,
        },
        {
          name: 'âš™ï¸ Event Context',
          value: `â€¢ **Event:** \`${eventType}\`\nâ€¢ **Initiated By:** ${triggeredBy}\nâ€¢ **IP:** \`${ip}\``,
          inline: true,
        },
      ],
      footer: { text: 'The Base Movement â€” Security Operations' },
      timestamp: new Date().toISOString(),
    }

    let webhookSent = false
    if (webhookUrl) {
      const discordRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      })
      webhookSent = discordRes.ok
    }

    return new Response(
      JSON.stringify({
        success: true,
        action: 'instant_alert',
        event_type: eventType,
        webhookSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[PASSWORD-RESET-WEBHOOK-ERROR]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
