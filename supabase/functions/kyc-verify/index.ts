import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

// Government-data identity verification via Smile ID (Electoral Commission /
// NIA). Scaffolded end-to-end but gated: until the SMILE_ID_* secrets are set
// (access still being acquired) it returns a clear "awaiting access" state.
//
// When credentials land: confirm the endpoint + id_type against your specific
// Smile ID product docs (Enhanced KYC / ID Verification for Ghana), set the
// SMILE_ID_* secrets, and the live call below activates automatically.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Smile ID production base; override per environment/product via SMILE_ID_BASE_URL.
const DEFAULT_SMILE_BASE = 'https://api.smileidentity.com'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Smile ID request signature: base64( HMAC-SHA256(api_key, timestamp + partner_id + "sid_request") ). */
async function smileSignature(apiKey: string, partnerId: string, timestamp: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(timestamp + partnerId + 'sid_request')
  )
  return btoa(String.fromCharCode(...new Uint8Array(mac)))
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)
    const authz = await requireAuthorizedAdmin(req, supabase, canManageMembers, {
      allowServiceRole: true,
      serviceRoleKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { idNumber } = await req.json()
    if (!idNumber) {
      return json({ success: false, error: 'Member ID (registration number) is required.' }, 400)
    }

    // 1. Resolve the member and the government IDs we hold for them.
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, voters_id_card')
      .eq('registration_number', idNumber)
      .maybeSingle()
    if (!user) return json({ success: false, error: 'Member not found.' }, 404)

    // Ghana Card number is pgcrypto-encrypted; decrypt via the admin RPC. Best
    // effort — if unavailable we fall back to the (plaintext) voter's ID.
    let ghanaCard: string | null = null
    try {
      const { data } = await supabase.rpc('admin_get_national_id', { reg_no: idNumber })
      if (typeof data === 'string' && data.trim()) ghanaCard = data.trim()
    } catch {
      /* fall through to voter ID */
    }

    const target = ghanaCard
      ? { idType: 'GHANA_CARD', idNumber: ghanaCard, source: 'NIA (Ghana Card)' }
      : user.voters_id_card
        ? {
            idType: 'VOTER_ID',
            idNumber: String(user.voters_id_card),
            source: 'Electoral Commission',
          }
        : null

    if (!target) {
      return json({
        success: true,
        data: {
          confidence: 0,
          matches: [],
          status: 'Review',
          notes: 'No Ghana Card or Voter ID number on file to verify.',
        },
      })
    }

    // 2. Config gate — the integration is ready but access is still being acquired.
    const partnerId = Deno.env.get('SMILE_ID_PARTNER_ID')
    const apiKey = Deno.env.get('SMILE_ID_API_KEY')
    if (!partnerId || !apiKey) {
      return json({
        success: false,
        notConfigured: true,
        error:
          'Government identity verification (Smile ID / EC / NIA) is not configured yet — awaiting data access.',
      })
    }

    // 3. Live Smile ID call. Endpoint/payload follow Smile ID's ID-verification
    //    format; confirm the exact product path for Ghana when access is granted.
    const baseUrl = Deno.env.get('SMILE_ID_BASE_URL') || DEFAULT_SMILE_BASE
    const timestamp = new Date().toISOString()
    const signature = await smileSignature(apiKey, partnerId, timestamp)

    const smileRes = await fetch(`${baseUrl}/v1/id_verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: partnerId,
        signature,
        timestamp,
        country: 'GH',
        id_type: target.idType,
        id_number: target.idNumber,
        partner_params: { user_id: user.id, job_type: 5 },
      }),
    })

    if (!smileRes.ok) {
      const detail = await smileRes.text()
      console.error('[KYC] Smile ID error:', smileRes.status, detail)
      return json(
        { success: false, error: `Government verification failed (${smileRes.status}).` },
        502
      )
    }

    const result = await smileRes.json()
    // Smile ID returns ResultCode/ResultText and matched fields. Map to our shape.
    const verified =
      result?.ResultCode === '1012' || result?.Actions?.Verify_ID_Number === 'Verified'
    const matches: string[] = []
    if (result?.FullName) matches.push(`Name on record: ${result.FullName}`)
    if (verified) matches.push(`${target.source} record verified`)

    return json({
      success: true,
      data: {
        confidence: verified ? 100 : 0,
        matches,
        flags: verified ? [] : [result?.ResultText || 'ID number could not be verified'],
        status: verified ? 'Verified' : 'Review',
        source: target.source,
      },
    })
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, 500)
  }
})
