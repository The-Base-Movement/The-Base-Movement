/**
 * monthly-dues-recurring-callback
 * ─────────────────────────────────────────────────────────────
 * Hubtel recurring-invoice charge callback. The signed reference is the
 * enrollment id. A successful charge:
 *   1. activates a pending enrollment (provider confirmation), then
 *   2. ensures the obligation for the charge month exists, then
 *   3. transitions it atomically via apply_hubtel_monthly_dues_callback.
 * Duplicate callbacks are acknowledged without reapplying; amount
 * mismatches are alerted and never marked paid.
 */

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { verifyHubtelCallbackSignature } from '../hubtel-payment-shared/callback-auth.ts'
import { sendMonthlyDuesDiscordAlert } from '../_shared/monthly-dues-discord.ts'

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

function dataOf(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.Data ?? payload.data
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

/** Signed-reference authorization, delegated to the shared checkout scheme. */
export function verifyRecurringCallbackRequest(
  requestUrl: string,
  bodyReference: string,
  secret?: string
) {
  return verifyHubtelCallbackSignature(requestUrl, bodyReference, secret)
}

/** Maps a recurring charge callback onto a normalized result. */
export function mapRecurringCallback(payload: Record<string, unknown>): {
  success: boolean
  transactionId: string | null
  amountGhs: number | null
} {
  const code = payload.ResponseCode ?? payload.responseCode
  const status = payload.Status ?? payload.status
  const success =
    code === '0000' ||
    code === 0 ||
    (typeof status === 'string' && ['success', 'paid', 'completed'].includes(status.toLowerCase()))
  if (!success) return { success: false, transactionId: null, amountGhs: null }

  const data = dataOf(payload)
  const txn =
    data.TransactionId ?? data.transactionId ?? payload.TransactionId ?? payload.transactionId
  const amountRaw = data.Amount ?? data.amount ?? payload.Amount ?? payload.amount
  const amount = Number(amountRaw)
  return {
    success: true,
    transactionId: typeof txn === 'string' && txn.trim() ? txn : null,
    amountGhs: amountRaw !== undefined && Number.isFinite(amount) && amount > 0 ? amount : null,
  }
}

export interface DuesCallbackRpcResult {
  matched: boolean
  already_final: boolean
  amount_mismatch?: boolean
  status?: string
}

/** Same decision semantics as the manual checkout callback. */
export function recurringChargeDecision(result: DuesCallbackRpcResult | null) {
  if (!result || !result.matched) return null
  if (result.already_final) return { handled: true, already: true, alert: false }
  if (result.amount_mismatch) return { handled: true, already: false, alert: true }
  return { handled: true, already: false, alert: false }
}

// @ts-expect-error: Deno global
if (import.meta.main) {
  // @ts-expect-error: Deno global
  const env = (name: string) => Deno.env.get(name) ?? ''

  async function sendAlert(title: string, description: string) {
    try {
      const url = env('SUPABASE_URL')
      const key = env('SUPABASE_SERVICE_ROLE_KEY')
      await fetch(`${url}/functions/v1/discord-notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          channel: 'alerts',
          embeds: [
            {
              title: `🔴 ${title}`,
              description,
              color: 0xce1126,
              footer: { text: 'Monthly dues recurring callback' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })
    } catch (e) {
      console.error('[DUES-RECURRING-CALLBACK] alert dispatch failed:', e)
    }
  }

  // @ts-expect-error: Deno global
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    try {
      const payload = (await req.json()) as Record<string, unknown>
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Invalid callback payload')
      }

      const data = dataOf(payload)
      const referenceRaw =
        payload.ClientReference ??
        payload.clientReference ??
        data.ClientReference ??
        data.clientReference
      const reference = typeof referenceRaw === 'string' ? referenceRaw.trim() : ''
      if (!reference) throw new Error('Missing recurring callback reference')

      const auth = await verifyRecurringCallbackRequest(req.url, reference)
      if (!auth.ok) throw new Error(auth.reason)

      const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('monthly_dues_enrollments')
        .select('id, member_id, status')
        .eq('id', reference)
        .maybeSingle()
      if (enrollmentError) throw enrollmentError
      if (!enrollment) {
        await sendAlert(
          'Orphaned recurring dues callback',
          `A recurring charge callback matched no enrollment (reference ${reference}). Investigate.`
        )
        await sendMonthlyDuesDiscordAlert({
          type: 'callback_anomaly',
          reference,
          detail: 'Recurring charge callback matched no enrollment.',
        })
        return json({ error: 'Unknown enrollment reference' }, 404)
      }

      const charge = mapRecurringCallback(payload)

      // Provider confirmation activates a pending enrollment.
      if (charge.success && enrollment.status === 'pending_activation') {
        await supabaseAdmin
          .from('monthly_dues_enrollments')
          .update({ status: 'active' })
          .eq('id', enrollment.id)
        await sendMonthlyDuesDiscordAlert({ type: 'recurring_activated', reference })
      }

      // Map the charge onto the current dues month idempotently.
      const month = `${new Date().toISOString().slice(0, 7)}-01`
      const { data: obligation, error: obligationError } = await supabaseAdmin.rpc(
        'ensure_monthly_dues_obligation',
        {
          p_member_id: enrollment.member_id,
          p_month: month,
          p_display_currency: null,
          p_exchange_rate_to_ghs: null,
        }
      )
      if (obligationError) throw obligationError

      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        'apply_hubtel_monthly_dues_callback',
        {
          p_payment_id: obligation.payment_id,
          p_paid: charge.success,
          p_transaction_id: charge.transactionId,
          p_amount_ghs: charge.amountGhs,
        }
      )
      if (rpcError) throw rpcError

      const decision = recurringChargeDecision(rpcResult)
      if (decision?.already) {
        return json({ success: true, paid: charge.success, reference, already: true })
      }
      if (decision?.alert) {
        await sendAlert(
          'Recurring dues amount mismatch',
          'A recurring charge callback reported an amount that does not match the obligation. The payment was NOT marked paid — reconcile manually.'
        )
        await sendMonthlyDuesDiscordAlert({
          type: 'callback_anomaly',
          reference,
          detail: 'Recurring charge amount did not match the obligation; not marked paid.',
        })
        return json({ success: false, reference, mismatch: true })
      }

      if (charge.success && decision?.handled) {
        await sendMonthlyDuesDiscordAlert({
          type: 'payment_success',
          reference,
          month,
          amountGhs: charge.amountGhs ?? undefined,
          currency: 'GHS',
          mode: 'recurring',
        })
      }

      return json({ success: true, paid: charge.success, reference })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[DUES-RECURRING-CALLBACK-ERROR] ${message}`)
      await sendAlert('Recurring dues callback processing error', message)
      return json({ error: message }, 400)
    }
  })
}
