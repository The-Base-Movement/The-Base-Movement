/**
 * Finance Discord alerts for the monthly dues system.
 *
 * Reads only MONTHLY_DUES_DISCORD_WEBHOOK_URL (server secret; never stored in
 * the database or exposed to clients). Messages are built by whitelist — only
 * the operational fields below are ever serialized, so member PII, consent
 * payloads, provider responses, and secrets can never leak. Delivery is
 * strictly non-blocking: failures return { sent: false }, never throw.
 */

export type MonthlyDuesDiscordEvent =
  | {
      type: 'payment_success'
      reference: string
      month?: string
      amountGhs?: number
      currency?: string
      mode?: 'manual' | 'recurring' | 'offline'
    }
  | { type: 'recurring_activated'; reference: string }
  | { type: 'recurring_cancelled'; reference: string }
  | { type: 'callback_anomaly'; reference: string; detail: string }
  | { type: 'reminder_summary'; sent: number; failed: number; skipped: number }
  | { type: 'reconciliation'; reference: string; detail: string }

interface DiscordField {
  name: string
  value: string
  inline?: boolean
}

/** Operational short reference — never the full identifier. */
function shortRef(reference: string): string {
  return reference.replace(/-/g, '').slice(0, 8).toUpperCase()
}

const TITLES: Record<MonthlyDuesDiscordEvent['type'], string> = {
  payment_success: '💰 Monthly Dues Paid',
  recurring_activated: '🔁 Recurring Dues Activated',
  recurring_cancelled: '🛑 Recurring Dues Cancelled',
  callback_anomaly: '🔴 Dues Callback Anomaly',
  reminder_summary: '📬 Dues Reminder Summary',
  reconciliation: '🧾 Dues Reconciliation Review',
}

const COLORS: Record<MonthlyDuesDiscordEvent['type'], number> = {
  payment_success: 0xdaa520,
  recurring_activated: 0x006b3f,
  recurring_cancelled: 0x6f7a71,
  callback_anomaly: 0xce1126,
  reminder_summary: 0x006b3f,
  reconciliation: 0xce1126,
}

/**
 * Builds the redacted Discord message. Construction is a strict whitelist:
 * every field is taken from a known event property; nothing else on the
 * event object is ever read or serialized.
 */
export function buildMonthlyDuesDiscordMessage(
  event: MonthlyDuesDiscordEvent,
  adminLink: string | null
) {
  const fields: DiscordField[] = []

  switch (event.type) {
    case 'payment_success':
      fields.push({ name: 'Reference', value: shortRef(event.reference), inline: true })
      if (event.month) fields.push({ name: 'Month', value: event.month, inline: true })
      if (typeof event.amountGhs === 'number') {
        fields.push({
          name: 'Amount',
          value: `${event.currency ?? 'GHS'} ${event.amountGhs.toFixed(2)}`,
          inline: true,
        })
      }
      if (event.mode) fields.push({ name: 'Mode', value: event.mode, inline: true })
      break
    case 'recurring_activated':
    case 'recurring_cancelled':
      fields.push({ name: 'Reference', value: shortRef(event.reference), inline: true })
      break
    case 'callback_anomaly':
    case 'reconciliation':
      fields.push({ name: 'Reference', value: shortRef(event.reference), inline: true })
      fields.push({ name: 'Detail', value: event.detail.slice(0, 300) })
      break
    case 'reminder_summary':
      fields.push({ name: 'Sent', value: String(event.sent), inline: true })
      fields.push({ name: 'Failed', value: String(event.failed), inline: true })
      fields.push({ name: 'Skipped', value: String(event.skipped), inline: true })
      break
  }

  if (adminLink) fields.push({ name: 'Finance view', value: adminLink })

  return {
    embeds: [
      {
        title: TITLES[event.type],
        color: COLORS[event.type],
        fields,
        footer: { text: 'Monthly dues' },
      },
    ],
  }
}

export interface SendMonthlyDuesDiscordOptions {
  webhookUrl?: string
  adminLink?: string
  fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>
}

/**
 * Sends a finance alert. Returns { sent: false } when the webhook secret is
 * absent or Discord fails — callers in payment-state code never need to
 * guard against a throw.
 */
export async function sendMonthlyDuesDiscordAlert(
  event: MonthlyDuesDiscordEvent,
  options: SendMonthlyDuesDiscordOptions = {}
): Promise<{ sent: boolean }> {
  try {
    const webhookUrl =
      options.webhookUrl !== undefined
        ? options.webhookUrl
        : // @ts-expect-error: Deno global
          (Deno.env.get('MONTHLY_DUES_DISCORD_WEBHOOK_URL') ?? '')
    if (!webhookUrl) return { sent: false }

    const fetchImpl = options.fetchImpl ?? fetch
    const message = buildMonthlyDuesDiscordMessage(event, options.adminLink ?? null)
    const res = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    return { sent: res.ok }
  } catch (err) {
    console.error('[MONTHLY-DUES-DISCORD] delivery failed:', err)
    return { sent: false }
  }
}
