// @ts-nocheck
// Shared email dispatch via RESEND (https://resend.com). Replaces SendGrid.
//
// Secret: RESEND_API_KEY (required). The sending domain must be verified in
// Resend — we send from noreply@thebasemovement.org.gh (verified).
//
// Two modes:
//   sendEmail()      — one message to one or more recipients (transactional).
//   sendEmailBatch() — one individual email PER recipient so recipients never
//                      see each other (the SendGrid `personalizations` model),
//                      via Resend's batch endpoint (max 100 per call).

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const RESEND_BATCH_ENDPOINT = 'https://api.resend.com/emails/batch'
export const DEFAULT_FROM = 'The Base Movement <noreply@thebasemovement.org.gh>'

export interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  // Resend tags — echoed back in webhook events. Used to link a delivery event
  // to its source (e.g. { name: 'newsletter_id', value: <uuid> }).
  tags?: { name: string; value: string }[]
}

export interface EmailResult {
  ok: boolean
  detail: string
}

function resendKey(): string | undefined {
  return Deno.env.get('RESEND_API_KEY')
}

function toArray(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to]
}

/** Send a single email (one message, one or more `to` addresses). */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const key = resendKey()
  if (!key) {
    console.warn('[EMAIL] RESEND_API_KEY not set — skipping send to', msg.to)
    return { ok: false, detail: 'RESEND_API_KEY not set' }
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: msg.from ?? DEFAULT_FROM,
        to: toArray(msg.to),
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.replyTo,
        tags: msg.tags,
      }),
    })
    const text = await res.text()
    if (!res.ok) {
      console.error('[EMAIL] Resend send failed', res.status, text)
      return { ok: false, detail: `HTTP ${res.status}: ${text}` }
    }
    return { ok: true, detail: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[EMAIL] Resend send error', detail)
    return { ok: false, detail }
  }
}

/**
 * Send many individual emails — one per recipient — via Resend's batch
 * endpoint, chunked at 100. Each recipient gets their own email, so nobody
 * sees the others (equivalent to SendGrid multiple `personalizations`).
 */
export async function sendEmailBatch(
  messages: EmailMessage[]
): Promise<{ sent: number; failed: number; detail: string }> {
  const key = resendKey()
  if (!key) {
    console.warn('[EMAIL] RESEND_API_KEY not set — skipping batch of', messages.length)
    return { sent: 0, failed: messages.length, detail: 'RESEND_API_KEY not set' }
  }
  let sent = 0
  let failed = 0
  let lastDetail = ''
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({
      from: m.from ?? DEFAULT_FROM,
      to: toArray(m.to),
      subject: m.subject,
      html: m.html,
      text: m.text,
      reply_to: m.replyTo,
      tags: m.tags,
    }))
    try {
      const res = await fetch(RESEND_BATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(chunk),
      })
      lastDetail = await res.text()
      if (res.ok) {
        sent += chunk.length
      } else {
        failed += chunk.length
        console.error('[EMAIL] Resend batch failed', res.status, lastDetail)
      }
    } catch (err) {
      failed += chunk.length
      lastDetail = err instanceof Error ? err.message : String(err)
      console.error('[EMAIL] Resend batch error', lastDetail)
    }
  }
  return { sent, failed, detail: lastDetail }
}
