/**
 * monthly-dues-recurring
 * ─────────────────────────────────────────────────────────────
 * Authenticated member lifecycle for Hubtel Recurring Invoice:
 *   action: 'create'  — create the provider invoice for a pending enrollment
 *   action: 'verify'  — reconcile provider state; activate on confirmation
 *   action: 'cancel'  — cancel at the provider; opt out only on success
 *
 * Credentials come from the same env vars as checkout. No provider error
 * ever activates an enrollment or completes a cancellation.
 */

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { buildSignedHubtelCallbackUrl } from '../hubtel-payment-shared/callback-auth.ts'
import { sendMonthlyDuesDiscordAlert } from '../_shared/monthly-dues-discord.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

export interface HubtelRecurringConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  accountNumber: string
}

export function buildHubtelAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`
}

export function buildRecurringInvoicePayload(opts: {
  amountGhs: number
  dueDay: number
  memberName: string
  memberPhone: string
  enrollmentId: string
  callbackUrl: string
  accountNumber: string
}) {
  return {
    totalAmount: Number(opts.amountGhs.toFixed(2)),
    currency: 'GHS',
    description: 'The Base Movement voluntary monthly dues',
    clientReference: opts.enrollmentId,
    customerName: opts.memberName,
    customerPhoneNumber: opts.memberPhone,
    merchantAccountNumber: opts.accountNumber,
    callbackUrl: opts.callbackUrl,
    recurring: {
      frequency: 'monthly',
      dayOfMonth: opts.dueDay,
    },
  }
}

/**
 * Fetch-injected Hubtel client. Bounded parsing: non-JSON bodies become
 * { raw } payloads; provider errors are preserved verbatim for diagnostics.
 */
export async function callHubtelRecurring(
  fetchImpl: (url: string, init?: RequestInit) => Promise<Response>,
  config: HubtelRecurringConfig,
  path: string,
  method: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; payload: Record<string, unknown> }> {
  const res = await fetchImpl(`${config.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: buildHubtelAuthHeader(config.clientId, config.clientSecret),
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await res.text()
  let payload: Record<string, unknown> = {}
  try {
    payload = JSON.parse(text.slice(0, 100_000)) as Record<string, unknown>
  } catch {
    payload = { raw: text.slice(0, 2_000) }
  }
  return { ok: res.ok, status: res.status, payload }
}

function dataOf(payload: Record<string, unknown>): Record<string, unknown> {
  const data = payload.Data ?? payload.data
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

function isSuccessCode(payload: Record<string, unknown>): boolean {
  const code = payload.ResponseCode ?? payload.responseCode
  return code === '0000' || code === 0 || code === '0'
}

export function mapRecurringCreateResponse(payload: Record<string, unknown>): {
  invoiceId: string | null
} {
  if (!isSuccessCode(payload)) return { invoiceId: null }
  const data = dataOf(payload)
  const id =
    data.recurringInvoiceId ??
    data.RecurringInvoiceId ??
    data.invoiceId ??
    data.InvoiceId ??
    data.id
  return { invoiceId: typeof id === 'string' && id.trim() ? id : null }
}

export function mapRecurringVerifyResponse(payload: Record<string, unknown>): {
  active: boolean
  providerStatus: string | null
} {
  const data = dataOf(payload)
  const status = data.status ?? data.Status
  const providerStatus = typeof status === 'string' ? status : null
  return {
    active: isSuccessCode(payload) && providerStatus?.toLowerCase() === 'active',
    providerStatus,
  }
}

export function mapRecurringCancelResponse(payload: Record<string, unknown>): {
  cancelled: boolean
} {
  return { cancelled: isSuccessCode(payload) }
}

/** A failed provider cancellation must stay pending and retryable. */
export function nextStatusAfterCancel(cancelled: boolean): 'opted_out' | 'cancellation_pending' {
  return cancelled ? 'opted_out' : 'cancellation_pending'
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// @ts-expect-error: Deno global
if (import.meta.main) {
  // @ts-expect-error: Deno global
  const env = (name: string) => Deno.env.get(name)
  const requiredEnv = (name: string) => {
    const value = env(name)
    if (!value) throw new Error(`${name} is not configured`)
    return value
  }

  // @ts-expect-error: Deno global
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    try {
      const supabaseAdmin = createClient(
        requiredEnv('SUPABASE_URL'),
        requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
      )

      // Bind every action to the authenticated member.
      const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
      if (!jwt) return json({ error: 'Not authenticated.' }, 401)
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(jwt)
      if (userError || !user) return json({ error: 'Not authenticated.' }, 401)

      const body = (await req.json()) as { action?: string }
      const action = body.action
      if (!action || !['create', 'verify', 'cancel'].includes(action)) {
        return json({ error: 'Invalid action' }, 400)
      }

      const config: HubtelRecurringConfig = {
        baseUrl: env('HUBTEL_RECURRING_BASE_URL') ?? 'https://rmp.hubtel.com/api',
        clientId: requiredEnv('HUBTEL_API_ID'),
        clientSecret: requiredEnv('HUBTEL_API_KEY'),
        accountNumber: requiredEnv('HUBTEL_ACCOUNT_NUMBER'),
      }

      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('monthly_dues_enrollments')
        .select('id, member_id, status, payment_mode, hubtel_invoice_id')
        .eq('member_id', user.id)
        .maybeSingle()
      if (enrollmentError) throw enrollmentError
      if (!enrollment) return json({ error: 'No dues enrollment found.' }, 404)

      if (action === 'create') {
        const { data: settings } = await supabaseAdmin
          .from('monthly_dues_settings')
          .select('amount_ghs, due_day, recurring_enrollment_enabled')
          .eq('is_active', true)
          .maybeSingle()
        if (!settings?.recurring_enrollment_enabled) {
          return json({ error: 'Recurring enrollment is not available yet.' }, 400)
        }
        if (enrollment.payment_mode !== 'recurring' || enrollment.status !== 'pending_activation') {
          return json({ error: 'Enrollment is not awaiting recurring activation.' }, 400)
        }
        if (enrollment.hubtel_invoice_id) {
          return json({ status: enrollment.status, invoiceId: enrollment.hubtel_invoice_id })
        }

        const { data: member } = await supabaseAdmin
          .from('users')
          .select('full_name, phone_number')
          .eq('id', user.id)
          .maybeSingle()
        if (!member?.phone_number) {
          return json({ error: 'A phone number is required for recurring payments.' }, 400)
        }

        const callbackUrl = await buildSignedHubtelCallbackUrl(
          `${requiredEnv('SUPABASE_URL')}/functions/v1/monthly-dues-recurring-callback`,
          enrollment.id
        )
        const payload = buildRecurringInvoicePayload({
          amountGhs: Number(settings.amount_ghs),
          dueDay: Number(settings.due_day),
          memberName: member.full_name ?? 'Member',
          memberPhone: member.phone_number,
          enrollmentId: enrollment.id,
          callbackUrl,
          accountNumber: config.accountNumber,
        })

        const result = await callHubtelRecurring(fetch, config, '/invoices', 'POST', payload)
        const { invoiceId } = mapRecurringCreateResponse(result.payload)
        if (!result.ok || !invoiceId) {
          console.error('[DUES-RECURRING] create failed', result.status, result.payload)
          return json({ error: 'Hubtel recurring invoice creation failed.' }, 502)
        }

        // Identifiers are saved only after a valid provider response;
        // activation still waits for provider confirmation.
        await supabaseAdmin
          .from('monthly_dues_enrollments')
          .update({ hubtel_invoice_id: invoiceId })
          .eq('id', enrollment.id)

        return json({ status: 'pending_activation', invoiceId })
      }

      if (!enrollment.hubtel_invoice_id) {
        return json({ error: 'No recurring invoice to manage.' }, 400)
      }

      if (action === 'verify') {
        const result = await callHubtelRecurring(
          fetch,
          config,
          `/invoices/${encodeURIComponent(enrollment.hubtel_invoice_id)}`,
          'GET'
        )
        const verdict = mapRecurringVerifyResponse(result.payload)
        if (verdict.active && enrollment.status === 'pending_activation') {
          await supabaseAdmin
            .from('monthly_dues_enrollments')
            .update({ status: 'active' })
            .eq('id', enrollment.id)
        }
        return json({
          status: verdict.active ? 'active' : enrollment.status,
          providerStatus: verdict.providerStatus,
        })
      }

      // action === 'cancel'
      if (!['cancellation_pending', 'active', 'pending_activation'].includes(enrollment.status)) {
        return json({ status: enrollment.status })
      }
      const result = await callHubtelRecurring(
        fetch,
        config,
        `/invoices/${encodeURIComponent(enrollment.hubtel_invoice_id)}/cancel`,
        'POST'
      )
      const { cancelled } = mapRecurringCancelResponse(result.payload)
      const nextStatus = nextStatusAfterCancel(cancelled)

      if (cancelled) {
        await supabaseAdmin
          .from('monthly_dues_enrollments')
          .update({
            status: 'opted_out',
            provider_cancelled_at: new Date().toISOString(),
            opted_out_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id)
        await sendMonthlyDuesDiscordAlert({
          type: 'recurring_cancelled',
          reference: enrollment.id,
        })
      } else {
        // Keep cancellation pending so the member can retry safely.
        await supabaseAdmin
          .from('monthly_dues_enrollments')
          .update({ status: 'cancellation_pending' })
          .eq('id', enrollment.id)
        console.error('[DUES-RECURRING] cancel failed', result.status, result.payload)
      }

      return json({ status: nextStatus, retryable: !cancelled })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[DUES-RECURRING-ERROR] ${message}`)
      return json({ error: message }, 400)
    }
  })
}
