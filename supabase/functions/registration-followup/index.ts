// @ts-nocheck
// THE BASE: REGISTRATION FOLLOWUP
// 1. Notifies incomplete members (Pending/In Review) via email + SMS about missing steps.
// 2. Runs background security scan on auto-approved members to flag suspicious accounts.
//
// Designed to run on a cron schedule (e.g. every 30 minutes) or invoked manually.
// Auto-injected: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Required secrets: SENDGRID_API_KEY, MNOTIFY_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendSms } from '../_shared/sms.ts'
import { incompleteRegistrationEmail } from '../_shared/email-templates.ts'
import { canManageMembers, getSenderEmail, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROFILE_URL = 'https://www.thebasemovement.info/settings'

async function sendDiscordEmbed(channel: string, embed: Record<string, unknown>): Promise<void> {
  const channelSecrets: Record<string, string> = {
    alerts: 'DISCORD_ALERTS_WEBHOOK_URL',
    members: 'DISCORD_MEMBERS_WEBHOOK_URL',
  }
  const secretName = channelSecrets[channel] ?? 'DISCORD_WEBHOOK_URL'
  const webhookUrl = Deno.env.get(secretName) ?? Deno.env.get('DISCORD_WEBHOOK_URL')
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })
  } catch (err) {
    console.warn('[DISCORD]', err)
  }
}

interface UserRow {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  platform: string
  region: string | null
  constituency: string | null
  chapter: string | null
  avatar_url: string | null
  registration_number: string
  status: string
  verification_status: string
  joined_at: string
  followup_sent_at: string | null
}

function getMissingSteps(u: UserRow): string[] {
  const steps: string[] = []
  if (!u.avatar_url) steps.push('Upload a profile photo')
  if (u.platform === 'GHANA' && !u.constituency) steps.push('Set your constituency')
  return steps
}

async function sendFollowupEmail(
  sgKey: string,
  senderEmail: string,
  email: string,
  name: string,
  missingSteps: string[]
): Promise<boolean> {
  const html = incompleteRegistrationEmail({
    name: name.split(' ')[0] || name,
    missingSteps,
    profileUrl: PROFILE_URL,
  })

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sgKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: senderEmail, name: 'The Base Movement' },
      subject: `Complete your registration, ${name.split(' ')[0]}`,
      content: [{ type: 'text/html', value: html }],
    }),
  })

  return res.status === 202
}

function buildSmsMessage(name: string, missingSteps: string[]): string {
  const firstName = name.split(' ')[0] || name
  const steps = missingSteps.join(', ')
  return `Hi ${firstName}, your Base Movement registration is incomplete. Missing: ${steps}. Complete it at ${PROFILE_URL} — The Base Movement`
}

// ---------------------------------------------------------------------------
// Security scan — flag suspicious auto-approved accounts
// ---------------------------------------------------------------------------

async function runSecurityScan(supabase: ReturnType<typeof createClient>): Promise<number> {
  // Find recently auto-approved members (last 24h) who haven't been scanned
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: approved, error } = await supabase
    .from('users')
    .select('id,full_name,phone_number,email,registration_number,region,constituency,joined_at')
    .eq('status', 'Active')
    .eq('verification_status', 'Approved')
    .gte('joined_at', cutoff)

  if (error || !approved?.length) return 0

  let flagged = 0

  for (const member of approved) {
    const flags: string[] = []

    // Check duplicate phone
    if (member.phone_number) {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('phone_number', member.phone_number)
        .neq('id', member.id)
      if ((count ?? 0) > 0) flags.push('Duplicate phone number')
    }

    // Check duplicate name in same constituency
    if (member.constituency) {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('full_name', member.full_name)
        .eq('constituency', member.constituency)
        .neq('id', member.id)
      if ((count ?? 0) > 0) flags.push('Duplicate name in constituency')
    }

    // Check rapid signup (5+ from same region in last hour)
    if (member.region) {
      const oneHourAgo = new Date(
        new Date(member.joined_at).getTime() - 60 * 60 * 1000
      ).toISOString()
      const oneHourAfter = new Date(
        new Date(member.joined_at).getTime() + 60 * 60 * 1000
      ).toISOString()
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('region', member.region)
        .gte('joined_at', oneHourAgo)
        .lte('joined_at', oneHourAfter)
      if ((count ?? 0) >= 5) flags.push('Bulk signup cluster detected')
    }

    if (flags.length > 0) {
      await supabase
        .from('users')
        .update({
          verification_status: 'Flagged',
          status: 'Pending',
        })
        .eq('id', member.id)

      console.log(`[SECURITY] Flagged ${member.registration_number}: ${flags.join(', ')}`)

      await sendDiscordEmbed('alerts', {
        title: '🚨 Member Flagged by Security Scan',
        color: 0xce1126,
        fields: [
          { name: 'Member', value: member.full_name, inline: true },
          { name: 'Reg No', value: member.registration_number, inline: true },
          { name: 'Region', value: member.region || '—', inline: true },
          { name: 'Flags', value: flags.join('\n') },
        ],
        footer: { text: 'Registration Followup · Security Scan' },
        timestamp: new Date().toISOString(),
      })

      flagged++
    }
  }

  return flagged
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceRoleKey)
    const authz = await requireAuthorizedAdmin(req, supabase, canManageMembers, {
      allowServiceRole: true,
      serviceRoleKey,
    })
    if (!authz.ok) {
      return new Response(await authz.response.text(), {
        status: authz.response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const sgKey = Deno.env.get('SENDGRID_API_KEY')
    const senderEmail = sgKey ? await getSenderEmail(supabase) : null

    // 1. Find incomplete members who haven't been nudged in the last 24h
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: incomplete, error: fetchErr } = await supabase
      .from('users')
      .select(
        'id,full_name,email,phone_number,platform,region,constituency,chapter,avatar_url,registration_number,status,verification_status,joined_at,followup_sent_at'
      )
      .in('verification_status', ['In Review', 'Processing'])
      .or(`followup_sent_at.is.null,followup_sent_at.lt.${cutoff24h}`)
      .order('joined_at', { ascending: true })
      .limit(50)

    if (fetchErr) throw fetchErr

    let emailsSent = 0
    let smsSent = 0

    for (const member of incomplete ?? []) {
      const missing = getMissingSteps(member as UserRow)
      if (missing.length === 0) continue

      const name = member.full_name || 'Patriot'

      // Send email if available
      if (member.email && sgKey && senderEmail) {
        const sent = await sendFollowupEmail(sgKey, senderEmail, member.email, name, missing)
        if (sent) emailsSent++
      }

      // Send SMS if phone available
      if (member.phone_number) {
        const msg = buildSmsMessage(name, missing)
        const result = await sendSms([member.phone_number], msg)
        if (result.ok) smsSent++
      }

      // Mark followup sent
      await supabase
        .from('users')
        .update({ followup_sent_at: new Date().toISOString() })
        .eq('id', member.id)
    }

    // 2. Run security scan on recently auto-approved members
    const flaggedCount = await runSecurityScan(supabase)

    const summary = {
      incomplete_checked: incomplete?.length ?? 0,
      emails_sent: emailsSent,
      sms_sent: smsSent,
      security_flagged: flaggedCount,
    }

    console.log('[REGISTRATION-FOLLOWUP]', JSON.stringify(summary))

    // Discord summary — only post if there was activity
    if (emailsSent > 0 || smsSent > 0 || flaggedCount > 0) {
      const fields = []
      if (emailsSent > 0 || smsSent > 0) {
        fields.push({
          name: 'Incomplete Nudges Sent',
          value: `📧 ${emailsSent} email${emailsSent !== 1 ? 's' : ''} · 📱 ${smsSent} SMS`,
          inline: true,
        })
        fields.push({
          name: 'Members Checked',
          value: `${incomplete?.length ?? 0}`,
          inline: true,
        })
      }
      if (flaggedCount > 0) {
        fields.push({
          name: 'Security Flags',
          value: `⚠️ ${flaggedCount} member${flaggedCount !== 1 ? 's' : ''} flagged for manual review`,
        })
      }

      await sendDiscordEmbed('members', {
        title: '📋 Registration Followup Report',
        color: flaggedCount > 0 ? 0xdaa520 : 0x006b3f,
        fields,
        footer: { text: 'Automated · runs every 30 min' },
        timestamp: new Date().toISOString(),
      })
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[REGISTRATION-FOLLOWUP-ERROR]', message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
