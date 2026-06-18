// @ts-nocheck
// THE BASE: WELCOME EMAIL
// Sent when an admin approves a pending member (status → Active).
// Invoked fire-and-forget from adminService.verifyMember().
//
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secret: SENDGRID_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
import { welcomeEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    if (!sgKey) {
      console.warn('[WELCOME] SENDGRID_API_KEY not set — skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authz = await requireAuthorizedAdmin(req, supabase, canManageMembers)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId } = await req.json()
    if (!userId) throw new Error('userId is required')

    // Fetch member profile
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('full_name, email, registration_number, chapter')
      .eq('id', userId)
      .single()

    if (userErr || !user) throw new Error(`User not found: ${userErr?.message}`)

    interface UserRow {
      full_name: string
      email: string | null
      registration_number: string
      chapter: string | null
    }
    const row = user as unknown as UserRow

    if (!row.email) {
      console.warn('[WELCOME] No email for user', userId, '— skipping')
      return new Response(JSON.stringify({ skipped: true, reason: 'no email' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Live active member count for the template
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Active')

    const firstName = row.full_name.split(' ')[0] || row.full_name
    const html = welcomeEmail({
      name: firstName,
      regNo: row.registration_number,
      chapter: row.chapter ?? 'TBM',
      dashboardUrl: 'https://thebasemovement.creativeutil.com/dashboard',
      cardDownloadUrl: 'https://thebasemovement.creativeutil.com/dashboard',
      totalMembers: (count ?? 0).toLocaleString('en-GB'),
    })

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sgKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: row.email }] }],
        from: { email: 'noreply@thebasemovement.creativeutil.com', name: 'The Base Movement' },
        subject: `Welcome to The Base, ${firstName} — you're now a verified member`,
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (res.status !== 202) {
      const errText = await res.text()
      throw new Error(`SendGrid error ${res.status}: ${errText}`)
    }

    console.log('[WELCOME] Sent to', row.email)
    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[WELCOME-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
