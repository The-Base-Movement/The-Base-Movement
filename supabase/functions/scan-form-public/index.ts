import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

// Public (unauthenticated) form scanner for the registration page. A registrant
// uploads a photo of their completed paper form and OpenAI vision reads it into
// the registration fields to prefill. Public by necessity (no account yet), so
// it is guarded by a per-IP daily cap and an image-size limit.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_MODEL = 'gpt-4o-mini' // vision-capable; swap to gpt-4o for denser forms
const DAILY_CAP = 20 // scans per IP per day
const MAX_BASE64 = 11_000_000 // ~8 MB decoded

const GHANA_SCHEMA = {
  platform: 'GHANA',
  fullName: null,
  gender: null,
  ageRange: null,
  email: null,
  countryCode: '+233',
  contactNumber: null,
  residentialAddress: null,
  region: null,
  constituency: null,
  profession: null,
  educationLevel: null,
  emergencyContactName: null,
  emergencyRelationship: null,
  emergencyNumber: null,
  votersIdCard: null,
}

const DIASPORA_SCHEMA = {
  platform: 'DIASPORA',
  fullName: null,
  gender: null,
  ageRange: null,
  email: null,
  country: null,
  countryCode: null,
  contactNumber: null,
  residentialAddress: null,
  profession: null,
  educationLevel: null,
  emergencyContactName: null,
  emergencyRelationship: null,
  emergencyNumber: null,
}

const PROMPT = `You are analysing a scanned physical registration form for The Base Movement, a Ghanaian political organisation.

The form is either a Ghana Network form (for residents) or a Diaspora Network form (for Ghanaians living abroad). The form type is usually labelled at the top.

Extract every legible field value and return a single JSON object.

Rules:
- Use null for any field that is blank, illegible, or not present on this form type.
- For gender: use exactly one of "Male", "Female", "Other".
- For ageRange: use exactly one of "18-25", "26-35", "36-45", "46-60", "60+".
- For region (Ghana forms): match to one of these 16 regions exactly — Greater Accra, Ashanti, Western, Central, Eastern, Volta, Northern, Upper East, Upper West, Brong-Ahafo, Savannah, Bono East, Ahafo, Western North, Oti, North East.
- For educationLevel: use one of "Basic", "Secondary", "Tertiary", "Postgraduate".
- For platform: "GHANA" or "DIASPORA".
- Include ALL fields from the matching schema even if null.
- Return ONLY valid JSON — no markdown fences, no explanation.

Ghana Network schema:
${JSON.stringify(GHANA_SCHEMA, null, 2)}

Diaspora Network schema:
${JSON.stringify(DIASPORA_SCHEMA, null, 2)}

Return the JSON:`

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      // Wired end-to-end; just needs the key. Client falls back to offline OCR.
      return json({
        success: false,
        notConfigured: true,
        error: 'AI form scanning is not configured yet.',
      })
    }

    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64 || !mediaType) {
      return json({ success: false, error: 'imageBase64 and mediaType are required.' }, 400)
    }
    const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!supported.includes(mediaType)) {
      return json({ success: false, error: `Unsupported image type: ${mediaType}` }, 400)
    }
    if (typeof imageBase64 !== 'string' || imageBase64.length > MAX_BASE64) {
      return json({ success: false, error: 'Image is too large to scan.' }, 413)
    }

    // Per-IP daily rate limit (atomic increment in the DB).
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: count } = await supabase.rpc('bump_ai_scan_rate', { p_ip: ip })
    if ((count ?? 0) > DAILY_CAP) {
      return json(
        {
          success: false,
          error: 'Daily scan limit reached. Please fill in your details manually.',
        },
        429
      )
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1024,
      }),
    })

    if (!aiRes.ok) {
      const detail = await aiRes.text()
      console.error('[scan-form-public] OpenAI error:', aiRes.status, detail)
      return json({ success: false, error: 'Form-reading service failed.' }, 502)
    }

    const aiJson = await aiRes.json()
    let extracted: Record<string, unknown> = {}
    try {
      extracted = JSON.parse(aiJson.choices?.[0]?.message?.content ?? '{}')
    } catch {
      return json({ success: false, error: 'Could not parse the scanned form.' }, 502)
    }

    return json({ success: true, data: extracted })
  } catch (err) {
    console.error('[scan-form-public] error:', err)
    return json({ success: false, error: 'Failed to process the form.' }, 500)
  }
})
