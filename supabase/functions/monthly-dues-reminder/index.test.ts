import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  latestConsent,
  planMemberReminders,
  reminderStageFor,
  shouldAttempt,
  truncateFailureReason,
} from './index.ts'

const obligation = {
  id: 'pay-1',
  member_id: 'user-a',
  status: 'due',
  due_date: '2026-02-28',
}

const consent = {
  email_enabled: true,
  sms_enabled: true,
  dues_enrollment_enabled: true,
  recorded_at: '2026-01-01T00:00:00Z',
}

const enrollment = { status: 'active' }

Deno.test('reminder stages fire on the exact pre-due, due, and overdue days', () => {
  assertEquals(reminderStageFor(new Date('2026-02-25T06:00:00Z'), obligation), 'pre_due')
  assertEquals(reminderStageFor(new Date('2026-02-28T06:00:00Z'), obligation), 'due')
  assertEquals(reminderStageFor(new Date('2026-03-03T06:00:00Z'), obligation), 'overdue')
  assertEquals(reminderStageFor(new Date('2026-02-20T06:00:00Z'), obligation), null)
})

Deno.test('paid obligations never remind', () => {
  assertEquals(
    reminderStageFor(new Date('2026-02-28T06:00:00Z'), { ...obligation, status: 'paid' }),
    null
  )
  assertEquals(
    planMemberReminders({ ...obligation, status: 'paid' }, 'due', consent, enrollment),
    []
  )
})

Deno.test('both consented channels are planned', () => {
  assertEquals(planMemberReminders(obligation, 'due', consent, enrollment), [
    { payment_id: 'pay-1', member_id: 'user-a', channel: 'email', reminder_stage: 'due' },
    { payment_id: 'pay-1', member_id: 'user-a', channel: 'sms', reminder_stage: 'due' },
  ])
})

Deno.test('disabled channels are suppressed independently', () => {
  assertEquals(
    planMemberReminders(obligation, 'due', { ...consent, email_enabled: false }, enrollment),
    [{ payment_id: 'pay-1', member_id: 'user-a', channel: 'sms', reminder_stage: 'due' }]
  )
  assertEquals(
    planMemberReminders(obligation, 'due', { ...consent, sms_enabled: false }, enrollment),
    [{ payment_id: 'pay-1', member_id: 'user-a', channel: 'email', reminder_stage: 'due' }]
  )
})

Deno.test('opt-out and missing consent suppress all reminders', () => {
  assertEquals(
    planMemberReminders(
      obligation,
      'due',
      { ...consent, dues_enrollment_enabled: false },
      enrollment
    ),
    []
  )
  assertEquals(planMemberReminders(obligation, 'due', null, enrollment), [])
  assertEquals(planMemberReminders(obligation, 'due', consent, { status: 'opted_out' }), [])
})

Deno.test('the newest consent row wins', () => {
  const older = { ...consent, email_enabled: true, recorded_at: '2026-01-01T00:00:00Z' }
  const newer = { ...consent, email_enabled: false, recorded_at: '2026-02-01T00:00:00Z' }
  assertEquals(latestConsent([older, newer]), newer)
  assertEquals(latestConsent([newer, older]), newer)
  assertEquals(latestConsent([]), null)
})

Deno.test('claims are unique per stage but failed sends stay retryable', () => {
  assertEquals(shouldAttempt(null), true)
  assertEquals(shouldAttempt({ status: 'failed' }), true)
  assertEquals(shouldAttempt({ status: 'sent' }), false)
  assertEquals(shouldAttempt({ status: 'skipped' }), false)
  assertEquals(shouldAttempt({ status: 'queued' }), false)
})

Deno.test('failure reasons are bounded and PII-free-friendly', () => {
  assertEquals(truncateFailureReason('boom'), 'boom')
  assertEquals(truncateFailureReason('x'.repeat(600)).length, 300)
  assertEquals(truncateFailureReason(undefined), 'unknown error')
})
