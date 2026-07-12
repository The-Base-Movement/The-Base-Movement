/**
 * export-monthly-dues
 * ─────────────────────────────────────────────────────────────
 * Server-authorized dues exports.
 *   scope 'member'  — the caller's own dues rows (JWT-bound)
 *   scope 'finance' — filtered rows with minimal member identity;
 *                     requires MANAGE_DONATIONS:DONATIONS
 * format 'csv' returns a complete CSV file; 'json' returns the same
 * whitelisted rows for client-side PDF rendering. Columns are a strict
 * whitelist — national id, notes, and contact details can never appear.
 * Failures return a JSON error, never a partial file.
 */

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageDonations, type AdminAuthRow } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

export type ExportScope = 'member' | 'finance'

export interface ExportPaymentRow {
  id: string
  dues_month: string
  amount_ghs: number | string
  display_amount: number | string
  display_currency: string
  payment_mode: string
  status: string
  receipt_number?: string | null
  users?: { full_name?: string | null; registration_number?: string | null } | null
}

/** Member scope always binds to the caller; finance scope needs permission. */
export function resolveExportScope(
  callerId: string,
  isFinance: boolean,
  requestedScope: string
): { ok: true; scope: ExportScope; memberId: string | null } | { ok: false; error: string } {
  if (requestedScope === 'member') {
    return { ok: true, scope: 'member', memberId: callerId }
  }
  if (requestedScope === 'finance') {
    if (!isFinance) return { ok: false, error: 'Not authorized for finance exports' }
    return { ok: true, scope: 'finance', memberId: null }
  }
  return { ok: false, error: 'Unknown export scope' }
}

/** Neutralizes spreadsheet formula injection. */
export function sanitizeCsvCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

function modeLabel(mode: string): string {
  if (mode === 'offline') return 'Offline'
  if (mode === 'recurring_hubtel') return 'Recurring'
  return 'Hubtel'
}

/**
 * Maps a payment onto whitelisted export columns. This is the only place
 * export data is produced — anything not named here cannot leak.
 */
export function toExportRow(payment: ExportPaymentRow, scope: ExportScope): Record<string, string> {
  const row: Record<string, string> = {
    Month: payment.dues_month.slice(0, 7),
    Type: 'Monthly Dues',
    'Local Amount': Number(payment.display_amount).toFixed(2),
    Currency: payment.display_currency,
    'GHS Amount': Number(payment.amount_ghs).toFixed(2),
    Status: payment.status,
    Method: modeLabel(payment.payment_mode),
    Reference: payment.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
    Receipt: payment.receipt_number ?? '',
  }
  if (scope === 'finance') {
    const member = payment.users
    row['Member'] = member?.full_name ?? ''
    row['Reg No'] = member?.registration_number ?? ''
  }
  return row
}

const MEMBER_COLUMNS = [
  'Month',
  'Type',
  'Local Amount',
  'Currency',
  'GHS Amount',
  'Status',
  'Method',
  'Reference',
  'Receipt',
]
const FINANCE_COLUMNS = ['Member', 'Reg No', ...MEMBER_COLUMNS]

/** Builds the complete CSV (stable header, quoted + sanitized cells). */
export function buildDuesCsv(payments: ExportPaymentRow[], scope: ExportScope): string {
  const columns = scope === 'finance' ? FINANCE_COLUMNS : MEMBER_COLUMNS
  const lines = [
    columns,
    ...payments.map((p) => {
      const row = toExportRow(p, scope)
      return columns.map((c) => row[c] ?? '')
    }),
  ]
  return lines
    .map((cells) =>
      cells.map((cell) => `"${sanitizeCsvCell(String(cell)).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n')
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
  const env = (name: string) => Deno.env.get(name) ?? ''

  // @ts-expect-error: Deno global
  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

    try {
      const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

      const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
      if (!jwt) return json({ error: 'Not authenticated.' }, 401)
      const {
        data: { user },
        error: userError,
      } = await supabaseAdmin.auth.getUser(jwt)
      if (userError || !user) return json({ error: 'Not authenticated.' }, 401)

      const body = (await req.json()) as {
        scope?: string
        format?: string
        filters?: { status?: string; duesMonth?: string; paymentMode?: string }
      }

      const { data: adminRow } = await supabaseAdmin
        .from('admins')
        .select('id, role, permissions')
        .eq('id', user.id)
        .maybeSingle()
      const isFinance = canManageDonations(adminRow as AdminAuthRow | null)

      const scopeResult = resolveExportScope(user.id, isFinance, body.scope ?? 'member')
      if (!scopeResult.ok) return json({ error: scopeResult.error }, 403)

      // Whitelisted select only — national_id and contact fields are never
      // part of this query.
      let query = supabaseAdmin
        .from('monthly_dues_payments')
        .select(
          `id, dues_month, amount_ghs, display_amount, display_currency, payment_mode, status, receipt_number${
            scopeResult.scope === 'finance' ? ', users(full_name, registration_number)' : ''
          }`
        )
        .order('dues_month', { ascending: false })
        .limit(2000)

      if (scopeResult.scope === 'member') {
        query = query.eq('member_id', scopeResult.memberId)
      } else {
        const filters = body.filters ?? {}
        if (filters.status) query = query.eq('status', filters.status)
        if (filters.duesMonth) query = query.eq('dues_month', filters.duesMonth)
        if (filters.paymentMode) query = query.eq('payment_mode', filters.paymentMode)
      }

      const { data, error } = await query
      if (error) throw error
      const rows = (data ?? []) as ExportPaymentRow[]

      if ((body.format ?? 'csv') === 'json') {
        return json({ rows: rows.map((r) => toExportRow(r, scopeResult.scope)) })
      }

      const csv = buildDuesCsv(rows, scopeResult.scope)
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="monthly-dues-${scopeResult.scope}.csv"`,
        },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[EXPORT-MONTHLY-DUES-ERROR] ${message}`)
      return json({ error: 'Export failed' }, 500)
    }
  })
}
