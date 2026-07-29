// Messaging credit for the IT System Monitor.
//
// Bulk sends must never be started blind, so IT needs the SMS balance visible
// before a campaign rather than discovering it from a failed run.
//
// Called from the browser by a signed-in admin, so it authenticates the admin's
// own JWT rather than a service-role key.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canViewAuditLogs, json, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmsBalancePayload {
  balance: number | null
  ok: boolean
  detail: string
}

async function fetchSmsBalance(): Promise<SmsBalancePayload> {
  // @ts-expect-error: Deno global
  const apiKey: string | undefined = Deno.env.get('MNOTIFY_API_KEY')
  if (!apiKey) return { ok: false, balance: null, detail: 'MNOTIFY_API_KEY not set' }
  try {
    const res = await fetch(
      `https://api.mnotify.com/api/balance/sms?key=${encodeURIComponent(apiKey)}`
    )
    const text = await res.text()
    if (!res.ok) return { ok: false, balance: null, detail: `HTTP ${res.status}` }
    const parsed = JSON.parse(text)
    const raw = parsed?.balance ?? parsed?.sms_balance ?? parsed?.data?.balance
    const balance = raw === null || raw === undefined ? null : Number(raw)
    if (balance === null || Number.isNaN(balance)) {
      return { ok: false, balance: null, detail: 'no balance field in response' }
    }
    return { ok: true, balance, detail: 'ok' }
  } catch (err: unknown) {
    return { ok: false, balance: null, detail: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Resend exposes no balance or quota endpoint — an email plan is a monthly
 * allowance, not a credit pool — so "remaining" is not knowable from the API.
 * Report what IS knowable: how many emails the account has sent this month.
 */
async function fetchEmailsSentThisMonth(): Promise<{ ok: boolean; sent: number | null }> {
  // @ts-expect-error: Deno global
  const key: string | undefined = Deno.env.get('RESEND_API_KEY')
  if (!key) return { ok: false, sent: null }
  try {
    const res = await fetch('https://api.resend.com/emails?limit=100', {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return { ok: false, sent: null }
    const body = await res.json()
    const rows: { created_at?: string }[] = body?.data ?? []
    const monthStart = new Date()
    monthStart.setUTCDate(1)
    monthStart.setUTCHours(0, 0, 0, 0)
    const sent = rows.filter((r) => r.created_at && new Date(r.created_at) >= monthStart).length
    return { ok: true, sent }
  } catch {
    return { ok: false, sent: null }
  }
}

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders)
  }

  try {
    // @ts-expect-error: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-expect-error: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, serviceKey)

    const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canViewAuditLogs, {
      allowServiceRole: true,
      serviceRoleKey: serviceKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [sms, email] = await Promise.all([fetchSmsBalance(), fetchEmailsSentThisMonth()])

    return json(
      {
        sms_balance: sms.balance,
        sms_ok: sms.ok,
        sms_detail: sms.detail,
        emails_sent_this_month: email.sent,
        email_ok: email.ok,
        // Stated explicitly so the UI never implies a remaining figure exists.
        email_quota_available: false,
      },
      200,
      corsHeaders
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[GET-MESSAGING-BALANCE] ${message}`)
    return json({ error: message }, 500, corsHeaders)
  }
})
