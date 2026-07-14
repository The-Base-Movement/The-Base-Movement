import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const KYC_BUCKET = 'member-kyc'
const OPENAI_MODEL = 'gpt-4o-mini' // vision-capable; cheap enough for per-member scans

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
    if (!idNumber)
      return json({ success: false, error: 'Member ID (registration number) is required.' }, 400)

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      // The scan pipeline is wired end-to-end; it just needs the key to run.
      return json(
        {
          success: false,
          error:
            'AI identity scanning is not configured yet. Add the OPENAI_API_KEY secret to enable it.',
        },
        200
      )
    }

    // 1. Resolve the member and their photos. idNumber is the registration number.
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, constituency, region, platform')
      .eq('registration_number', idNumber)
      .maybeSingle()

    if (!user) return json({ success: false, error: 'Member not found.' }, 404)

    // 2. Gather every image we have: public avatar + any private KYC documents.
    const images: { label: string; url: string }[] = []
    if (typeof user.avatar_url === 'string' && user.avatar_url.startsWith('http')) {
      images.push({ label: 'Profile photo', url: user.avatar_url })
    }

    const { data: kyc } = await supabase
      .from('member_kyc')
      .select('ghana_card_front_path, selfie_path')
      .eq('user_id', user.id)
      .maybeSingle()

    for (const [label, path] of [
      ['Ghana Card (front)', kyc?.ghana_card_front_path],
      ['KYC selfie', kyc?.selfie_path],
    ] as const) {
      if (!path) continue
      const { data: signed } = await supabase.storage.from(KYC_BUCKET).createSignedUrl(path, 300)
      if (signed?.signedUrl) images.push({ label, url: signed.signedUrl })
    }

    // 3. Nothing to look at — report honestly instead of guessing.
    if (images.length === 0) {
      return json({
        success: true,
        data: {
          confidence: 0,
          matches: [],
          status: 'Review',
          notes: 'No profile photo or ID document on file to scan.',
        },
      })
    }

    // 4. Ask OpenAI vision to assess the images against the member's details.
    const prompt =
      `You are an identity-verification assistant for a political-movement membership platform in Ghana. ` +
      `The member's registered name is "${user.full_name}". ` +
      `Assess the attached image(s), which may include a profile photo, a Ghana Card, and/or a selfie. ` +
      `Decide whether they plausibly represent a genuine, single real person and, where an ID document is present, ` +
      `whether the name/photo on it is consistent with the member. Do NOT invent details you cannot see. ` +
      `Respond ONLY as JSON with this exact shape: ` +
      `{"confidence": <integer 0-100>, "status": "Verified" | "Review", "matches": string[], "flags": string[]}. ` +
      `"matches" lists things that check out (e.g. "Clear human face", "Name on card matches"). ` +
      `"flags" lists concerns (e.g. "Photo is a screenshot", "Face not visible", "Possible document mismatch"). ` +
      `Use status "Verified" only when confidence >= 75 and there are no serious flags.`

    const content: unknown[] = [{ type: 'text', text: prompt }]
    for (const img of images) {
      content.push({ type: 'text', text: img.label })
      content.push({ type: 'image_url', image_url: { url: img.url } })
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
        max_tokens: 400,
      }),
    })

    if (!aiRes.ok) {
      const detail = await aiRes.text()
      console.error('[KYC] OpenAI error:', aiRes.status, detail)
      return json({ success: false, error: `AI provider error (${aiRes.status}).` }, 502)
    }

    const aiJson = await aiRes.json()
    let verdict: { confidence?: number; status?: string; matches?: string[]; flags?: string[] } = {}
    try {
      verdict = JSON.parse(aiJson.choices?.[0]?.message?.content ?? '{}')
    } catch {
      return json({ success: false, error: 'Could not parse AI response.' }, 502)
    }

    const confidence = Math.max(0, Math.min(100, Math.round(Number(verdict.confidence) || 0)))
    const flagged = verdict.status !== 'Verified' || confidence < 75

    return json({
      success: true,
      data: {
        confidence,
        matches: Array.isArray(verdict.matches) ? verdict.matches : [],
        flags: Array.isArray(verdict.flags) ? verdict.flags : [],
        status: flagged ? 'Review' : 'Verified',
        scannedImages: images.map((i) => i.label),
      },
    })
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, 500)
  }
})
