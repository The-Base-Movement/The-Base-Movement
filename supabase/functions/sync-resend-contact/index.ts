// @ts-nocheck
// THE BASE: RESEND SINGLE-CONTACT SYNC
// Upserts one member/subscriber into the Resend marketing contacts list.
//
// Required secret: RESEND_API_KEY
//
// Invocation: POST with JSON body:
//   { email, first_name, last_name, reg_no, region, constituency, platform, status, source }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, serviceKey)

    const authz = await requireAuthorizedAdmin(req, supabase, canManageMembers, {
      allowServiceRole: true,
      serviceRoleKey: serviceKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const {
      email,
      first_name = '',
      last_name = '',
      reg_no = '',
      region = '',
      constituency = '',
      platform = '',
      status = '',
      source = 'member',
    } = body as Record<string, string>

    if (!email) {
      return new Response(JSON.stringify({ error: 'email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const resendApiKey: string | undefined = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.warn('[RESEND] RESEND_API_KEY not set — skipping contact sync for', email)
      return new Response(JSON.stringify({ skipped: true, reason: 'no api key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 1. Ensure contact properties (schema fields) exist in Resend
    const props = [
      { key: 'reg_no', type: 'string' },
      { key: 'region', type: 'string' },
      { key: 'constituency', type: 'string' },
      { key: 'platform', type: 'string' },
      { key: 'membership_status', type: 'string' },
      { key: 'source', type: 'string' },
    ]
    for (const prop of props) {
      try {
        await fetch('https://api.resend.com/contact-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify(prop),
        })
      } catch {
        // Safe to ignore if already exists or schema setup fails
      }
    }

    // 2. Attempt to create the contact in Resend
    const contactPayload = {
      email,
      first_name,
      last_name,
      unsubscribed: false,
      properties: {
        reg_no,
        region,
        constituency,
        platform,
        membership_status: status,
        source,
      },
    }

    const res = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(contactPayload),
    })

    if (res.ok) {
      const data = await res.json()
      console.warn('[RESEND] Contact sync created for', email, '— id:', data.id)
      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 3. Fallback: If contact already exists, update via PATCH
    const errBody = await res.text()
    console.warn(
      '[RESEND] Contact creation failed (might already exist), attempting update. Detail:',
      errBody
    )

    const updateRes = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        first_name,
        last_name,
        properties: {
          reg_no,
          region,
          constituency,
          platform,
          membership_status: status,
        },
      }),
    })

    if (updateRes.ok) {
      const updateData = await updateRes.json()
      console.warn('[RESEND] Contact sync updated for', email, '— id:', updateData.id)
      return new Response(JSON.stringify({ success: true, id: updateData.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const updateErrText = await updateRes.text()
      console.error('[RESEND] Contact sync failed for', email, updateRes.status, updateErrText)
      return new Response(JSON.stringify({ error: updateErrText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[RESEND-CONTACT-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
