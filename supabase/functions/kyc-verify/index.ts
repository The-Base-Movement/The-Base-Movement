import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { _userId, _idType, _idNumber, _imageBase64, _selfieBase64 } = await req.json()

    // Smile ID Configuration (Securely stored in Supabase secrets)
    const partnerId = Deno.env.get('SMILE_ID_PARTNER_ID')
    const apiKey = Deno.env.get('SMILE_ID_API_KEY')

    if (!partnerId || !apiKey) {
      console.warn('[KYC] Smile ID credentials missing. Operating in High-Fidelity Mock Mode.')

      // Industrial Grade Simulation for Testing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const success = Math.random() > 0.1
      return new Response(
        JSON.stringify({
          success,
          data: {
            status: success ? 'Verified' : 'Flagged',
            confidence: success ? 0.96 : 0.42,
            matches: success ? ['Face Match', 'NIA Valid'] : ['Low Quality Image'],
            smileJobId: `MOCK-${Date.now()}`,
          },
          mocked: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    /**
     * PRO PRODUCTION LOGIC:
     * We would use the Smile ID Node/Deno SDK or a direct fetch to the Smile ID REST API.
     * The job would typically be an 'Enhanced KYC' or 'Document Verification' job.
     */

    // Placeholder for actual Smile ID API integration call
    // const response = await fetch('https://api.smileidentity.com/v1/verify', { ... })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'KYC Protocol initialized. API Uplink pending configuration.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
