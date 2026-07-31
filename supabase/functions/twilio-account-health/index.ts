// Twilio Account Health & Balance Monitor Edge Function
// Validates Twilio credentials and returns account status and SMS balance.
// Deploy with: supabase functions deploy twilio-account-health --project-ref vhlyekyxutwbxlvktnzd --use-api --no-verify-jwt

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error: Deno global
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    // @ts-expect-error: Deno global
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    // @ts-expect-error: Deno global
    const fromPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
    // @ts-expect-error: Deno global
    const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID')

    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variable is missing.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const credentials = btoa(`${accountSid}:${authToken}`)
    const authHeader = `Basic ${credentials}`

    // 1. Fetch Account Details
    const accountRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: { Authorization: authHeader },
      }
    )

    if (!accountRes.ok) {
      const errText = await accountRes.text()
      return new Response(
        JSON.stringify({
          ok: false,
          status: accountRes.status,
          error: `Twilio Account Verification Failed: ${errText}`,
        }),
        {
          status: accountRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const accountData = await accountRes.json()

    // 2. Fetch Account Balance
    let balance: number | null = null
    let currency = 'USD'
    try {
      const balanceRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`,
        {
          headers: { Authorization: authHeader },
        }
      )
      if (balanceRes.ok) {
        const bData = await balanceRes.json()
        if (bData?.balance !== undefined) {
          balance = parseFloat(bData.balance)
        }
        if (bData?.currency) {
          currency = bData.currency
        }
      }
    } catch (bErr) {
      console.warn('[TWILIO-HEALTH] Balance fetch failed:', bErr)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        account_name: accountData.friendly_name,
        account_status: accountData.status,
        account_type: accountData.type,
        balance,
        currency,
        from_phone_configured: !!fromPhone,
        messaging_service_configured: !!messagingServiceSid,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[TWILIO-HEALTH-ERROR] ${message}`)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
