// Twilio Account Health & Balance Monitor Edge Function
// Validates Twilio credentials and returns account status, SMS balance, and secret key aliases.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getEnv(keys: string[]): { foundKey: string | null; value: string | null } {
  for (const k of keys) {
    // @ts-expect-error: Deno global
    const val = Deno.env.get(k)
    if (val && val.trim()) {
      return { foundKey: k, value: val.trim() }
    }
  }
  return { foundKey: null, value: null }
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const accountSidInfo = getEnv(['TWILIO_ACCOUNT_SID', 'TWILIO_SID'])
    const authTokenInfo = getEnv(['TWILIO_AUTH_TOKEN', 'TWILIO_TOKEN', 'TWILIO_SECRET'])
    const phoneInfo = getEnv([
      'TWILIO_PHONE_NUMBER',
      'TWILIO_FROM_NUMBER',
      'TWILIO_PHONE',
      'TWILIO_NUMBER',
      'TWILIO_SENDER_NUMBER',
    ])
    const messagingServiceInfo = getEnv([
      'TWILIO_MESSAGING_SERVICE_SID',
      'TWILIO_SERVICE_SID',
      'TWILIO_MESSAGING_SID',
    ])
    const verifyServiceInfo = getEnv([
      'TWILIO_VERIFY_SERVICE_SID',
      'TWILIO_VERIFY_SID',
      'TWILIO_VERIFY_SERVICE_ID',
    ])

    const accountSid = accountSidInfo.value
    const authToken = authTokenInfo.value

    if (!accountSid || !authToken) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN secret is missing in Supabase.',
          configured_keys: {
            account_sid_key: accountSidInfo.foundKey,
            auth_token_key: authTokenInfo.foundKey,
            phone_key: phoneInfo.foundKey,
            messaging_service_key: messagingServiceInfo.foundKey,
            verify_service_key: verifyServiceInfo.foundKey,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const credentials = btoa(`${accountSid}:${authToken}`)
    const authHeader = `Basic ${credentials}`

    // Fetch Account Details
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

    // Fetch Account Balance
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
        configured_keys: {
          account_sid_key: accountSidInfo.foundKey,
          auth_token_key: authTokenInfo.foundKey,
          phone_number_key: phoneInfo.foundKey,
          messaging_service_key: messagingServiceInfo.foundKey,
          verify_service_key: verifyServiceInfo.foundKey,
        },
        has_phone_number: !!phoneInfo.value,
        has_messaging_service: !!messagingServiceInfo.value,
        has_verify_service: !!verifyServiceInfo.value,
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
