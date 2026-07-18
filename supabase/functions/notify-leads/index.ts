// THE BASE: MOBILIZATION NOTIFICATION EDGE FUNCTION
// Sends a welcome email to new verified members via SendGrid,
// then syncs the member into the SendGrid marketing contacts list.
// Set RESEND_API_KEY (+ optionally SENDGRID_LIST_ID) in Supabase secrets.

// @ts-expect-error: Deno supports URL imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { welcomeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import { json, requireServiceRoleCall, getSenderEmail } from '../_shared/admin-auth.ts'
// @ts-expect-error: Deno supports URL imports
import { sendEmail } from '../_shared/email.ts'

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
        .maybeSingle()

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

    // Fetch constituency lead (CCC) contact info
    let cccEmail = ''
    let cccPhone = ''

    if (record.constituency) {
      try {
        const { data: constData } = await supabaseAdmin
          .from('ghana_constituencies')
          .select('id')
          .ilike('name', record.constituency)
          .maybeSingle()

        if (constData?.id) {
          const { data: leaderData } = await supabaseAdmin
            .from('constituency_leaders')
            .select('member_id')
            .eq('constituency_id', constData.id)
            .limit(1)
            .maybeSingle()

          if (leaderData?.member_id) {
            const { data: userData } = await supabaseAdmin
              .from('users')
              .select('email, phone_number')
              .eq('id', leaderData.member_id)
              .maybeSingle()

            if (userData) {
              cccEmail = userData.email || ''
              cccPhone = userData.phone_number || ''
            }
          }
        }
      } catch (err) {
        console.error('[NOTIFY-LEADS] CCC lead lookup error:', err)
      }
    }

    // Fetch regional admin (RCC) contact info
    let rccEmail = ''
    let rccPhone = ''

    if (record.region) {
      try {
        const { data: adminData } = await supabaseAdmin
          .from('admins')
          .select('id, users(email, phone_number)')
          .ilike('region', record.region)
          .eq('role', 'ADMIN_L2')
          .limit(1)
          .maybeSingle()

        if (adminData?.users) {
          interface RCCLead {
            email: string
            phone_number: string
          }
          const leader = adminData.users as unknown as RCCLead
          rccEmail = leader.email
          rccPhone = leader.phone_number
        }
      } catch (err) {
        console.error('[NOTIFY-LEADS] RCC lead lookup error:', err)
      }
    }

    // Build welcome email for the new member
    const memberEmail: string | undefined = record.email
    const html = welcomeEmail({
      name: (record.full_name ?? '').split(' ')[0] || 'Compatriot',
      regNo: record.registration_number ?? '',
      chapter: record.chapter ?? '',
      dashboardUrl: 'https://www.thebasemovement.org.gh/dashboard',
      cardDownloadUrl: 'https://www.thebasemovement.org.gh/dashboard/membership-card',
    })

    if (memberEmail) {
      const senderEmail = await getSenderEmail(supabaseAdmin)
      const r = await sendEmail({
        to: memberEmail,
        from: `The Base Movement <${senderEmail}>`,
        subject: 'You are now a verified member of The Base.',
        html,
      })
      if (r.ok) {
        console.warn('[EMAIL] Accepted by Resend for', memberEmail)
      } else {
        console.error('[EMAIL] Resend rejected email to', memberEmail, r.detail)
      }
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

      fetch(`${supabaseUrl}/functions/v1/sync-resend-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(contactPayload),
      })
        .then((r) => console.warn('[RESEND-SYNC] contact sync dispatched, status', r.status))
        .catch((e) => console.error('[RESEND-SYNC] dispatch error', e))
    }

    // 1. Chapter Lead SMS notification (Diaspora)
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

    // 2. Constituency Lead SMS notification (CCC)
    if (cccPhone) {
      const smsResult = await sendSms(
        [cccPhone],
        `[The Base CCC] Alert: A new member (${record.full_name}) has registered in your constituency (${record.constituency}).`
      )
      if (smsResult.ok) {
        console.warn(`[SMS] CCC lead notification sent successfully to ${cccPhone}`)
      } else {
        console.error(`[SMS] CCC lead notification failed for ${cccPhone}: ${smsResult.detail}`)
      }
    }
    if (cccEmail) {
      console.warn(`[EMAIL] CCC lead notification queued for ${cccEmail}`)
    }

    // 3. Regional Lead SMS notification (RCC)
    if (rccPhone) {
      const smsResult = await sendSms(
        [rccPhone],
        `[The Base RCC] Alert: A new member (${record.full_name}) has registered in your region (${record.region}).`
      )
      if (smsResult.ok) {
        console.warn(`[SMS] RCC lead notification sent successfully to ${rccPhone}`)
      } else {
        console.error(`[SMS] RCC lead notification failed for ${rccPhone}: ${smsResult.detail}`)
      }
    }
    if (rccEmail) {
      console.warn(`[EMAIL] RCC lead notification queued for ${rccEmail}`)
    }

    // 4. National Command Center (NCC) Alert via Discord webhook
    // @ts-ignore: Deno global
    const nccWebhook = Deno.env.get('DISCORD_NCC_ALERTS_WEBHOOK_URL')
    if (nccWebhook) {
      try {
        const discordRes = await fetch(nccWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: '🆕 New Member Registration Verified',
                description: `A new member has completed registration and verification.`,
                color: 2067276, // Green
                fields: [
                  { name: 'Name', value: record.full_name || 'N/A', inline: true },
                  {
                    name: 'Registration No',
                    value: record.registration_number || 'N/A',
                    inline: true,
                  },
                  { name: 'Region', value: record.region || 'N/A', inline: true },
                  { name: 'Constituency', value: record.constituency || 'N/A', inline: true },
                  { name: 'Chapter/Diaspora', value: record.chapter || 'N/A', inline: true },
                  { name: 'Source Platform', value: record.platform || 'Web Portal', inline: true },
                ],
                footer: { text: 'NCC Command Center Real-Time Alert' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        })
        if (discordRes.ok) {
          console.warn('[DISCORD] NCC Alerts notification sent successfully.')
        } else {
          console.error(
            '[DISCORD] NCC Alerts dispatch failed:',
            discordRes.status,
            await discordRes.text()
          )
        }
      } catch (err) {
        console.error('[DISCORD] NCC Alerts error:', err)
      }
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
