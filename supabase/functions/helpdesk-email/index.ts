// @ts-nocheck
// HELPDESK EMAIL NOTIFICATION
// Sends email to ticket submitter on: submit, resolve, close, new comment.
// Called fire-and-forget from the frontend helpdesk hooks.
//
// Body: { ticketId: string, event: 'submitted'|'resolved'|'closed'|'comment', comment?: string }
// Required secret: SENDGRID_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getSenderEmail, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
import { helpdeskEmail } from '../_shared/email-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  try {
    const sgKey = Deno.env.get('SENDGRID_API_KEY')
    if (!sgKey) {
      return new Response(JSON.stringify({ skipped: true, reason: 'SENDGRID_API_KEY not set' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)
    const authz = await requireAuthorizedAdmin(req, supabase, () => true, {
      allowServiceRole: true,
      serviceRoleKey,
    })
    if (!authz.ok) {
      return new Response(authz.response.body, {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { ticketId, event, comment } = await req.json()
    if (!ticketId || !event) throw new Error('ticketId and event are required')

    // Fetch ticket + submitter email
    const { data: ticket, error: ticketErr } = await supabase
      .from('helpdesk_tickets')
      .select('subject, submitted_by')
      .eq('id', ticketId)
      .single()

    if (ticketErr || !ticket) throw new Error(`Ticket not found: ${ticketErr?.message}`)

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', ticket.submitted_by)
      .single()

    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no email for submitter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const firstName = user.full_name?.split(' ')[0] || user.full_name || 'Patriot'
    const html = helpdeskEmail({
      name: firstName,
      ticketSubject: ticket.subject || 'Support Ticket',
      event,
      comment: comment || undefined,
      dashboardUrl: 'https://thebasemovement.info/dashboard/tickets',
    })

    const subjectMap = {
      submitted: `Ticket received: ${ticket.subject}`,
      resolved: `Ticket resolved: ${ticket.subject}`,
      closed: `Ticket closed: ${ticket.subject}`,
      comment: `New reply on: ${ticket.subject}`,
    }

    const senderEmail = await getSenderEmail(supabase)

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: user.email, name: user.full_name }] }],
        from: { email: senderEmail, name: 'The Base Movement' },
        subject: subjectMap[event] || 'Support Update',
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[HELPDESK EMAIL] SendGrid error:', res.status, body)
      throw new Error(`SendGrid ${res.status}`)
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[HELPDESK EMAIL]', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
