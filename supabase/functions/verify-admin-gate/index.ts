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

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { passphrase } = (await req.json()) as { passphrase?: string }
    if (!passphrase?.trim()) return json({ ok: false, reason: 'Passphrase required' }, 400)

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
    const stored = data?.value || Deno.env.get('ADMIN_GATE_PASSPHRASE') || 'ghana-first-2026'

    const ok = passphrase.trim() === stored.trim()

    return json({ ok })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[ADMIN-GATE-ERROR] ${message}`)
    return json({ ok: false, reason: 'Verification failed' }, 500)
  }
})
