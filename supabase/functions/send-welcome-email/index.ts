// @ts-nocheck: Deno edge function module imports and environment typing
// THE BASE: WELCOME EMAIL
// Sent when an admin approves a pending member (status → Active).
// Invoked fire-and-forget from adminService.verifyMember().
//
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secrets: RESEND_API_KEY for email, MNOTIFY_API_KEY for SMS

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { canManageMembers, requireAuthorizedAdmin, getSenderEmail } from '../_shared/admin-auth.ts'
import { welcomeEmail, unloggedMemberNudgeEmail } from '../_shared/email-templates.ts'
import { sendSms } from '../_shared/sms.ts'
import { sendEmail } from '../_shared/email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildWelcomeSms(name: string, regNo: string): string {
  const firstName = name.split(' ')[0] || name
  return `Hi ${firstName}, welcome to The Base Movement. Your membership is active and your registration number is ${regNo}. Visit www.thebasemovement.org.gh/dashboard to get started.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      userId,
      sendToAllActive = false,
      type = 'welcome',
      email: targetEmail,
      name: targetName,
      regNo: targetRegNo,
      chapter: targetChapter,
    } = await req.json()
    if (!userId && !sendToAllActive && type !== 'unlogged_nudge')
      throw new Error('userId is required')

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
      constituency?: string | null
      platform?: string | null
    }

    // Members can reach a human here when self-service reset fails.
    const WHATSAPP_SUPPORT = [
      { name: 'Bernard', number: '+32467814742' },
      { name: 'Prince', number: '+233247380924' },
      { name: 'Morris', number: '+233261278180' },
    ]

    let recipients: UserRow[] = []
    if (type === 'unlogged_nudge' && targetEmail) {
      // Look the member up so the constituency ask only appears for members who
      // actually lack one; the caller only supplies name/email/regNo.
      const { data: known } = await supabase
        .from('users')
        .select('constituency, platform')
        .eq('email', targetEmail)
        .maybeSingle()
      recipients = [
        {
          id: 'direct',
          full_name: targetName || 'Compatriot',
          email: targetEmail,
          phone_number: null,
          registration_number: targetRegNo || '',
          chapter: targetChapter || null,
          status: 'Active',
          constituency: known?.constituency ?? null,
          platform: known?.platform ?? 'GHANA',
        },
      ]
    } else if (sendToAllActive) {
      const { data: users, error: usersErr } = await supabase
        .from('users')
        .select(
          'id, full_name, email, phone_number, registration_number, chapter, status, constituency, platform'
        )
        .eq('status', 'Active')
        .order('joined_at', { ascending: true })
      if (usersErr) throw new Error(`Failed to fetch active members: ${usersErr.message}`)
      recipients = (users ?? []) as UserRow[]
    } else {
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select(
          'id, full_name, email, phone_number, registration_number, chapter, status, constituency, platform'
        )
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
      const isNudge = type === 'unlogged_nudge'

      const html = isNudge
        ? unloggedMemberNudgeEmail({
            name: firstName,
            regNo: row.registration_number,
            chapter: row.chapter ?? undefined,
            loginUrl: 'https://www.thebasemovement.org.gh/login',
            settingsUrl: 'https://www.thebasemovement.org.gh/dashboard/settings',
            // Setting a constituency is what flips a Ghana member to verified,
            // so the email leads with that ask when it is the missing piece.
            needsConstituency: !row.constituency && (row.platform ?? '').toUpperCase() === 'GHANA',
            whatsappNumbers: WHATSAPP_SUPPORT,
          })
        : welcomeEmail({
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

      if (row.email) {
        const subject = isNudge
          ? `Activate your member dashboard & verify your membership — The Base`
          : `Welcome to The Base, ${firstName} — you're now a verified member`

        const r = await sendEmail({
          to: row.email,
          from: `The Base Movement <${senderEmail}>`,
          subject,
          html,
        })
        if (r.ok) emailSent++
        else {
          emailFailed++
          console.error('[WELCOME] Email send failed for', row.email, r.detail)
        }
      }

      // Never SMS on a nudge. The SMS providers are transactional OTP
      // infrastructure; a bulk run through sendToAllActive would otherwise text
      // every member with a phone number and burn OTP credit.
      if (row.phone_number && !isNudge) {
        const sms = await sendSms(
          [row.phone_number],
          buildWelcomeSms(row.full_name || 'Compatriot', row.registration_number)
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
