// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const embeds = body.embeds || (body.embed ? [body.embed] : null)

    // Route to a per-channel webhook. Unknown/absent channel → the default
    // notifications webhook. If a channel-specific secret isn't set yet, fall
    // back to the default so messages aren't lost before the channel exists.
    const channel = String(body.channel ?? '').toLowerCase()
    const channelSecrets: Record<string, string> = {
      payments: 'DISCORD_PAYMENTS_WEBHOOK_URL',
      alerts: 'DISCORD_ALERTS_WEBHOOK_URL',
      members: 'DISCORD_MEMBERS_WEBHOOK_URL',
      content: 'DISCORD_CONTENT_WEBHOOK_URL',
    }
    const secretName = channelSecrets[channel] ?? 'DISCORD_WEBHOOK_URL'
    // @ts-expect-error: Deno global
    let webhookUrl = Deno.env.get(secretName)
    if (!webhookUrl && secretName !== 'DISCORD_WEBHOOK_URL') {
      console.warn(`[DISCORD-NOTIFY] ${secretName} unset; falling back to DISCORD_WEBHOOK_URL.`)
      // @ts-expect-error: Deno global
      webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
    }
    if (!webhookUrl) {
      console.error(`[DISCORD-NOTIFY] No webhook configured (looked for ${secretName}).`)
      return new Response(
        JSON.stringify({ error: 'Server-side Discord webhook configuration is missing.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!embeds || !Array.isArray(embeds) || embeds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "embeds" array in request body.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.warn(`[DISCORD-NOTIFY] Dispatching ${embeds.length} embeds to Discord...`)

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds }),
    })

    if (!discordResponse.ok) {
      const responseText = await discordResponse.text()
      console.error(
        `[DISCORD-NOTIFY] Discord API error (${discordResponse.status}): ${responseText}`
      )
      return new Response(
        JSON.stringify({
          error: `Discord API returned status ${discordResponse.status}`,
          details: responseText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: discordResponse.status,
        }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[DISCORD-NOTIFY-ERROR] Request processing failed: ${errorMessage}`)
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
