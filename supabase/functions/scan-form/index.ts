import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY is not configured.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Expect: { fileBase64: string, mediaType: string }
    // mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf"
    const { fileBase64, mediaType } = await req.json()

    if (!fileBase64 || !mediaType) {
      return new Response(
        JSON.stringify({ success: false, error: 'fileBase64 and mediaType are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!supportedTypes.includes(mediaType)) {
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported file type: ${mediaType}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Build content block — PDFs use 'document', images use 'image'
    const fileBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [fileBlock, { type: 'text', text: PROMPT }],
        }],
      }),
    })

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text()
      console.error('Anthropic API error:', err)
      return new Response(
        JSON.stringify({ success: false, error: 'Claude API request failed.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }

    const anthropicData = await anthropicRes.json()
    let raw: string = anthropicData.content?.[0]?.text?.trim() ?? ''

    // Strip accidental markdown fences
    if (raw.startsWith('```')) {
      const lines = raw.split('\n')
      raw = lines.slice(1, lines[lines.length - 1].trim() === '```' ? -1 : undefined).join('\n')
    }

    const extracted = JSON.parse(raw)

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('scan-form error:', err)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process form.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
