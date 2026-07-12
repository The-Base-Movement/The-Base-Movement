import { supabase } from '@/lib/supabase'
import type {
  RoyaltyPointsAdminData,
  RoyaltyPointsLedgerEntry,
  RoyaltyPointsMemberBalance,
  RoyaltyPointsSettings,
  RoyaltyPointsSource,
} from '@/types/royaltyPoints'

/**
 * Supabase integration layer for the Royalty Points system. All reads and
 * mutations go through finance-gated RPCs — awards themselves are written by
 * database triggers, never from the browser.
 */

interface SettingsRow {
  referral_registration_points: number
  referral_verification_points: number
  store_points_per_ghs: number
  monthly_dues_points_per_ghs: number
  donation_points_per_ghs: number
  updated_at: string | null
}

interface AdminPayload {
  settings: SettingsRow | null
  summary: {
    total_points: number
    members_with_points: number
    points_this_month: number
    manual_adjustments: number
  }
  balances: {
    user_id: string
    full_name: string
    registration_number: string
    balance: number
    last_activity: string | null
  }[]
  ledger: {
    id: string
    user_id: string | null
    full_name: string | null
    registration_number: string | null
    points: number
    source_type: RoyaltyPointsSource | null
    source_reference: string | null
    reason: string | null
    created_at: string | null
  }[]
}

function mapSettings(row: SettingsRow | null): RoyaltyPointsSettings | null {
  if (!row) return null
  return {
    referralRegistrationPoints: Number(row.referral_registration_points),
    referralVerificationPoints: Number(row.referral_verification_points),
    storePointsPerGhs: Number(row.store_points_per_ghs),
    monthlyDuesPointsPerGhs: Number(row.monthly_dues_points_per_ghs),
    donationPointsPerGhs: Number(row.donation_points_per_ghs),
    updatedAt: row.updated_at,
  }
}

export const royaltyPointsService = {
  /** Full finance-page payload: settings, KPI summary, balances, ledger. */
  async getAdminData(): Promise<RoyaltyPointsAdminData> {
    const { data, error } = await supabase.rpc('get_royalty_points_admin')
    if (error) throw error
    const payload = data as AdminPayload
    const balances: RoyaltyPointsMemberBalance[] = (payload.balances ?? []).map((b) => ({
      userId: b.user_id,
      name: b.full_name,
      registrationNumber: b.registration_number,
      balance: Number(b.balance),
      lastActivity: b.last_activity,
    }))
    const ledger: RoyaltyPointsLedgerEntry[] = (payload.ledger ?? []).map((l) => ({
      id: l.id,
      userId: l.user_id,
      name: l.full_name,
      registrationNumber: l.registration_number,
      points: Number(l.points),
      sourceType: l.source_type,
      sourceReference: l.source_reference,
      reason: l.reason,
      createdAt: l.created_at,
    }))
    return {
      settings: mapSettings(payload.settings),
      summary: {
        totalPoints: Number(payload.summary?.total_points ?? 0),
        membersWithPoints: Number(payload.summary?.members_with_points ?? 0),
        pointsThisMonth: Number(payload.summary?.points_this_month ?? 0),
        manualAdjustments: Number(payload.summary?.manual_adjustments ?? 0),
      },
      balances,
      ledger,
    }
  },

  /** Update the five earning rates (finance-gated; audited server-side). */
  async updateSettings(settings: {
    referralRegistrationPoints: number
    referralVerificationPoints: number
    storePointsPerGhs: number
    monthlyDuesPointsPerGhs: number
    donationPointsPerGhs: number
  }): Promise<void> {
    const { error } = await supabase.rpc('update_royalty_points_settings', {
      p_referral_registration: settings.referralRegistrationPoints,
      p_referral_verification: settings.referralVerificationPoints,
      p_store_per_ghs: settings.storePointsPerGhs,
      p_dues_per_ghs: settings.monthlyDuesPointsPerGhs,
      p_donation_per_ghs: settings.donationPointsPerGhs,
    })
    if (error) throw error
  },

  /** Lightweight member lookup for the manual adjustment dialog. */
  async searchMembers(
    query: string
  ): Promise<{ id: string; name: string; registrationNumber: string }[]> {
    const q = query.trim()
    if (!q) return []
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, registration_number')
      .or(`full_name.ilike.%${q}%,registration_number.ilike.%${q}%`)
      .is('deleted_at', null)
      .limit(10)
    if (error) throw error
    return (data ?? []).map((u) => ({
      id: u.id,
      name: u.full_name,
      registrationNumber: u.registration_number,
    }))
  },

  /** Signed manual adjustment with a mandatory reason (finance-gated). */
  async adjustMemberPoints(memberId: string, points: number, reason: string): Promise<void> {
    const { error } = await supabase.rpc('adjust_member_royalty_points', {
      p_member_id: memberId,
      p_points: points,
      p_reason: reason,
    })
    if (error) throw error
  },
}
