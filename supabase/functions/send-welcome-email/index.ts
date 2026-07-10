// @ts-nocheck
// THE BASE: WELCOME EMAIL
// Sent when an admin approves a pending member (status → Active).
// Invoked fire-and-forget from adminService.verifyMember().
//
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secrets: SENDGRID_API_KEY for email, MNOTIFY_API_KEY for SMS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin, getSenderEmail } from '../_shared/admin-auth.ts'
import { welcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildWelcomeSms(name: string, regNo: string): string {
  const firstName = name.split(' ')[0] || name
  return `Hi ${firstName}, welcome to The Base Movement. Your membership is active and your registration number is ${regNo}. Visit www.thebasemovement.org.gh/dashboard to get started.`
}

async function sendWelcomeEmail(
  sgKey: string,
  senderEmail: string,
  email: string,
  firstName: string,
  html: string
) {
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sgKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: senderEmail, name: 'The Base Movement' },
      subject: `Welcome to The Base, ${firstName} — you're now a verified member`,
      content: [{ type: 'text/html', value: html }],
    }),
  })

  if (res.status !== 202) {
    const errText = await res.text()
    throw new Error(`SendGrid error ${res.status}: ${errText}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)

    const authz = await requireAuthorizedAdmin(req, supabase, canManageMembers, {
      allowServiceRole: true,
      serviceRoleKey,
    })
    if (!authz.ok) {
      // Return the pre-built error response directly — don't re-read its body
      return new Response(authz.response.body, {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { userId, sendToAllActive = false } = await req.json()
    if (!userId && !sendToAllActive) throw new Error('userId is required')

    // Live active member count for the template
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Active')

    const senderEmail = await getSenderEmail(supabase)
    const totalMembers = (count ?? 0).toLocaleString('en-GB')

    interface UserRow {
      id: string
      full_name: string
      email: string | null
      phone_number: string | null
      registration_number: string
      chapter: string | null
      status: string | null
    }

    let recipients: UserRow[] = []
    if (sendToAllActive) {
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, registration_number, chapter, status')
        .eq('status', 'Active')
        .order('joined_at', { ascending: true })
      if (usersErr) throw new Error(`Failed to fetch active members: ${usersErr.message}`)
      recipients = (users ?? []) as UserRow[]
    } else {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id, full_name, email, phone_number, registration_number, chapter, status')
        .eq('id', userId)
        .single()
      if (userErr || !user) throw new Error(`User not found: ${userErr?.message}`)
      recipients = [user as UserRow]
    }

    let emailSent = 0
    let smsSent = 0
    let skipped = 0
    let emailFailed = 0
    let smsFailed = 0

    for (const row of recipients) {
      const firstName = row.full_name.split(' ')[0] || row.full_name
      const html = welcomeEmail({
        name: firstName,
        regNo: row.registration_number,
        chapter: row.chapter ?? 'TBM',
        dashboardUrl: 'https://www.thebasemovement.org.gh/dashboard',
        cardDownloadUrl: 'https://www.thebasemovement.org.gh/dashboard',
        totalMembers,
      })

      if (!row.email && !row.phone_number) {
        skipped++
        continue
      }

      if (row.email && sgKey) {
        try {
          await sendWelcomeEmail(sgKey, senderEmail, row.email, firstName, html)
          emailSent++
        } catch (error) {
          emailFailed++
          console.error('[WELCOME] Email send failed for', row.email, error)
        }
      }

      if (row.phone_number) {
        const sms = await sendSms(
          [row.phone_number],
          buildWelcomeSms(row.full_name || 'Patriot', row.registration_number)
        )
        if (sms.ok) smsSent++
        else smsFailed++
      }
    }

    return new Response(
      JSON.stringify({ sent: true, emailSent, smsSent, skipped, emailFailed, smsFailed }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[WELCOME-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
