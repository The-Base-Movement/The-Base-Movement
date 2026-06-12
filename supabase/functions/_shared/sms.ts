// Shared SMS dispatch via MNotify (https://developer.mnotify.com)
// Secrets: MNOTIFY_API_KEY (required), MNOTIFY_SENDER_ID (defaults to the
// registered & approved sender ID "THE BASE" — max 11 chars).

/** MNotify expects Ghana numbers without a leading plus: 233XXXXXXXXX. */
export function normalizeGhanaPhone(raw: string): string {
  const digits = raw.trim().replace(/\D/g, '')
  if (digits.startsWith('233')) return digits
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  return `233${digits}`
}

export interface SmsResult {
  ok: boolean
  detail: string
}

/**
 * Send one message to one or more recipients through MNotify's quick-SMS API.
 * Returns ok=false (never throws) so callers treat SMS as best-effort.
 */
export async function sendSms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-expect-error: Deno global
  const apiKey: string | undefined = Deno.env.get('MNOTIFY_API_KEY')
  // @ts-expect-error: Deno global
  const sender: string = Deno.env.get('MNOTIFY_SENDER_ID') ?? 'THE BASE'

  if (!apiKey) {
    console.warn('[SMS] MNOTIFY_API_KEY not set — skipping send to', recipients.length, 'numbers')
    return { ok: false, detail: 'MNOTIFY_API_KEY not set' }
  }

  const recipient = recipients.map(normalizeGhanaPhone).filter((n) => n.length >= 11)
  if (recipient.length === 0) return { ok: false, detail: 'no valid recipients' }

  try {
    const res = await fetch(
      `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          recipient,
          sender,
          message,
          is_schedule: 'false',
          schedule_date: '',
        }),
      }
    )

    const text = await res.text()
    if (!res.ok) {
      console.error('[SMS] MNotify error:', res.status, text)
      return { ok: false, detail: `HTTP ${res.status}: ${text}` }
    }

    // MNotify replies { status: "success", code: "2000", ... } on acceptance
    const ok = text.includes('"success"')
    if (!ok) console.error('[SMS] MNotify rejected:', text)
    return { ok, detail: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[SMS] MNotify dispatch error:', detail)
    return { ok: false, detail }
  }
}
