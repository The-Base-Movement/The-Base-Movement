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
    // @ts-expect-error: Deno global
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
    if (!webhookUrl) {
      console.error('[DISCORD-NOTIFY] DISCORD_WEBHOOK_URL environment secret is not set.')
      return new Response(
        JSON.stringify({ error: 'Server-side Discord webhook configuration is missing.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const body = await req.json()
    const embeds = body.embeds || (body.embed ? [body.embed] : null)

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
