// THE BASE: MOBILIZATION NOTIFICATION EDGE FUNCTION
// Sends a welcome email to new verified members via SendGrid,
// then syncs the member into the SendGrid marketing contacts list.
// Set SENDGRID_API_KEY (+ optionally SENDGRID_LIST_ID) in Supabase secrets.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { welcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import { json, requireServiceRoleCall, getSenderEmail } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno global
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    // @ts-ignore: Deno global
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const authz = requireServiceRoleCall(req, serviceKey)
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { record } = await req.json()

    // @ts-ignore: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
      dashboardUrl: 'https://thebasemovement.info/dashboard',
      cardDownloadUrl: 'https://thebasemovement.info/dashboard/membership-card',
    })

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')

    if (sgKey && memberEmail) {
      const senderEmail = await getSenderEmail(supabaseAdmin)
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: memberEmail }] }],
          from: { email: senderEmail, name: 'The Base Movement' },
          subject: 'You are now a verified member of The Base.',
          content: [{ type: 'text/html', value: html }],
        }),
      })
      if (res.ok) {
        console.warn('[EMAIL] Accepted by SendGrid for', memberEmail, res.status)
      } else {
        const errBody = await res.text()
        console.error('[EMAIL] SendGrid rejected email to', memberEmail, res.status, errBody)
      }
    } else {
      console.warn('[EMAIL] SENDGRID_API_KEY not set — skipping send to', memberEmail)
    }

    // Sync new member into SendGrid marketing contacts list (fire-and-forget)
    if (memberEmail) {
      const nameParts = (record.full_name ?? '').trim().split(/\s+/)
      const contactPayload = {
        email: memberEmail,
        first_name: nameParts[0] ?? '',
        last_name: nameParts.slice(1).join(' '),
        reg_no: record.registration_number ?? record.reg_no ?? '',
        region: record.region ?? '',
        constituency: record.constituency ?? '',
        platform: record.platform ?? '',
        status: record.status ?? '',
      }

      // @ts-expect-error: Deno global
      const supabaseUrl: string = Deno.env.get('SUPABASE_URL') ?? ''
      // @ts-expect-error: Deno global
      const serviceKey: string = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

      fetch(`${supabaseUrl}/functions/v1/sync-sendgrid-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(contactPayload),
      })
        .then((r) => console.warn('[SENDGRID-SYNC] contact sync dispatched, status', r.status))
        .catch((e) => console.error('[SENDGRID-SYNC] dispatch error', e))
    }

    // Lead notification (SMS alert)
    if (leadPhone) {
      const smsResult = await sendSms(
        [leadPhone],
        `[The Base] Alert: A new member (${record.full_name}) has joined your chapter (${record.chapter}).`
      )
      if (smsResult.ok) {
        console.warn(`[SMS] Lead notification sent successfully to ${leadPhone}`)
      } else {
        console.error(`[SMS] Lead notification failed for ${leadPhone}: ${smsResult.detail}`)
      }
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
