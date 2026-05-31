// THE BASE: MOBILIZATION NOTIFICATION EDGE FUNCTION
// Sends a welcome email to new verified members via SendGrid.
// Set SENDGRID_API_KEY in Supabase secrets to activate sending.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { welcomeEmail } from '../_shared/email-templates.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
    const { record } = await req.json()

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch chapter lead contact info
    let leadEmail = ''
    let leadPhone = ''

    if (record.chapter) {
      const { data: chapterData } = await supabaseAdmin
        .from('chapters')
        .select('leader_id, users(email, phone_number)')
        .eq('name', record.chapter)
        .single()

      if (chapterData?.users) {
        interface ChapterLead {
          email: string
          phone_number: string
        }
        const lead = chapterData.users as unknown as ChapterLead
        leadEmail = lead.email
        leadPhone = lead.phone_number
      }
    }

    // Build welcome email for the new member
    const memberEmail: string | undefined = record.email
    const html = welcomeEmail({
      name: (record.full_name ?? '').split(' ')[0] || 'Patriot',
      regNo: record.registration_number ?? '',
      chapter: record.chapter ?? '',
      dashboardUrl: 'https://thebasemovement.com/dashboard',
      cardDownloadUrl: 'https://thebasemovement.com/dashboard/membership-card',
    })

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    if (sgKey && memberEmail) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: memberEmail }] }],
          from: { email: 'noreply@thebasemovement.com', name: 'The Base Movement' },
          subject: 'You are now a verified member of The Base.',
          content: [{ type: 'text/html', value: html }],
        }),
      })
      console.warn('[EMAIL] Sent welcome to', memberEmail, res.status)
    } else {
      console.warn('[EMAIL] SENDGRID_API_KEY not set — skipping send to', memberEmail)
    }

    // Lead notification (SMS placeholder)
    if (leadPhone) {
      console.warn(`[SMS] Queued for lead ${leadPhone}`)
    }
    if (leadEmail) {
      console.warn(`[EMAIL] Lead notification queued for ${leadEmail}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[NOTIFY-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
