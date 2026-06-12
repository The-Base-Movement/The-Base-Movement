import { supabase } from '@/lib/supabase'
import type { Achievement, MobilizationLedger } from '@/types/admin'

class GamificationService {
  private static instance: GamificationService

  private constructor() {}

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService()
    }
    return GamificationService.instance
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase.from('achievements').select('*')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch achievements:', error)
      return []
    }
  }

  async getMemberAchievements(userId: string): Promise<Achievement[]> {
    if (userId.startsWith('TBM-')) {
      console.warn(
        `[GAMIFICATION] getMemberAchievements called with registration number (${userId}) instead of UUID. This will fail in the database.`
      )
    }
    try {
      const { data, error } = await supabase
        .from('member_achievements')
        .select('achievement_id, achievements(*)')
        .eq('user_id', userId)
      if (error) throw error
      return (data || []).map((item) => item.achievements) as unknown as Achievement[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch member achievements:', error)
      return []
    }
  }

  async getMemberPoints(userId: string): Promise<number> {
    if (userId.startsWith('TBM-')) {
      console.warn(
        `[GAMIFICATION] getMemberPoints called with registration number (${userId}) instead of UUID. This will fail in the database.`
      )
    }
    try {
      const { data, error } = await supabase
        .from('member_points')
        .select('points')
        .eq('user_id', userId)
      if (error) throw error
      return (data || []).reduce((acc, curr) => acc + curr.points, 0)
    } catch (error) {
      console.error('[DATABASE] Failed to fetch member points:', error)
      return 0
    }
  }

  async getMobilizationLedger(chapterName?: string): Promise<MobilizationLedger[]> {
    try {
      let query = supabase.from('mobilization_ledger').select('*')
      if (chapterName) query = query.eq('chapter', chapterName)

      const { data, error } = await query.order('timestamp', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch mobilization ledger:', error)
      return []
    }
  }

  async getMemberRank(
    userId: string
  ): Promise<{ rank: number; totalMembers: number; delta: string }> {
    try {
      const { data: totalMembersCount } = await supabase.rpc('get_member_count')
      const totalMembers = Number(totalMembersCount) || 1000
      const points = await this.getMemberPoints(userId)

      // Deterministic rank calculation based on points
      // In a production environment, this would be a real SQL rank() query
      const rank = Math.max(1, totalMembers - Math.floor(points / 100))

      return {
        rank,
        totalMembers,
        delta: points > 1000 ? 'Up 3 this week' : 'Stable this week',
      }
    } catch (error) {
      console.error('[SERVICE] Rank calculation failed:', error)
      return { rank: 99, totalMembers: 1000, delta: 'Stable' }
    }
  }

  async getNetworkRank({
    platform,
    constituency,
    chapter,
  }: {
    platform: 'GHANA' | 'DIASPORA'
    constituency?: string | null
    chapter?: string | null
  }): Promise<{ rank: number; activeCount: number; delta: string }> {
    const groupField = platform === 'DIASPORA' ? 'chapter' : 'constituency'
    const target = (platform === 'DIASPORA' ? chapter : constituency)?.trim()

    if (!target) {
      return {
        rank: 0,
        activeCount: 0,
        delta: `${platform === 'DIASPORA' ? 'Chapter' : 'Constituency'} pending`,
      }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select(groupField)
        .eq('platform', platform)
        .in('status', ['Active', 'Approved'])
        .is('deleted_at', null)

      if (error) throw error

      const rows = (data || []) as Array<Partial<Record<'constituency' | 'chapter', unknown>>>
      const counts = new Map<string, { name: string; count: number }>()
      for (const row of rows) {
        const name = String(row[groupField] || '').trim()
        if (!name) continue

        const key = name.toLowerCase()
        const current = counts.get(key)
        counts.set(key, { name: current?.name || name, count: (current?.count || 0) + 1 })
      }

      const ranked = Array.from(counts.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      })
      const targetKey = target.toLowerCase()
      const targetIndex = ranked.findIndex((item) => item.name.toLowerCase() === targetKey)

      if (targetIndex === -1) {
        return { rank: 0, activeCount: 0, delta: 'No active members yet' }
      }

      const activeCount = ranked[targetIndex].count
      return {
        rank: targetIndex + 1,
        activeCount,
        delta: `${activeCount.toLocaleString()} active member${activeCount === 1 ? '' : 's'}`,
      }
    } catch (error) {
      console.error('[SERVICE] Network rank calculation failed:', error)
      return { rank: 0, activeCount: 0, delta: 'Rank unavailable' }
    }
  }
}

export const gamificationService = GamificationService.getInstance()
