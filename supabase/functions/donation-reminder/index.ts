/**
 * donation-reminder
 * ─────────────────────────────────────────────────────────────
 * Scheduled edge function that:
 * 1. Finds Hubtel donations with status='Pending' older than 6 hours
 * 2. Sends email + SMS reminders to donors (once per donation)
 * 3. Auto-cancels donations older than 7 days
 * 4. Posts a Discord summary
 *
 * Schedule via pg_cron every 6 hours (cron expression: 0 star-slash-6 star star star)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { pendingDonationEmail } from '../_shared/email-templates.ts'
import { sendSms, normalizeGhanaPhone } from '../_shared/sms.ts'
import { requireServiceRoleCall } from '../_shared/admin-auth.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY') ?? ''
const DISCORD_WEBHOOK = Deno.env.get('DISCORD_ALERTS_WEBHOOK_URL') ?? ''
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.thebasemovement.org.gh'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_KEY) return
  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'info@thebasemovement.org.gh', name: 'The Base Movement' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
}

async function postDiscord(content: string) {
  if (!DISCORD_WEBHOOK) return
  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  }).catch(() => {})
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    })
  }

  const authz = requireServiceRoleCall(req, SERVICE_KEY)
  if (!authz.ok) {
    return new Response(await authz.response.text(), {
      status: authz.response.status,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    })
  }

  const now = Date.now()
  const sixHoursAgo = new Date(now - SIX_HOURS_MS).toISOString()
  const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS).toISOString()

  // 1. Auto-cancel donations older than 7 days
  const { data: expired } = await supabase
    .from('donations')
    .select('id, full_name')
    .eq('status', 'Pending')
    .eq('payment_method', 'Hubtel')
    .lt('created_at', sevenDaysAgo)

  let cancelledCount = 0
  if (expired?.length) {
    await supabase
      .from('donations')
      .update({ status: 'Cancelled' })
      .in(
        'id',
        expired.map((d) => d.id)
      )
    cancelledCount = expired.length
  }

  // 2. Find pending donations older than 6 hours that haven't been reminded yet
  const { data: pending } = await supabase
    .from('donations')
    .select('id, full_name, phone, amount, reference, created_at, member_id')
    .eq('status', 'Pending')
    .eq('payment_method', 'Hubtel')
    .lt('created_at', sixHoursAgo)
    .is('reminder_sent_at', null)

  let remindedCount = 0

  for (const d of pending ?? []) {
    // Look up member email
    let email: string | null = null
    if (d.member_id) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', d.member_id)
        .maybeSingle()
      email = user?.email ?? null
    }

    const donateUrl = `${SITE_URL}/donate`
    const createdDate = new Date(d.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const amountStr = Number(d.amount).toLocaleString()
    const firstName = d.full_name?.split(' ')[0] ?? 'Compatriot'

    // Send email
    if (email) {
      const html = pendingDonationEmail({
        name: firstName,
        amount: amountStr,
        reference: d.reference ?? d.id,
        createdAt: createdDate,
        donateUrl,
      })
      await sendEmail(email, 'Complete your donation to The Base Movement', html)
    }

    // Send SMS
    if (d.phone) {
      const smsMsg = `Hi ${firstName}, your GH₵${amountStr} donation to The Base Movement is pending. Complete it at ${donateUrl} or it will be cancelled in 7 days.`
      await sendSms([normalizeGhanaPhone(d.phone)], smsMsg)
    }

    // Mark as reminded
    await supabase
      .from('donations')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', d.id)

    remindedCount++
  }

  // 3. Discord summary
  if (remindedCount > 0 || cancelledCount > 0) {
    const parts = []
    if (remindedCount > 0)
      parts.push(`📬 Reminded ${remindedCount} donor(s) about pending Hubtel payments`)
    if (cancelledCount > 0)
      parts.push(`🚫 Auto-cancelled ${cancelledCount} donation(s) older than 7 days`)
    await postDiscord(`**Donation Reminder Report**\n${parts.join('\n')}`)
  }

  return new Response(JSON.stringify({ reminded: remindedCount, cancelled: cancelledCount }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
