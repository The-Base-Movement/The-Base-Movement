import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const VISION_TIMEOUT_MS = 10_000

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Content-Type must be application/json.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 415,
      }
    )
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

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'No image payload provided.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OCR provider is unavailable.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503,
        }
      )
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4)
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: 'Image payload is too large.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 413,
        }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS)

    let result: any
    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            requests: [
              {
                image: { content: cleanBase64 },
                features: [{ type: 'TEXT_DETECTION' }],
              },
            ],
          }),
        }
      )

      result = await response.json()
    } finally {
      clearTimeout(timeout)
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    const textAnnotations = result.responses[0]?.textAnnotations
    if (!textAnnotations || textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No legible text detected on document.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const fullText = textAnnotations[0].description
    const ghanaCardRegex = /GHA-\d{9}-\d/i
    const idMatch = fullText.match(ghanaCardRegex)
    const idNumber = idMatch ? idMatch[0].toUpperCase() : null

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          documentType: idNumber ? 'GHANA_CARD' : null,
          idNumber,
          confidence: idNumber ? 0.98 : 0,
          mocked: false,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('OCR Processing Failure:', error)
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
