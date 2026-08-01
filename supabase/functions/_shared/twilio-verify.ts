const TWILIO_VERIFY_BASE_URL = 'https://verify.twilio.com/v2'

function resolveTwilioVerifyVars() {
  // @ts-expect-error: Deno global
  const accountSid = (Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID'))?.trim() ?? ''
  // @ts-expect-error: Deno global
  const authToken = (Deno.env.get('TWILIO_AUTH_TOKEN') || Deno.env.get('TWILIO_TOKEN') || Deno.env.get('TWILIO_SECRET'))?.trim() ?? ''
  // @ts-expect-error: Deno global
  const serviceSid = (
    Deno.env.get('TWILIO_VERIFY_SERVICE_SID') ||
    Deno.env.get('TWILIO_VERIFY_SID') ||
    Deno.env.get('TWILIO_VERIFY_SERVICE_ID') ||
    Deno.env.get('TWILIO_VERIFY_ID')
  )?.trim() ?? ''

  return { accountSid, authToken, serviceSid }
}

export function isTwilioVerifyConfigured(): boolean {
  const { accountSid, authToken, serviceSid } = resolveTwilioVerifyVars()
  return !!(accountSid && authToken && serviceSid)
}

function getTwilioConfig() {
  const { accountSid, authToken, serviceSid } = resolveTwilioVerifyVars()

  if (!accountSid || !authToken || !serviceSid) {
    throw new Error(
      'Twilio Verify is not configured. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID.'
    )
  }

  return { accountSid, authToken, serviceSid }
}

async function twilioVerifyRequest(
  path: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const { accountSid, authToken, serviceSid } = getTwilioConfig()
  const auth = btoa(`${accountSid}:${authToken}`)

  const response = await fetch(`${TWILIO_VERIFY_BASE_URL}/Services/${serviceSid}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const code = typeof payload.code === 'number' ? `[${payload.code}] ` : ''
    const message =
      typeof payload.message === 'string'
        ? payload.message
        : `Twilio Verify error ${response.status}`
    throw new Error(`${code}${message}`)
  }

  return payload
}

export async function startTwilioVerify(phone: string): Promise<void> {
  await twilioVerifyRequest('Verifications', { To: phone, Channel: 'sms' })
}

export async function checkTwilioVerify(phone: string, code: string): Promise<boolean> {
  const payload = await twilioVerifyRequest('VerificationCheck', {
    To: phone,
    Code: code,
  })
  return payload.status === 'approved'
}
