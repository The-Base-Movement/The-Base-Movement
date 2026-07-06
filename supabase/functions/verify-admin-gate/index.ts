// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return diff === 0
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { passphrase } = (await req.json()) as { passphrase?: string }
    if (!passphrase?.trim()) return json({ ok: false, reason: 'Passphrase required' }, 400)
    const submitted = passphrase.trim()

    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_gate_passphrase')
      .maybeSingle()

    // @ts-expect-error: Deno global
    const stored = data?.value || Deno.env.get('ADMIN_GATE_PASSPHRASE')
    if (!stored || typeof stored !== 'string' || !stored.trim()) {
      console.error('[ADMIN-GATE] No configured passphrase found.')
      return json({ ok: false, reason: 'Admin gate is not configured' }, 503)
    }

    await delay(250)
    const ok = timingSafeEqual(submitted, stored.trim())
    if (!ok) {
      await delay(750)
    }

    return json({ ok })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[ADMIN-GATE-ERROR] ${message}`)
    return json({ ok: false, reason: 'Verification failed' }, 500)
  }
})
