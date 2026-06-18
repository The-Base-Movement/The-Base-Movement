// @ts-expect-error: Deno supports URL imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageNewsletters, json, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NewsletterMutationPayload {
  action: 'schedule' | 'cancel' | 'delete'
  newsletter_id?: string
  ids?: string[]
  subject?: string
  body_html?: string
  audience_type?: string
  audience_value?: string | null
  audience_filters?: unknown
  scheduled_at?: string
  sent_by?: string | null
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

  const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canManageNewsletters)
  if (!authz.ok) {
    return new Response(await authz.response.text(), {
      status: authz.response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: NewsletterMutationPayload
  try {
    payload = (await req.json()) as NewsletterMutationPayload
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400, corsHeaders)
  }

  if (payload.action === 'schedule') {
    if (
      !payload.newsletter_id ||
      !payload.subject ||
      !payload.body_html ||
      !payload.audience_type ||
      !payload.scheduled_at
    ) {
      return json({ error: 'Missing newsletter scheduling fields.' }, 400, corsHeaders)
    }

    const { error } = await supabaseAdmin.from('newsletters').upsert(
      {
        id: payload.newsletter_id,
        subject: payload.subject,
        body_html: payload.body_html,
        audience_type: payload.audience_type,
        audience_value: payload.audience_value ?? null,
        audience_filters: Array.isArray(payload.audience_filters) ? payload.audience_filters : [],
        scheduled_at: payload.scheduled_at,
        sent_by: payload.sent_by ?? authz.callerUserId,
        status: 'scheduled',
        error_message: null,
      },
      { onConflict: 'id' }
    )

    if (error) return json({ error: error.message }, 400, corsHeaders)
    return json({ success: true }, 200, corsHeaders)
  }

  if (payload.action === 'cancel') {
    if (!payload.newsletter_id) {
      return json({ error: 'newsletter_id is required.' }, 400, corsHeaders)
    }
    const { error } = await supabaseAdmin
      .from('newsletters')
      .delete()
      .eq('id', payload.newsletter_id)
      .eq('status', 'scheduled')
    if (error) return json({ error: error.message }, 400, corsHeaders)
    return json({ success: true }, 200, corsHeaders)
  }

  if (payload.action === 'delete') {
    const ids = (payload.ids ?? []).filter(
      (id): id is string => typeof id === 'string' && id.length > 0
    )
    if (ids.length === 0) {
      return json({ error: 'ids is required.' }, 400, corsHeaders)
    }
    const { error } = await supabaseAdmin.from('newsletters').delete().in('id', ids)
    if (error) return json({ error: error.message }, 400, corsHeaders)
    return json({ success: true }, 200, corsHeaders)
  }

  return json({ error: 'Unsupported action.' }, 400, corsHeaders)
})
