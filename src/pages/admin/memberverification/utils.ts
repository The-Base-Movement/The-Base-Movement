import type { PendingVerification } from '@/services/adminService'

export const PAGE_SIZE = 10

export const STATUS_OPTIONS: (PendingVerification['status'] | 'All')[] = [
  'All',
  'In Review',
  'Processing',
  'Flagged',
  'Approved',
  'Rejected',
]

export function statusPill(status: PendingVerification['status']) {
  if (status === 'Approved') return 'pill pill-ok'
  if (status === 'In Review') return 'pill pill-warn'
  if (status === 'Processing') return 'pill pill-warn'
  if (status === 'Flagged') return 'pill pill-err'
  if (status === 'Rejected') return 'pill pill-err'
  return 'pill pill-mute'
}
