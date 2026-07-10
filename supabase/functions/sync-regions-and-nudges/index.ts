// @ts-nocheck
// THE BASE: REGISTRATION SYNC AND NUDGES
// 1. Double-checks and syncs region from constituency for Ghana platform users.
// 2. Finds members who have a region but NO constituency and sends login credentials.
//
// Designed to run on a cron schedule or invoked manually.
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secrets: SENDGRID_API_KEY, MNOTIFY_API_KEY

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendSms } from '../_shared/sms.ts'
import { csvImportWelcomeEmail } from '../_shared/email-templates.ts'
import { canManageMembers, getSenderEmail, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz'

function generateTempPassword(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join('')
}

function normalizePhoneNumber(raw: string): string {
  const cleaned = (raw ?? '').trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('+')) {
    return cleaned
  }
  const digits = cleaned.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const sgKey = Deno.env.get('SENDGRID_API_KEY')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canManageMembers, {
      allowServiceRole: true,
      serviceRoleKey: supabaseServiceKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const senderEmail = sgKey ? await getSenderEmail(supabaseAdmin) : ''

    // 1. One-time Sync: Auto-resolve region for members who have a constituency but no region
    const { data: unsynced, error: unsyncedErr } = await supabaseAdmin
      .from('users')
      .select('id, constituency')
      .eq('platform', 'GHANA')
      .not('constituency', 'is', null)
      .neq('constituency', '')
      .or('region.is.null,region.eq.""')

    let regionsSyncedCount = 0
    if (!unsyncedErr && unsynced && unsynced.length > 0) {
      // Fetch constituencies mappings
      const { data: mappings } = await supabaseAdmin
        .from('ghana_constituencies')
        .select('name, ghana_regions(name)')

      const constituencyToRegionMap = new Map<string, string>()
      for (const row of mappings ?? []) {
        const regionName = row.ghana_regions?.name
        if (row.name && regionName) {
          constituencyToRegionMap.set(row.name.toLowerCase().trim(), regionName)
        }
      }

      for (const user of unsynced) {
        const matchedRegion = constituencyToRegionMap.get(user.constituency.toLowerCase().trim())
        if (matchedRegion) {
          const { error: updateErr } = await supabaseAdmin
            .from('users')
            .update({ region: matchedRegion })
            .eq('id', user.id)
          if (!updateErr) regionsSyncedCount++
        }
      }
    }

    // 2. Find members who have a region but NO constituency
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: incomplete, error: incompleteErr } = await supabaseAdmin
      .from('users')
      .select(
        'id, full_name, email, phone_number, registration_number, region, constituency, joined_at, followup_sent_at'
      )
      .eq('platform', 'GHANA')
      .not('region', 'is', null)
      .neq('region', '')
      .or('constituency.is.null,constituency.eq.""')
      .or(`followup_sent_at.is.null,followup_sent_at.lt.${cutoff24h}`)
      .order('joined_at', { ascending: true })
      .limit(30)

    if (incompleteErr) throw incompleteErr

    let emailsSent = 0
    let smsSent = 0
    let credentialsUpdated = 0

    for (const member of incomplete ?? []) {
      // Validate that id is a valid UUID before trying auth updates
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        member.id
      )
      if (!isUuid) {
        console.warn(
          `[SYNC-NUDGES] User ${member.registration_number} does not have a valid auth UUID: "${member.id}". Skipping.`
        )
        continue
      }

      const tempPassword = generateTempPassword()

      // Update Auth credentials
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(member.id, {
        password: tempPassword,
        user_metadata: {
          must_change_password: true,
          name: member.full_name,
          reg_no: member.registration_number,
        },
      })

      if (authError) {
        console.error(
          `[SYNC-NUDGES] Auth update failed for user ${member.registration_number}:`,
          authError.message
        )
        continue
      }

      credentialsUpdated++

      // Update users table state
      await supabaseAdmin
        .from('users')
        .update({
          must_change_password: true,
          temp_password_sent_at: new Date().toISOString(),
          followup_sent_at: new Date().toISOString(),
        })
        .eq('id', member.id)

      // Send Email
      if (member.email && sgKey && senderEmail) {
        try {
          const html = csvImportWelcomeEmail({
            name: member.full_name || 'Patriot',
            regNo: member.registration_number,
            phone: member.phone_number || 'N/A',
            tempPassword,
            loginUrl: 'https://www.thebasemovement.org.gh/login',
          })

          const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sgKey}` },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: member.email }] }],
              from: { email: senderEmail, name: 'The Base Movement' },
              subject: 'Complete your Base Movement profile',
              content: [{ type: 'text/html', value: html }],
            }),
          })

          if (emailRes.ok) {
            emailsSent++
          } else {
            console.error(
              `[SYNC-NUDGES] Email delivery failed for ${member.registration_number}:`,
              await emailRes.text()
            )
          }
        } catch (emailErr) {
          console.error(
            `[SYNC-NUDGES] SendGrid dispatch exception for ${member.registration_number}:`,
            emailErr
          )
        }
      }

      // Send SMS
      const normalizedPhone = normalizePhoneNumber(member.phone_number)
      if (normalizedPhone) {
        const msg = `Welcome to The Base, ${member.full_name || 'Patriot'}!\n\nYour temporary password: ${tempPassword}\n\nLogin at www.thebasemovement.org.gh/login and complete your profile (upload your photo & set constituency) to active your card.`
        const result = await sendSms([normalizedPhone], msg)
        if (result.ok) {
          smsSent++
        } else {
          console.error(
            `[SYNC-NUDGES] SMS delivery failed for ${member.registration_number}:`,
            result.detail
          )
        }
      }
    }

    const resultSummary = {
      regions_synced: regionsSyncedCount,
      incomplete_checked: incomplete?.length ?? 0,
      credentials_updated: credentialsUpdated,
      emails_sent: emailsSent,
      sms_sent: smsSent,
    }

    console.log('[SYNC-NUDGES-SUMMARY]', JSON.stringify(resultSummary))

    return new Response(JSON.stringify(resultSummary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[SYNC-NUDGES-ERROR]', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
