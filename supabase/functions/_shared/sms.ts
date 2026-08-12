// Shared SMS dispatch via MNotify, Infobip, and Twilio APIs
// Secrets:
// - MNOTIFY_API_KEY (required for Ghana), MNOTIFY_SENDER_ID (defaults to "THEBASE").
// - INFOBIP_API_KEY, INFOBIP_BASE_URL (required for International Infobip dispatch).
// - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.

// @ts-ignore: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

/**
 * MNotify expects numbers without a leading plus, e.g. 233XXXXXXXXX.
 * Numbers stored with an explicit country code (+32..., 0044...) pass through
 * unchanged so diaspora members are reachable; Ghana rules only apply to
 * local-format numbers (024..., 233...).
 */
/**
 * Is this number a Ghana destination?
 *
 * Local formats (024..., 054..., 233...) are Ghana. An explicit foreign country
 * code (+39..., 0044...) is not. This decides which provider pays for the
 * message, so it errs toward Ghana only for genuinely local formats.
 */
export function isGhanaNumber(raw: string): boolean {
  const trimmed = (raw || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return false
  if (digits.startsWith('233')) return true
  if (trimmed.startsWith('+')) return false
  if (digits.startsWith('00')) return false
  return true
}

export function normalizeGhanaPhone(raw: string): string {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2) // 0032... → 32...
  if (digits.startsWith('233')) return digits
  if (trimmed.startsWith('+')) return digits // non-Ghana country code
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return `233${digits}`
}

export interface SmsResult {
  ok: boolean
  detail: string
}

export interface SmsBalance {
  ok: boolean
  /** Remaining SMS units, or null when the provider did not report a figure. */
  balance: number | null
  detail: string
}

/**
 * Remaining SMS credit from MNotify.
 */
export async function getSmsBalance(): Promise<SmsBalance> {
  // @ts-ignore: Deno global
  const apiKey: string | undefined = Deno.env.get('MNOTIFY_API_KEY')
  if (!apiKey) return { ok: false, balance: null, detail: 'MNOTIFY_API_KEY not set' }

  try {
    const res = await fetch(
      `https://api.mnotify.com/api/balance/sms?key=${encodeURIComponent(apiKey)}`
    )
    const text = await res.text()
    if (!res.ok) return { ok: false, balance: null, detail: `HTTP ${res.status}: ${text}` }

    const parsed = JSON.parse(text)
    const raw = parsed?.balance ?? parsed?.sms_balance ?? parsed?.data?.balance
    const balance = raw === undefined || raw === null ? null : Number(raw)
    if (balance === null || Number.isNaN(balance)) {
      return { ok: false, balance: null, detail: `no balance field in response: ${text}` }
    }
    return { ok: true, balance, detail: 'ok' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, balance: null, detail: msg }
  }
}

function isAccepted(responseText: string): boolean {
  try {
    const parsed = JSON.parse(responseText)
    return parsed?.status === 'success' || String(parsed?.code) === '2000'
  } catch {
    return false
  }
}

function getCallbackSecret(): string | null {
  // @ts-ignore: Deno global
  return Deno.env.get('MNOTIFY_CALLBACK_SECRET') ?? Deno.env.get('MNOTIFY_API_KEY') ?? null
}

/**
 * Send SMS via Infobip API.
 * Secrets: INFOBIP_API_KEY, INFOBIP_BASE_URL (e.g. "https://xxxxxx.api.infobip.com").
 */
export async function sendInfobipSms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-ignore: Deno global
  const rawApiKey = Deno.env.get('INFOBIP_API_KEY')?.trim()
  // @ts-ignore: Deno global
  let baseUrl = Deno.env.get('INFOBIP_BASE_URL')?.trim() || Deno.env.get('INFOBIP_URL')?.trim()

  if (!rawApiKey || !baseUrl) {
    return { ok: false, detail: 'INFOBIP_API_KEY or INFOBIP_BASE_URL missing' }
  }

  // Handle case where user pasted "App <key>" or just "<key>"
  const apiKey = rawApiKey.replace(/^app\s+/i, '').trim()

  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`
  }
  baseUrl = baseUrl.replace(/\/+$/, '')

  const destinations = recipients.map((r) => {
    let phone = r.trim()
    if (!phone.startsWith('+')) phone = `+${phone}`
    return { to: phone }
  })

  try {
    const res = await fetch(`${baseUrl}/sms/2/text/advanced`, {
      method: 'POST',
      headers: {
        Authorization: `App ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            from: 'THE BASE',
            destinations,
            text: message,
          },
        ],
      }),
    })

    const text = await res.text()
    if (!res.ok) {
      console.error('[INFOBIP-SMS] Dispatch failed:', res.status, text)
      return { ok: false, detail: `HTTP ${res.status}: ${text}` }
    }

    console.log('[INFOBIP-SMS] Dispatch success:', text)
    return { ok: true, detail: `Dispatched ${destinations.length} recipients via Infobip` }
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[INFOBIP-SMS] Exception:', detail)
    return { ok: false, detail }
  }
}

/**
 * Send SMS via Twilio API.
 */
export async function sendTwilioSms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-ignore: Deno global
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID')
  // @ts-ignore: Deno global
  const authToken =
    Deno.env.get('TWILIO_AUTH_TOKEN') ||
    Deno.env.get('TWILIO_TOKEN') ||
    Deno.env.get('TWILIO_SECRET')
  // @ts-ignore: Deno global
  const fromPhone =
    Deno.env.get('TWILIO_PHONE_NUMBER') ||
    Deno.env.get('TWILIO_FROM_NUMBER') ||
    Deno.env.get('TWILIO_PHONE') ||
    Deno.env.get('TWILIO_NUMBER') ||
    Deno.env.get('TWILIO_SENDER_NUMBER')
  // @ts-ignore: Deno global
  const messagingServiceSid =
    Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') ||
    Deno.env.get('TWILIO_SERVICE_SID') ||
    Deno.env.get('TWILIO_MESSAGING_SID')

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    return { ok: false, detail: 'Twilio credentials or sender ID missing' }
  }

  const authHeader = 'Basic ' + btoa(`${accountSid}:${authToken}`)
  let successCount = 0
  let lastErr = ''

  for (const recipient of recipients) {
    const phone = recipient.startsWith('+') ? recipient : `+${recipient}`
    const params = new URLSearchParams()
    params.append('To', phone)
    params.append('Body', message)
    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid)
    } else if (fromPhone) {
      params.append('From', fromPhone)
    }

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      )
      const resText = await res.text()
      if (res.ok) {
        successCount++
      } else {
        lastErr = resText
        console.error(`[TWILIO-SMS] Dispatch failed for ${phone}:`, resText)
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err)
      console.error(`[TWILIO-SMS] Error for ${phone}:`, lastErr)
    }
  }

  if (successCount > 0) {
    return { ok: true, detail: `Dispatched ${successCount}/${recipients.length} via Twilio` }
  }
  return { ok: false, detail: `Twilio dispatch failed: ${lastErr}` }
}

/**
 * Send one message to one or more recipients through Infobip, MNotify, or Twilio API.
 */
/**
 * Send via MNotify. Ghana-only by policy: MNotify credits are the cheap
 * domestic route, and international delivery through them is unreliable.
 */
export async function sendMnotifySms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-ignore: Deno global
  const apiKey: string | undefined = Deno.env.get('MNOTIFY_API_KEY')
  // @ts-ignore: Deno global
  const sender: string = Deno.env.get('MNOTIFY_SENDER_ID') ?? 'The Base'

  if (!apiKey) {
    console.warn('[SMS] MNOTIFY_API_KEY not set — skipping send to', recipients.length, 'numbers')
    return { ok: false, detail: 'MNOTIFY_API_KEY not set' }
  }

  const normalizedRecipients = recipients.map(normalizeGhanaPhone).filter((n) => n.length >= 11)
  if (normalizedRecipients.length === 0) {
    return { ok: false, detail: 'no valid recipients' }
  }

  // Fetch Opt-Out records
  // @ts-ignore: Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  // @ts-ignore: Deno global
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const optOutSet = new Set<string>()

  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
      const { data, error } = await supabaseAdmin.from('sms_opt_outs').select('phone')

      if (error) {
        console.error('[SMS] Failed to query opt-outs from database:', error.message)
      } else if (data) {
        data.forEach((row: { phone: string }) => {
          const cleanPhone = row.phone.trim().replace('+', '')
          if (cleanPhone) {
            optOutSet.add(cleanPhone)
          }
        })
      }
    } catch (err) {
      console.error('[SMS] Exception querying opt-outs:', err)
    }
  }

  const activeRecipients = normalizedRecipients.filter((phone) => {
    const rawDigits = phone.replace('+', '')
    return !optOutSet.has(rawDigits)
  })

  if (activeRecipients.length === 0) {
    return { ok: true, detail: 'all recipients opted out' }
  }

  const isTransactional = /otp|verification|temp password|login credentials/i.test(message)
  const finalMessage = isTransactional
    ? message
    : `${message}\n\nTo opt out: www.thebasemovement.org.gh/sms-optout`

  const BATCH_SIZE = 50
  let totalDispatched = 0
  let lastResponseText = ''

  try {
    for (let i = 0; i < activeRecipients.length; i += BATCH_SIZE) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const batch = activeRecipients.slice(i, i + BATCH_SIZE)
      // @ts-ignore: Deno global
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const callbackSecret = getCallbackSecret()
      const callbackUrl = (() => {
        if (!supabaseUrl) return undefined
        const url = new URL(`${supabaseUrl}/functions/v1/sms-callback`)
        if (callbackSecret) url.searchParams.set('token', callbackSecret)
        return url.toString()
      })()

      const res = await fetch(
        `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            recipient: batch,
            sender,
            message: finalMessage,
            is_schedule: false,
            schedule_date: '',
            callback_url: callbackUrl,
          }),
        }
      )

      lastResponseText = await res.text()
      if (!res.ok) {
        console.error(
          `[SMS] MNotify batch dispatch failed (Status ${res.status}):`,
          lastResponseText
        )
        return { ok: false, detail: `HTTP ${res.status}: ${lastResponseText}` }
      }

      totalDispatched += batch.length
    }

    const accepted = isAccepted(lastResponseText)
    if (!accepted) {
      console.error('[SMS] MNotify rejected final batch:', lastResponseText)
    }

    return {
      ok: accepted,
      detail: `Successfully dispatched ${totalDispatched} out of ${recipients.length} recipients. Detail: ${lastResponseText}`,
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[SMS] MNotify dispatch error:', detail)
    return { ok: false, detail }
  }
}

/**
 * Destination-aware SMS dispatch.
 *
 * Routing is by the recipient's country, not by which provider happens to be
 * configured. MNotify is the cheap domestic route and is used for +233 numbers
 * only; international numbers go to Infobip or Twilio. The previous version
 * tried Infobip, then Twilio, then MNotify for every recipient, so configuring
 * Twilio silently moved the whole Ghana base onto the expensive route.
 *
 * options.mnotifyOnly forces everything through MNotify, for callers that
 * deliberately want the domestic route.
 */
export async function sendSms(
  recipients: string[],
  message: string,
  options?: { mnotifyOnly?: boolean }
): Promise<SmsResult> {
  if (recipients.length === 0) return { ok: true, detail: 'no recipients' }

  if (options?.mnotifyOnly) return sendMnotifySms(recipients, message)

  const ghana = recipients.filter(isGhanaNumber)
  const international = recipients.filter((r) => !isGhanaNumber(r))

  const details: string[] = []
  let ok = true

  if (ghana.length > 0) {
    const res = await sendMnotifySms(ghana, message)
    details.push(`GH(${ghana.length}): ${res.detail}`)
    if (!res.ok) ok = false
  }

  if (international.length > 0) {
    const res = await sendInternationalSms(international, message)
    details.push(`INTL(${international.length}): ${res.detail}`)
    if (!res.ok) ok = false
  }

  return { ok, detail: details.join(' | ') }
}

/**
 * International dispatch: Infobip first when configured, then Twilio. Falls
 * back to MNotify only as a last resort -- delivery is less reliable and the
 * per-message cost is higher, so a failure here is worth the log line.
 */
async function sendInternationalSms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-ignore: Deno global
  const infobipKey = Deno.env.get('INFOBIP_API_KEY')?.trim()
  // @ts-ignore: Deno global
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID') || Deno.env.get('TWILIO_SID')

  if (infobipKey) {
    const res = await sendInfobipSms(recipients, message)
    if (res.ok) return res
    console.warn('[SMS] Infobip send failed, falling back:', res.detail)
  }

  if (twilioSid) {
    const res = await sendTwilioSms(recipients, message)
    if (res.ok) return res
    console.warn('[SMS] Twilio send failed, falling back to MNotify:', res.detail)
  }

  console.warn(`[SMS] No international provider succeeded for ${recipients.length} recipients`)
  return sendMnotifySms(recipients, message)
}
