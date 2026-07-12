import { describe, expect, it } from 'vitest'
import {
  getDuesMonth,
  getDuesDates,
  getReminderStage,
  getMemberDuesSummary,
  type DuesObligationLike,
  type DuesPaymentLike,
} from '@/lib/monthlyDues'

const obligation: DuesObligationLike = {
  status: 'due',
  dueDate: '2026-02-28',
}

const paidObligation: DuesObligationLike = {
  status: 'paid',
  dueDate: '2026-02-28',
}

describe('getDuesMonth', () => {
  it('normalizes any date to the first day of its month', () => {
    expect(getDuesMonth(new Date('2026-02-15T13:45:00Z'))).toBe('2026-02-01')
    expect(getDuesMonth(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-01')
  })

  it('is stable for a date already at the month start', () => {
    expect(getDuesMonth(new Date('2026-02-01T00:00:00Z'))).toBe('2026-02-01')
  })
})

describe('getDuesDates', () => {
  it('computes due and overdue dates from the month, due day, and grace period', () => {
    expect(getDuesDates('2026-02-01', 28, 7)).toEqual({
      dueDate: '2026-02-28',
      overdueDate: '2026-03-07',
    })
  })

  it('clamps the due day to the last day of short months', () => {
    expect(getDuesDates('2026-02-01', 30, 3)).toEqual({
      dueDate: '2026-02-28',
      overdueDate: '2026-03-03',
    })
    expect(getDuesDates('2026-04-01', 31, 0)).toEqual({
      dueDate: '2026-04-30',
      overdueDate: '2026-04-30',
    })
  })

  it('handles ordinary due days without clamping', () => {
    expect(getDuesDates('2026-06-01', 15, 3)).toEqual({
      dueDate: '2026-06-15',
      overdueDate: '2026-06-18',
    })
  })
})

describe('getReminderStage', () => {
  it('returns pre_due three days before the due date', () => {
    expect(getReminderStage(new Date('2026-02-25T09:00:00Z'), obligation)).toBe('pre_due')
  })

  it('returns due on the due date', () => {
    expect(getReminderStage(new Date('2026-02-28T09:00:00Z'), obligation)).toBe('due')
  })

  it('returns overdue three days after the due date', () => {
    expect(getReminderStage(new Date('2026-03-03T09:00:00Z'), obligation)).toBe('overdue')
  })

  it('returns null on non-stage days', () => {
    expect(getReminderStage(new Date('2026-02-20T09:00:00Z'), obligation)).toBeNull()
    expect(getReminderStage(new Date('2026-02-27T09:00:00Z'), obligation)).toBeNull()
    expect(getReminderStage(new Date('2026-03-10T09:00:00Z'), obligation)).toBeNull()
  })

  it('suppresses reminders for paid obligations', () => {
    expect(getReminderStage(new Date('2026-02-28T09:00:00Z'), paidObligation)).toBeNull()
  })

  it('suppresses reminders for waived and cancelled obligations', () => {
    expect(
      getReminderStage(new Date('2026-02-28T09:00:00Z'), { ...obligation, status: 'waived' })
    ).toBeNull()
    expect(
      getReminderStage(new Date('2026-02-28T09:00:00Z'), { ...obligation, status: 'cancelled' })
    ).toBeNull()
  })
})

describe('getMemberDuesSummary', () => {
  const payments: DuesPaymentLike[] = [
    { status: 'paid', amount_ghs: 50, dues_month: '2026-01-01' },
    { status: 'paid', amount_ghs: 50, dues_month: '2026-02-01' },
    { status: 'due', amount_ghs: 50, dues_month: '2026-03-01' },
    { status: 'overdue', amount_ghs: 50, dues_month: '2026-04-01' },
    { status: 'waived', amount_ghs: 50, dues_month: '2026-05-01' },
  ]

  it('totals paid and outstanding amounts', () => {
    expect(getMemberDuesSummary(payments)).toEqual({
      totalPaidGhs: 100,
      totalOutstandingGhs: 100,
      paidCount: 2,
      outstandingCount: 2,
    })
  })

  it('returns zeros for an empty history', () => {
    expect(getMemberDuesSummary([])).toEqual({
      totalPaidGhs: 0,
      totalOutstandingGhs: 0,
      paidCount: 0,
      outstandingCount: 0,
    })
  })
})
