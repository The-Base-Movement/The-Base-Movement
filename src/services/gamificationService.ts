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
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch achievements:', error)
      return []
    }
  }

  async getMemberAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('member_achievements')
        .select('achievement_id, achievements(*)')
        .eq('user_id', userId)
      if (error) throw error
      return (data || []).map(item => item.achievements) as unknown as Achievement[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch member achievements:', error)
      return []
    }
  }

  async getMemberPoints(userId: string): Promise<number> {
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
}

export const gamificationService = GamificationService.getInstance()
