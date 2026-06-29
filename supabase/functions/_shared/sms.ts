// Shared SMS dispatch via MNotify (https://developer.mnotify.com)
// Secrets: MNOTIFY_API_KEY (required), MNOTIFY_SENDER_ID (defaults to "THEBASE" — max 11 chars).

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

/**
 * MNotify expects numbers without a leading plus, e.g. 233XXXXXXXXX.
 * Numbers stored with an explicit country code (+32..., 0044...) pass through
 * unchanged so diaspora members are reachable; Ghana rules only apply to
 * local-format numbers (024..., 233...).
 */
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

/**
 * Send one message to one or more recipients through MNotify's quick-SMS API.
 * Includes rate-limiting (TPS) throttling, opt-out filtering, and compliance footers.
 */
export async function sendSms(recipients: string[], message: string): Promise<SmsResult> {
  // @ts-expect-error: Deno global
  const apiKey: string | undefined = Deno.env.get('MNOTIFY_API_KEY')
  // @ts-expect-error: Deno global
  const sender: string = Deno.env.get('MNOTIFY_SENDER_ID') ?? 'THEBASE'

  if (!apiKey) {
    console.warn('[SMS] MNOTIFY_API_KEY not set — skipping send to', recipients.length, 'numbers')
    return { ok: false, detail: 'MNOTIFY_API_KEY not set' }
  }

  // 1. Normalize and clean the recipient list
  const normalizedRecipients = recipients.map(normalizeGhanaPhone).filter((n) => n.length >= 11)
  if (normalizedRecipients.length === 0) {
    return { ok: false, detail: 'no valid recipients' }
  }

  // 2. Fetch Opt-Out records from DB to filter recipients
  // @ts-expect-error: Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  // @ts-expect-error: Deno global
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

  // Filter out any phone numbers present in the opt-out list
  const activeRecipients = normalizedRecipients.filter((phone) => {
    const rawDigits = phone.replace('+', '')
    return !optOutSet.has(rawDigits)
  })

  if (activeRecipients.length === 0) {
    console.log('[SMS] All recipients opted out of SMS dispatches.')
    return { ok: true, detail: 'all recipients opted out' }
  }

  // 3. Compliance check: Append opt-out footer to non-transactional messages
  const isTransactional = /otp|verification|temp password|login credentials/i.test(message)
  const finalMessage = isTransactional
    ? message
    : `${message}\n\nTo opt out: thebasemovement.info/sms-optout`

  // 4. Batch dispatches to respect gateway TPS (Transactions Per Second) rate-limiting
  const BATCH_SIZE = 50
  let totalDispatched = 0
  let lastResponseText = ''

  try {
    for (let i = 0; i < activeRecipients.length; i += BATCH_SIZE) {
      if (i > 0) {
        // Sleep 1 second between batches to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const batch = activeRecipients.slice(i, i + BATCH_SIZE)
      const res = await fetch(
        `https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            recipient: batch,
            sender,
            message: finalMessage,
            is_schedule: 'false',
            schedule_date: '',
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

    const accepted = lastResponseText.includes('"success"')
    if (!accepted) {
      console.error('[SMS] MNotify rejected final batch:', lastResponseText)
    }

    return {
      ok: accepted,
      detail: `Successfully dispatched ${totalDispatched} out of ${recipients.length} recipients (Filtered opt-outs: ${recipients.length - activeRecipients.length}). Detail: ${lastResponseText}`,
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[SMS] MNotify dispatch error:', detail)
    return { ok: false, detail }
  }
}
