// THE BASE: MOBILIZATION NOTIFICATION EDGE FUNCTION
// Sends a welcome email to new verified members via Resend.
// Set RESEND_API_KEY in Supabase secrets to activate sending.

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
    const resendKey: string | undefined = Deno.env.get('RESEND_API_KEY')

    if (resendKey && memberEmail) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'The Base Movement <noreply@thebasemovement.com>',
          to: [memberEmail],
          subject: 'You are now a verified member of The Base.',
          html,
        }),
      })
      const data = await res.json()
      console.warn('[EMAIL] Sent welcome to', memberEmail, data)
    } else {
      console.warn('[EMAIL] RESEND_API_KEY not set — skipping send to', memberEmail)
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
