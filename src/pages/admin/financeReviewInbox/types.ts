import type { FinanceRequest } from '@/services/financeService'

export interface TierLeader {
  id: string
  name: string
  avatarUrl: string | null
  tier: 1 | 2 | 3
}

export type ModalAction = 'Approved' | 'Rejected' | 'Acknowledged'

export interface ReviewModal {
  request: FinanceRequest
  action: ModalAction
}
