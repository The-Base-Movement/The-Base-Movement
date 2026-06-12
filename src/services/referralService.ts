// src/services/referralService.ts
import { supabase } from '@/lib/supabase'
import type { ReferredMember, ReferralLeaderboardEntry } from '@/types/referrals'

export const referralService = {
  async getMyReferrals(): Promise<ReferredMember[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    // Resolve current user's registration_number
    const { data: me } = await supabase
      .from('users')
      .select('registration_number')
      .eq('id', user.id)
      .single()
    if (!me?.registration_number) return []

    // Fetch referred members
    const { data: referred, error } = await supabase
      .from('users')
      .select(
        'id, full_name, registration_number, platform, region, constituency, country, status, avatar_url, joined_at'
      )
      .eq('referred_by', me.registration_number)
      .is('deleted_at', null)
      .order('joined_at', { ascending: false })

    if (error || !referred) {
      console.warn('[referralService] getMyReferrals:', error)
      return []
    }

    // Determine which referred members have had the verification bonus awarded
    let awardedSet = new Set<string>()
    if (referred.length > 0) {
      const { data: awards } = await supabase
        .from('referral_awards')
        .select('referred_member_id')
        .eq('referrer_id', user.id)
        .eq('award_type', 'verification')
        .in(
          'referred_member_id',
          referred.map((u) => u.id)
        )
      awardedSet = new Set(awards?.map((a) => a.referred_member_id) ?? [])
    }

    return referred.map((u) => ({
      id: u.id,
      name: u.full_name,
      registrationNumber: u.registration_number,
      platform: u.platform as 'GHANA' | 'DIASPORA',
      region: u.region ?? undefined,
      constituency: u.constituency ?? undefined,
      country: u.country ?? undefined,
      status: u.status,
      avatarUrl: u.avatar_url,
      joinedAt: u.joined_at,
      verificationBonusAwarded: awardedSet.has(u.id),
    }))
  },

  async getPointsEarned(): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { data: awards } = await supabase
      .from('referral_awards')
      .select('points')
      .eq('referrer_id', user.id)
    return awards?.reduce((sum, a) => sum + (a.points ?? 0), 0) ?? 0
  },

  async getReferralLeaderboard(currentUserRegNo: string): Promise<ReferralLeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_referral_leaderboard')
    if (error || !data) {
      console.warn('[referralService] getReferralLeaderboard:', error)
      return []
    }
    return (
      data as {
        referrer_id: string
        full_name: string
        registration_number: string
        avatar_url: string | null
        referral_count: number
      }[]
    ).map((row) => ({
      referrerId: row.referrer_id,
      name: row.full_name,
      registrationNumber: row.registration_number,
      avatarUrl: row.avatar_url,
      referralCount: Number(row.referral_count),
      isCurrentUser: row.registration_number === currentUserRegNo,
    }))
  },
}
