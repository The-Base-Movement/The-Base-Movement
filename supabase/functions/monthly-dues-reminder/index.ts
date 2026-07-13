/**
 * monthly-dues-reminder
 * ─────────────────────────────────────────────────────────────
 * Daily scheduled edge function that:
 * 1. Creates missing monthly dues obligations for active enrollments
 * 2. Flips past-due obligations from 'due' to 'overdue'
 * 3. Sends email/SMS reminders at exactly three stages (3 days before due,
 *    on the due date, 3 days overdue), honouring the latest append-only
 *    channel consent and deduplicating through the reminder ledger
 *
 * Schedule via pg_cron daily. Requires the service-role key (same pattern
 * as donation-reminder).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendSms, normalizeGhanaPhone } from '../_shared/sms.ts'
import { requireServiceRoleCall } from '../_shared/admin-auth.ts'
import { sendMonthlyDuesDiscordAlert } from '../_shared/monthly-dues-discord.ts'

export type ReminderStage = 'pre_due' | 'due' | 'overdue'

export interface ObligationLike {
  id: string
  member_id: string
  status: string
  due_date: string
}

export interface ConsentLike {
  email_enabled: boolean
  sms_enabled: boolean
  dues_enrollment_enabled: boolean
  recorded_at: string
}

export interface PlannedReminder {
  payment_id: string
  member_id: string
  channel: 'email' | 'sms'
  reminder_stage: ReminderStage
}

const OUTSTANDING = new Set(['due', 'pending', 'failed', 'overdue'])
const PRE_DUE_OFFSET_DAYS = 3
const OVERDUE_OFFSET_DAYS = 3
const DAY_MS = 86_400_000

function utcDay(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Which reminder stage (if any) applies today for an obligation. */
export function reminderStageFor(now: Date, obligation: ObligationLike): ReminderStage | null {
  if (!OUTSTANDING.has(obligation.status)) return null
  const today = utcDay(now.toISOString())
  const due = utcDay(obligation.due_date)
  if (today === due - PRE_DUE_OFFSET_DAYS * DAY_MS) return 'pre_due'
  if (today === due) return 'due'
  if (today === due + OVERDUE_OFFSET_DAYS * DAY_MS) return 'overdue'
  return null
}

/** Latest append-only consent row wins; null when none recorded. */
export function latestConsent<T extends { recorded_at: string }>(rows: T[]): T | null {
  if (!rows.length) return null
  return rows.reduce((latest, row) => (row.recorded_at > latest.recorded_at ? row : latest))
}

/**
 * Plans the channels to remind for one obligation. Consent is never inferred
 * from contact-field presence — no consent row means no reminders.
 */
export function planMemberReminders(
  obligation: ObligationLike,
  stage: ReminderStage | null,
  consent: ConsentLike | null,
  enrollment: { status: string } | null
): PlannedReminder[] {
  if (!stage || !OUTSTANDING.has(obligation.status)) return []
  if (!consent || !consent.dues_enrollment_enabled) return []
  if (!enrollment || !['active', 'pending_activation'].includes(enrollment.status)) return []

  const planned: PlannedReminder[] = []
  if (consent.email_enabled) {
    planned.push({
      payment_id: obligation.id,
      member_id: obligation.member_id,
      channel: 'email',
      reminder_stage: stage,
    })
  }
  if (consent.sms_enabled) {
    planned.push({
      payment_id: obligation.id,
      member_id: obligation.member_id,
      channel: 'sms',
      reminder_stage: stage,
    })
  }
  return planned
}

/** A ledger claim is attempted when unclaimed, or retried after a failure. */
export function shouldAttempt(existing: { status: string } | null): boolean {
  return existing === null || existing.status === 'failed'
}

/** Failure reasons are bounded and must never carry message bodies. */
export function truncateFailureReason(reason: string | undefined | null): string {
  const text = (reason ?? '').trim() || 'unknown error'
  return text.length > 300 ? text.slice(0, 300) : text
}

// ─────────────────────────────────────────────────────────────

function duesEmailHtml(d: {
  name: string
  stage: ReminderStage
  amount: string
  dueDate: string
  payUrl: string
}): string {
  const heading =
    d.stage === 'pre_due'
      ? 'Your monthly dues are due soon'
      : d.stage === 'due'
        ? 'Your monthly dues are due today'
        : 'Your monthly dues are overdue'
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#181d19">
    <h2 style="color:#006B3F;margin:0 0 12px">${heading}</h2>
    <p>Hi ${d.name},</p>
    <p>Your voluntary monthly dues of <strong>${d.amount}</strong> for The Base Movement
    ${d.stage === 'overdue' ? 'were due' : 'are due'} on <strong>${d.dueDate}</strong>.</p>
    <p><a href="${d.payUrl}" style="display:inline-block;background:#006B3F;color:#ffffff;padding:10px 18px;border-radius:4px;text-decoration:none">Pay your dues</a></p>
    <p style="font-size:12px;color:#6f7a71">You receive this because you enabled dues email reminders.
    You can change this at any time in your notification settings.</p>
  </div>`
}

if (import.meta.main) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY') ?? ''
  const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.thebasemovement.org.gh'

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!SENDGRID_KEY) return false
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
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
    return res.ok
  }

  Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
    }
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authz = requireServiceRoleCall(req, SERVICE_KEY)
    if (!authz.ok) return authz.response

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentMonth = `${today.slice(0, 7)}-01`
    const summary = { obligations_created: 0, sent: 0, failed: 0, skipped: 0 }

    // 1. Create missing obligations for enrolled members (idempotent RPC).
    const { data: enrollments } = await supabase
      .from('monthly_dues_enrollments')
      .select('member_id, status')
      .in('status', ['active', 'pending_activation'])

    for (const enrollment of enrollments ?? []) {
      const { data } = await supabase.rpc('ensure_monthly_dues_obligation', {
        p_member_id: enrollment.member_id,
        p_month: currentMonth,
        p_display_currency: null,
        p_exchange_rate_to_ghs: null,
      })
      if (data?.created) summary.obligations_created++
    }

    // 2. Flip past-due obligations to overdue.
    await supabase
      .from('monthly_dues_payments')
      .update({ status: 'overdue' })
      .eq('status', 'due')
      .lt('due_date', today)

    // 3. Select obligations at a reminder stage today.
    const stageDates = [
      new Date(now.getTime() + PRE_DUE_OFFSET_DAYS * DAY_MS),
      now,
      new Date(now.getTime() - OVERDUE_OFFSET_DAYS * DAY_MS),
    ].map((d) => d.toISOString().slice(0, 10))

    const { data: obligations } = await supabase
      .from('monthly_dues_payments')
      .select('id, member_id, status, due_date, amount_ghs, display_amount, display_currency')
      .in('status', ['due', 'pending', 'failed', 'overdue'])
      .in('due_date', stageDates)

    const enrollmentByMember = new Map(
      (enrollments ?? []).map((e: { member_id: string; status: string }) => [e.member_id, e])
    )

    for (const obligation of obligations ?? []) {
      const stage = reminderStageFor(now, obligation)
      if (!stage) continue

      const { data: consentRows } = await supabase
        .from('monthly_dues_consents')
        .select('email_enabled, sms_enabled, dues_enrollment_enabled, recorded_at')
        .eq('member_id', obligation.member_id)
        .order('recorded_at', { ascending: false })
        .limit(1)

      const planned = planMemberReminders(
        obligation,
        stage,
        latestConsent(consentRows ?? []),
        enrollmentByMember.get(obligation.member_id) ?? null
      )
      if (!planned.length) {
        summary.skipped++
        continue
      }

      const { data: member } = await supabase
        .from('users')
        .select('full_name, email, phone_number')
        .eq('id', obligation.member_id)
        .maybeSingle()

      for (const reminder of planned) {
        // Unique-stage claim: only one send per (payment, channel, stage).
        const { data: existing } = await supabase
          .from('monthly_dues_reminders')
          .select('id, status')
          .eq('payment_id', reminder.payment_id)
          .eq('channel', reminder.channel)
          .eq('reminder_stage', reminder.reminder_stage)
          .maybeSingle()

        if (!shouldAttempt(existing)) continue

        let claimId = existing?.id ?? null
        if (!claimId) {
          const { data: claimed, error: claimError } = await supabase
            .from('monthly_dues_reminders')
            .insert({ ...reminder, status: 'queued' })
            .select('id')
            .maybeSingle()
          // A unique violation means another run claimed it — skip safely.
          if (claimError || !claimed) continue
          claimId = claimed.id
        }

        const firstName = member?.full_name?.split(' ')[0] ?? 'Compatriot'
        const amount = `${obligation.display_currency} ${Number(obligation.display_amount).toFixed(2)} (₵${Number(obligation.amount_ghs).toFixed(2)})`
        const payUrl = `${SITE_URL}/dashboard/donations`

        let ok = false
        let failure: string | null = null
        try {
          if (reminder.channel === 'email') {
            if (member?.email) {
              ok = await sendEmail(
                member.email,
                stage === 'overdue'
                  ? 'Your Base Movement monthly dues are overdue'
                  : 'Your Base Movement monthly dues',
                duesEmailHtml({
                  name: firstName,
                  stage,
                  amount,
                  dueDate: obligation.due_date,
                  payUrl,
                })
              )
              if (!ok) failure = 'email provider rejected the send'
            } else {
              failure = 'member has no email address'
            }
          } else {
            if (member?.phone_number) {
              const message =
                stage === 'pre_due'
                  ? `Hi ${firstName}, your ${amount} Base Movement monthly dues are due on ${obligation.due_date}. Pay at ${payUrl}`
                  : stage === 'due'
                    ? `Hi ${firstName}, your ${amount} Base Movement monthly dues are due today. Pay at ${payUrl}`
                    : `Hi ${firstName}, your ${amount} Base Movement monthly dues are overdue. Pay at ${payUrl}`
              const result = await sendSms([normalizeGhanaPhone(member.phone_number)], message)
              ok = result.success
              if (!ok) failure = 'sms provider rejected the send'
            } else {
              failure = 'member has no phone number'
            }
          }
        } catch (err) {
          failure = err instanceof Error ? err.message : String(err)
        }

        await supabase
          .from('monthly_dues_reminders')
          .update({
            status: ok ? 'sent' : failure?.startsWith('member has no') ? 'skipped' : 'failed',
            attempted_at: new Date().toISOString(),
            failure_reason: ok ? null : truncateFailureReason(failure),
          })
          .eq('id', claimId)

        if (ok) summary.sent++
        else if (failure?.startsWith('member has no')) summary.skipped++
        else summary.failed++
      }
    }

    console.log('[MONTHLY-DUES-REMINDER]', JSON.stringify(summary))
    if (summary.sent > 0 || summary.failed > 0) {
      await sendMonthlyDuesDiscordAlert({
        type: 'reminder_summary',
        sent: summary.sent,
        failed: summary.failed,
        skipped: summary.skipped,
      })
    }
    return new Response(JSON.stringify(summary), {
      headers: { 'Content-Type': 'application/json' },
    })
  })
}
