// Royalty Points — finance-managed member reward ledger.

export interface RoyaltyPointsSettings {
  referralRegistrationPoints: number
  referralVerificationPoints: number
  storePointsPerGhs: number
  monthlyDuesPointsPerGhs: number
  donationPointsPerGhs: number
  updatedAt: string | null
}

export interface RoyaltyPointsSummary {
  totalPoints: number
  membersWithPoints: number
  pointsThisMonth: number
  manualAdjustments: number
}

export interface RoyaltyPointsMemberBalance {
  userId: string
  name: string
  registrationNumber: string
  balance: number
  lastActivity: string | null
}

export type RoyaltyPointsSource =
  | 'referral_registration'
  | 'referral_verification'
  | 'store_purchase'
  | 'monthly_dues'
  | 'donation'
  | 'rally_attendance'
  | 'manual_adjustment'

export interface RoyaltyPointsLedgerEntry {
  id: string
  userId: string | null
  name: string | null
  registrationNumber: string | null
  points: number
  sourceType: RoyaltyPointsSource | null
  sourceReference: string | null
  reason: string | null
  createdAt: string | null
}

export interface RoyaltyPointsAdminData {
  settings: RoyaltyPointsSettings | null
  summary: RoyaltyPointsSummary
  balances: RoyaltyPointsMemberBalance[]
  ledger: RoyaltyPointsLedgerEntry[]
}
