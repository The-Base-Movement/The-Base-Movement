import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
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

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return new Response(JSON.stringify({ success: false, error: 'No image payload provided.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const apiKey = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY')
    
    // High-Fidelity Mock Fallback (Allows UI Development before API Key is provisioned)
    if (!apiKey) {
      console.log('No Google Cloud Vision API Key found. Operating in High-Fidelity Mock Mode.')
      // Simulate real-world edge processing latency
      await new Promise((resolve) => setTimeout(resolve, 1200))
      return new Response(JSON.stringify({
        success: true,
        data: {
          documentType: 'GHANA_CARD',
          idNumber: 'GHA-712345678-9',
          fullName: 'Kwame Nkrumah',
          dateOfBirth: '1909-09-21',
          confidence: 0.98,
          mocked: true
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Live Google Cloud Vision Integration
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: cleanBase64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }
        ]
      })
    })

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message)
    }

    const textAnnotations = result.responses[0]?.textAnnotations
    if (!textAnnotations || textAnnotations.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No legible text detected on document.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const fullText = textAnnotations[0].description
    
    // Elite Pattern Matching for Ghana Card (GHA-XXXXXXXXX-X)
    const ghanaCardRegex = /GHA-\d{9}-\d/i
    const idMatch = fullText.match(ghanaCardRegex)
    const idNumber = idMatch ? idMatch[0].toUpperCase() : null

    return new Response(JSON.stringify({
      success: true,
      data: {
        rawExtractedText: fullText,
        idNumber,
        mocked: false
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('OCR Processing Failure:', error)
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
