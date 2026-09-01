import type { YouthWingStatus } from '@/services/youthWingService'

/** Status vocabulary for the Youth Wing department. Kept apart from the adult
 * member statuses on purpose: a youth is never "Verified", only consented. */
export const YOUTH_STATUS_META: Record<YouthWingStatus, { label: string; pill: string }> = {
  PENDING_CONSENT: { label: 'Pending consent', pill: 'pill-warn' },
  ACTIVE: { label: 'Active', pill: 'pill-ok' },
  REJECTED: { label: 'Not activated', pill: 'pill-err' },
  GRADUATED: { label: 'Graduated at 18', pill: 'pill-mute' },
}

export function youthKpiBar(status: YouthWingStatus): string {
  if (status === 'ACTIVE') return 'hsl(var(--primary))'
  if (status === 'PENDING_CONSENT') return 'hsl(var(--accent))'
  if (status === 'REJECTED') return 'hsl(var(--destructive))'
  return 'hsl(var(--on-surface))'
}

/** Age buckets used across the Youth Wing dashboards. */
export const YOUTH_AGE_BUCKETS = [14, 15, 16, 17] as const
