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

  // ── Admin methods ──

  async getAdminReferralStats(): Promise<{
    totalReferrals: number
    totalPointsAwarded: number
    topReferrers: {
      id: string
      name: string
      avatarUrl: string | null
      regNo: string
      count: number
      points: number
    }[]
    monthlyTrend: { month: string; count: number }[]
  }> {
    const [refRes, awardsRes, leaderboardRes] = await Promise.all([
      supabase.from('users').select('id, referred_by, joined_at').not('referred_by', 'is', null),
      supabase.from('referral_awards').select('referrer_id, points'),
      supabase.rpc('get_referral_leaderboard'),
    ])

    const referrals = refRes.data ?? []
    const awards = awardsRes.data ?? []
    const totalReferrals = referrals.length
    const totalPointsAwarded = awards.reduce((s, a) => s + (a.points ?? 0), 0)

    const pointsMap: Record<string, number> = {}
    for (const a of awards) {
      pointsMap[a.referrer_id] = (pointsMap[a.referrer_id] ?? 0) + (a.points ?? 0)
    }

    const topReferrers = (
      (leaderboardRes.data ?? []) as {
        referrer_id: string
        full_name: string
        registration_number: string
        avatar_url: string | null
        referral_count: number
      }[]
    )
      .slice(0, 20)
      .map((r) => ({
        id: r.referrer_id,
        name: r.full_name,
        avatarUrl: r.avatar_url,
        regNo: r.registration_number,
        count: Number(r.referral_count),
        points: pointsMap[r.referrer_id] ?? 0,
      }))

    const now = new Date()
    const monthlyTrend: { month: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      const label = start.toLocaleString('default', { month: 'short', year: '2-digit' })
      const count = referrals.filter((r) => {
        const d = new Date(r.joined_at)
        return d >= start && d < end
      }).length
      monthlyTrend.push({ month: label, count })
    }

    return { totalReferrals, totalPointsAwarded, topReferrers, monthlyTrend }
  },
}
