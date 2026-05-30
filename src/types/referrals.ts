// src/types/referrals.ts

export interface ReferredMember {
  id: string
  name: string
  registrationNumber: string
  platform: 'GHANA' | 'DIASPORA'
  region?: string
  constituency?: string
  country?: string
  status: string
  avatarUrl?: string | null
  joinedAt: string
  verificationBonusAwarded: boolean
}

export interface ReferralStats {
  total: number
  active: number
  pending: number
  pointsEarned: number
}

export interface ReferralLeaderboardEntry {
  referrerId: string
  name: string
  registrationNumber: string
  avatarUrl?: string | null
  referralCount: number
  isCurrentUser: boolean
}
