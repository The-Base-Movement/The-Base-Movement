/**
 * @file monthlyDues.ts
 * @description Pure UTC calendar helpers for the voluntary monthly dues system:
 * dues-month identity, due/overdue date computation, reminder-stage selection,
 * and member payment summaries. No Supabase access here — see
 * src/services/monthlyDuesService.ts for data access.
 */

export type DuesReminderStage = 'pre_due' | 'due' | 'overdue'

export interface DuesObligationLike {
  status: string
  /** ISO calendar date (YYYY-MM-DD) the obligation is due */
  dueDate: string
}

export interface DuesPaymentLike {
  status: string
  amount_ghs: number | string
  dues_month: string
}

export interface MemberDuesSummary {
  totalPaidGhs: number
  totalOutstandingGhs: number
  paidCount: number
  outstandingCount: number
}

/** Days before/after the due date at which reminders fire. */
export const PRE_DUE_OFFSET_DAYS = 3
export const OVERDUE_OFFSET_DAYS = 3

/** Obligation statuses that still owe money and may receive reminders. */
const OUTSTANDING_STATUSES = new Set(['due', 'pending', 'failed', 'overdue'])

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function utcDateFromIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Returns the dues-month identity (first day of the month, YYYY-MM-01)
 * for any date, using the UTC calendar.
 */
export function getDuesMonth(date: Date): string {
  return toIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)))
}

/**
 * Computes the due date and overdue (grace-period end) date for a dues month.
 * The due day is clamped to the last day of short months.
 */
export function getDuesDates(
  month: string,
  dueDay: number,
  gracePeriodDays: number
): { dueDate: string; overdueDate: string } {
  const start = utcDateFromIso(month)
  const lastDay = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)
  ).getUTCDate()
  const clampedDay = Math.min(Math.max(1, Math.trunc(dueDay)), lastDay)
  const due = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), clampedDay))
  const overdue = new Date(due)
  overdue.setUTCDate(overdue.getUTCDate() + Math.max(0, Math.trunc(gracePeriodDays)))
  return { dueDate: toIsoDate(due), overdueDate: toIsoDate(overdue) }
}

/**
 * Returns which reminder stage (if any) applies today for an obligation.
 * Stages fire on exact UTC days: three days before due, on the due date,
 * and three days after. Paid/waived/cancelled obligations never remind.
 */
export function getReminderStage(
  now: Date,
  obligation: DuesObligationLike
): DuesReminderStage | null {
  if (!OUTSTANDING_STATUSES.has(obligation.status)) return null

  const today = utcDateFromIso(toIsoDate(now)).getTime()
  const due = utcDateFromIso(obligation.dueDate).getTime()
  const dayMs = 86_400_000

  if (today === due - PRE_DUE_OFFSET_DAYS * dayMs) return 'pre_due'
  if (today === due) return 'due'
  if (today === due + OVERDUE_OFFSET_DAYS * dayMs) return 'overdue'
  return null
}

/**
 * Totals a member's dues history into paid and outstanding GHS amounts.
 * Waived and cancelled obligations count toward neither bucket.
 */
export function getMemberDuesSummary(payments: DuesPaymentLike[]): MemberDuesSummary {
  const summary: MemberDuesSummary = {
    totalPaidGhs: 0,
    totalOutstandingGhs: 0,
    paidCount: 0,
    outstandingCount: 0,
  }
  for (const payment of payments) {
    const amount = Number(payment.amount_ghs)
    if (!Number.isFinite(amount)) continue
    if (payment.status === 'paid') {
      summary.totalPaidGhs = Math.round((summary.totalPaidGhs + amount) * 100) / 100
      summary.paidCount += 1
    } else if (OUTSTANDING_STATUSES.has(payment.status)) {
      summary.totalOutstandingGhs = Math.round((summary.totalOutstandingGhs + amount) * 100) / 100
      summary.outstandingCount += 1
    }
  }
  return summary
}
