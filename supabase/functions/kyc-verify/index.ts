import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

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

    const { _userId, _idType, _idNumber, _imageBase64, _selfieBase64 } = await req.json()

    // Smile ID Configuration (Securely stored in Supabase secrets)
    const partnerId = Deno.env.get('SMILE_ID_PARTNER_ID')
    const apiKey = Deno.env.get('SMILE_ID_API_KEY')

    if (!partnerId || !apiKey) {
      console.error('[KYC] Smile ID credentials missing. API connection required for production.')
      throw new Error(
        'KYC Provider API credentials not configured. Please supply SMILE_ID_API_KEY.'
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
