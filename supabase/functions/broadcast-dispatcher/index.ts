// THE BASE: MULTI-CHANNEL BROADCAST DISPATCHER
// Handles SMS/email dispatch for Urgent broadcasts.
// Set SENDGRID_API_KEY in Supabase secrets to activate email sending.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { broadcastEmail } from '../_shared/email-templates.ts'
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

    const { broadcastId, priority, targetType, targetValue, subject, body, region } =
      await req.json()

    if (priority !== 'Urgent') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Non-urgent broadcast, skipping external dispatch.',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // @ts-ignore: Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    let userQuery = supabaseAdmin.from('users').select('id, full_name, phone_number, email')
    if (targetType === 'REGION') userQuery = userQuery.eq('region', targetValue)
    else if (targetType === 'CONSTITUENCY') userQuery = userQuery.eq('constituency', targetValue)

    const { data: users, error: userError } = await userQuery
    if (userError) throw userError

    interface Patriot {
      id: string
      full_name: string
      phone_number: string | null
      email: string | null
    }
    const recipients = (users as Patriot[])?.filter((u) => u.phone_number || u.email) || []

    const html = broadcastEmail({
      subject: subject ?? 'Movement update',
      preheader: subject ?? 'An important update from The Base Movement.',
      body: body ? `<p style="line-height:1.65;color:#444;margin-bottom:14px">${body}</p>` : '',
      region: region ?? targetValue,
      ctaLabel: 'Read the full update →',
      ctaUrl: 'https://thebasemovement.info/dashboard',
    })

    // @ts-expect-error: Deno global
    const sgKey: string | undefined = Deno.env.get('SENDGRID_API_KEY')
    const emailRecipients = recipients.filter((u) => u.email).map((u) => u.email as string)

    if (sgKey && emailRecipients.length > 0) {
      const senderEmail = await getSenderEmail(supabaseAdmin)
      // SendGrid supports up to 1000 personalizations per call
      const BATCH = 1000
      for (let i = 0; i < emailRecipients.length; i += BATCH) {
        const batch = emailRecipients.slice(i, i + BATCH)
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
          body: JSON.stringify({
            personalizations: batch.map((email) => ({ to: [{ email }] })),
            from: { email: senderEmail, name: 'The Base Movement' },
            subject: subject ?? 'Movement update',
            content: [{ type: 'text/html', value: html }],
          }),
        })
        console.warn(`[EMAIL] Broadcast batch ${i / BATCH + 1}:`, res.status)
      }
    } else {
      console.warn(
        `[EMAIL] SENDGRID_API_KEY not set — would send to ${emailRecipients.length} addresses`
      )
    }

    const phoneRecipients = recipients.filter((u) => u.phone_number)

    // MNotify SMS dispatch
    if (phoneRecipients.length > 0) {
      const numbers = phoneRecipients.map((u) => u.phone_number as string).filter(Boolean)

      // Batch recipients to keep request payloads reasonable
      const SMS_BATCH = 100
      for (let i = 0; i < numbers.length; i += SMS_BATCH) {
        const batch = numbers.slice(i, i + SMS_BATCH)
        const result = await sendSms(
          batch,
          body ?? subject ?? 'An urgent update from The Base Movement.'
        )
        console.warn(`[SMS] Batch ${i / SMS_BATCH + 1} (${batch.length} nums):`, result.detail)
      }
    }

    console.warn(
      `[URGENT DISPATCH] ${broadcastId} — ${emailRecipients.length} email / ${phoneRecipients.length} SMS recipients`
    )

    // Push notifications — fire and forget
    const userIds = (users as Patriot[])?.map((u) => u.id) ?? []
    if (userIds.length > 0) {
      // @ts-expect-error: Deno global
      const supabaseUrl: string = Deno.env.get('SUPABASE_URL') ?? ''
      // @ts-expect-error: Deno global
      const serviceKey: string = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          userIds,
          title: subject ?? 'Urgent broadcast',
          body: body ?? '',
          url: '/dashboard',
        }),
      }).catch((err: unknown) => console.error('[PUSH]', err))
    }

    return new Response(JSON.stringify({ success: true, recipientCount: recipients.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[DISPATCH-ERROR] ${message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
