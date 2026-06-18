// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { json, requireAuthorizedAdmin, type AdminAuthRow } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type FinanceAction = 'review' | 'acknowledge'
type ReviewStatus = 'Approved' | 'Rejected'
type ActingTier = 1 | 2 | 3
type TierName = 'Bottom' | 'Middle' | 'Top'
type ApprovalAction = 'Approve' | 'Deny' | 'Acknowledge'

interface BiometricProof {
  deviceId: string
  fingerprintHash: string
}

interface FinanceReviewPayload {
  action: FinanceAction
  requestId: string
  status?: ReviewStatus
  comment?: string
  biometricProof?: BiometricProof | null
}

function getActingTier(role: string | null | undefined): ActingTier | null {
  if (role === 'FINANCE_OFFICER') return 1
  if (role === 'EXECUTIVE' || role === 'ORGANIZER') return 2
  if (role === 'SUPER_ADMIN' || role === 'FOUNDER' || role === 'ADMIN') return 3
  return null
}

function authorizeFinanceReviewer(admin: AdminAuthRow): boolean {
  return getActingTier(admin.role) !== null
}

function tierNameFromNumber(n: number): TierName {
  if (n === 1) return 'Bottom'
  if (n === 2) return 'Middle'
  return 'Top'
}

function processFundRequest(
  tier: TierName,
  amount: number,
  action: ApprovalAction,
  tier1Max = 50,
  tier2Max = 100
) {
  if (tier === 'Bottom') {
    if (amount >= 0 && amount <= tier1Max && (action === 'Approve' || action === 'Deny')) {
      return { permitted: true, passUp: false, message: 'Processed at bottom tier' }
    }
    if (amount > tier1Max && action === 'Acknowledge') {
      return { permitted: true, passUp: true, message: 'Pass to the next level' }
    }
    return { permitted: false, passUp: false, message: 'Not qualified for this action' }
  }

  if (tier === 'Middle') {
    if (
      amount >= tier1Max + 1 &&
      amount <= tier2Max &&
      (action === 'Approve' || action === 'Deny')
    ) {
      return { permitted: true, passUp: false, message: 'Processed at middle tier' }
    }
    if (action === 'Acknowledge' && amount >= tier1Max + 1) {
      return { permitted: true, passUp: true, message: 'Pass to the next level' }
    }
    return { permitted: false, passUp: false, message: 'Top level approval is required' }
  }

  if (tier === 'Top' && (action === 'Approve' || action === 'Deny')) {
    return { permitted: true, passUp: false, message: 'Processed at top tier' }
  }

  return { permitted: false, passUp: false, message: 'Invalid request' }
}

async function requireRecentBiometricProof(
  supabaseAdmin: ReturnType<typeof createClient>,
  adminId: string,
  proof: BiometricProof | null | undefined
) {
  if (!proof?.deviceId || !proof.fingerprintHash) {
    throw new Error('Fresh biometric verification is required.')
  }

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from('admin_device_activity')
    .select('id, created_at, metadata, admin_devices!inner(id, admin_id, status)')
    .eq('device_id', proof.deviceId)
    .eq('action', 'step_up_passed')
    .eq('admin_devices.admin_id', adminId)
    .eq('admin_devices.status', 'active')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw new Error('Could not verify biometric approval.')

  const matching = (data ?? []).find((row: { metadata?: { fingerprint_hash?: string } | null }) => {
    return row.metadata?.fingerprint_hash === proof.fingerprintHash
  })

  if (!matching) {
    throw new Error('Fresh biometric verification is required.')
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseAdmin = createClient(supabaseUrl, serviceKey)

  const authz = await requireAuthorizedAdmin(req, supabaseAdmin, authorizeFinanceReviewer)
  if (!authz.ok || !authz.admin || !authz.callerUserId) {
    const response = authz.ok ? json({ error: 'Not authorized.' }, 403) : authz.response
    return new Response(await response.text(), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = (await req.json()) as FinanceReviewPayload
    if (!payload.requestId || !payload.action) {
      return json({ error: 'requestId and action are required.' }, 400, corsHeaders)
    }

    const actingTier = getActingTier(authz.admin.role)
    if (!actingTier) {
      return json({ error: 'Not authorized.' }, 403, corsHeaders)
    }

    await requireRecentBiometricProof(supabaseAdmin, authz.callerUserId, payload.biometricProof)

    const { data: settingsRows, error: settingsError } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', ['finance_tier1_max', 'finance_tier2_max'])
    if (settingsError) throw new Error(settingsError.message)

    const settings = Object.fromEntries((settingsRows ?? []).map((row) => [row.key, row.value]))
    const tier1Max = Number(settings.finance_tier1_max ?? 50)
    const tier2Max = Number(settings.finance_tier2_max ?? 100)

    const { data: current, error: currentError } = await supabaseAdmin
      .from('finance_requests')
      .select('id, amount, status, approval_tier')
      .eq('id', payload.requestId)
      .eq('status', 'Pending')
      .maybeSingle()

    if (currentError || !current) {
      return json({ error: 'Request is no longer available for review.' }, 409, corsHeaders)
    }

    if (Number(current.approval_tier) !== actingTier) {
      return json(
        { error: 'This request is not assigned to your approval tier.' },
        403,
        corsHeaders
      )
    }

    const engineAction: ApprovalAction =
      payload.action === 'acknowledge'
        ? 'Acknowledge'
        : payload.status === 'Approved'
          ? 'Approve'
          : 'Deny'

    if (payload.action === 'review' && (!payload.status || !payload.comment?.trim())) {
      return json(
        { error: 'status and comment are required for finance review.' },
        400,
        corsHeaders
      )
    }

    const result = processFundRequest(
      tierNameFromNumber(actingTier),
      Number(current.amount),
      engineAction,
      tier1Max,
      tier2Max
    )

    if (!result.permitted) {
      return json({ error: result.message }, 403, corsHeaders)
    }

    if (payload.action === 'acknowledge') {
      const { error } = await supabaseAdmin
        .from('finance_requests')
        .update({ approval_tier: Number(current.approval_tier) + 1 })
        .eq('id', payload.requestId)
        .eq('status', 'Pending')
      if (error) throw new Error(error.message)
      return json({ success: true, outcome: 'acknowledged' }, 200, corsHeaders)
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('finance_requests')
      .update({
        status: payload.status,
        officer_comment: payload.comment?.trim() ?? '',
        reviewed_by: authz.callerUserId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', payload.requestId)
      .eq('status', 'Pending')
      .select('id')

    if (updateError) throw new Error(updateError.message)
    if (!updated?.length) {
      return json({ error: 'Request is no longer available for review.' }, 409, corsHeaders)
    }

    return json({ success: true, outcome: 'reviewed' }, 200, corsHeaders)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return json({ error: message }, 400, corsHeaders)
  }
})
