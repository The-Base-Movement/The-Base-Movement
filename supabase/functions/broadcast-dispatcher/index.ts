// THE BASE: MULTI-CHANNEL BROADCAST DISPATCHER
// Handles SMS/email dispatch for Urgent broadcasts.
// Set RESEND_API_KEY in Supabase secrets to activate email sending.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { broadcastEmail } from '../_shared/email-templates.ts'

// @ts-expect-error: Deno global
Deno.serve(async (req: Request) => {
  try {
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

    // @ts-expect-error: Deno global
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
      ctaUrl: 'https://thebasemovement.com/dashboard',
    })

    // @ts-expect-error: Deno global
    const resendKey: string | undefined = Deno.env.get('RESEND_API_KEY')
    const emailRecipients = recipients.filter((u) => u.email).map((u) => u.email as string)

    if (resendKey && emailRecipients.length > 0) {
      // Resend supports up to 50 recipients per call; batch for larger lists
      const BATCH = 50
      for (let i = 0; i < emailRecipients.length; i += BATCH) {
        const batch = emailRecipients.slice(i, i + BATCH)
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'The Base Movement <noreply@thebasemovement.com>',
            to: batch,
            subject: subject ?? 'Movement update',
            html,
          }),
        })
        const data = await res.json()
        console.warn(`[EMAIL] Broadcast batch ${i / BATCH + 1}:`, data)
      }
    } else {
      console.warn(
        `[EMAIL] RESEND_API_KEY not set — would send to ${emailRecipients.length} addresses`
      )
    }

    const phoneRecipients = recipients.filter((u) => u.phone_number)

    // Africa's Talking SMS dispatch
    // @ts-expect-error: Deno global
    const atApiKey: string | undefined = Deno.env.get('AT_API_KEY')
    // @ts-expect-error: Deno global
    const atUsername: string | undefined = Deno.env.get('AT_USERNAME')

    if (atApiKey && atUsername && phoneRecipients.length > 0) {
      const normalizePhone = (raw: string): string => {
        const digits = raw.replace(/\D/g, '')
        if (digits.startsWith('233')) return `+${digits}`
        if (digits.startsWith('0')) return `+233${digits.slice(1)}`
        return `+${digits}`
      }

      const numbers = phoneRecipients
        .map((u) => normalizePhone(u.phone_number as string))
        .filter(Boolean)

      // Africa's Talking accepts up to 100 recipients per request
      const AT_BATCH = 100
      for (let i = 0; i < numbers.length; i += AT_BATCH) {
        const batch = numbers.slice(i, i + AT_BATCH)
        const params = new URLSearchParams({
          username: atUsername,
          to: batch.join(','),
          message: body ?? subject ?? 'An urgent update from The Base Movement.',
        })
        const res = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            apiKey: atApiKey,
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        })
        const data = await res.json()
        console.warn(`[SMS] Batch ${i / AT_BATCH + 1}:`, JSON.stringify(data))
      }
    } else {
      console.warn(
        `[SMS] AT_API_KEY/AT_USERNAME not set — would send to ${phoneRecipients.length} numbers`
      )
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
