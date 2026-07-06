// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  getRetryAfterMs,
  registerAttempt,
  type RateLimitEntry,
} from '../_shared/password-reset-rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 20
const LOCKOUT_MS = 15 * 60 * 1000
const throttleStore = new Map<string, RateLimitEntry>()

function clientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const ip = clientIp(req)
    const now = Date.now()
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!serviceKey || jwt !== serviceKey) {
      const currentThrottle = throttleStore.get(ip)
      const retryAfterMs = getRetryAfterMs(now, currentThrottle)
      if (retryAfterMs > 0) {
        return new Response(
          JSON.stringify({
            error: `Too many Discord notifications. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds.`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        )
      }
      throttleStore.set(
        ip,
        registerAttempt(now, currentThrottle, WINDOW_MS, MAX_ATTEMPTS, LOCKOUT_MS)
      )
    }

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
      leaders: 'DISCORD_LEADERS_WEBHOOK_URL',
      broadcasts: 'DISCORD_BROADCASTS_WEBHOOK_URL',
      polls: 'DISCORD_POLLS_WEBHOOK_URL',
      helpdesk: 'DISCORD_HELPDESK_WEBHOOK_URL',
      chapters: 'DISCORD_CHAPTERS_WEBHOOK_URL',
      media: 'DISCORD_MEDIA_WEBHOOK_URL',
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
    if (embeds.length > 5) {
      return new Response(JSON.stringify({ error: 'Too many embeds in one request.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
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
