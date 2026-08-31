import { requireServiceRoleCall } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const authz = requireServiceRoleCall(req, serviceKey)
  if (!authz.ok) {
    return new Response(await authz.response.text(), {
      status: authz.response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const accountSid = (Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID'))?.trim()
    const authToken = (Deno.env.get('TWILIO_AUTH_TOKEN') || Deno.env.get('TWILIO_TOKEN'))?.trim()

    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Twilio credentials not configured' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const auth = 'Basic ' + btoa(`${accountSid}:${authToken}`)
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { Authorization: auth },
    })
    const payload = await res.json().catch(() => ({}))

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: payload.status ?? null,
        type: payload.type ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
