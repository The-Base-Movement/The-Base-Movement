import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import type { Broadcast, Notification, LeaderboardEntry, MovementPulse, Milestone } from '@/types/admin'

class TacticalService {
  private static instance: TacticalService

  private constructor() {}

  public static getInstance(): TacticalService {
    if (!TacticalService.instance) {
      TacticalService.instance = new TacticalService()
    }
    return TacticalService.instance
  }

  // --- Broadcasts & Notifications ---

  async getBroadcasts(): Promise<Broadcast[]> {
    try {
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching broadcasts:', error)
      return []
    }
  }

  async sendBroadcast(broadcast: Omit<Broadcast, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const user = authService.getUser()
      if (!user) return false

      const { data: bData, error: bError } = await supabase
        .from('broadcasts')
        .insert([{
          ...broadcast,
          sender_id: user.id
        }])
        .select()
        .single()

      if (bError) throw bError

      let memberQuery = supabase.from('users').select('id')
      
      if (broadcast.target_type === 'REGION') {
        memberQuery = memberQuery.eq('region', broadcast.target_value)
      } else if (broadcast.target_type === 'CONSTITUENCY') {
        memberQuery = memberQuery.eq('constituency', broadcast.target_value)
      }

      const { data: members, error: mError } = await memberQuery
      if (mError) throw mError

      if (members && members.length > 0) {
        const notifications = members.map(m => ({
          user_id: m.id,
          broadcast_id: bData.id,
          title: broadcast.title,
          message: broadcast.content,
          type: broadcast.priority === 'Urgent' ? 'Alert' : 'Info'
        }))

        const { error: nError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (nError) throw nError
      }

      if (broadcast.priority === 'Urgent') {
        supabase.functions.invoke('broadcast-dispatcher', {
          body: { 
            broadcastId: bData.id,
            priority: broadcast.priority,
            targetType: broadcast.target_type,
            targetValue: broadcast.target_value
          }
        }).catch(err => console.error('[EDGE] Dispatch trigger failed:', err))
      }

      return true
    } catch (error) {
      console.error('Error sending broadcast:', error)
      return false
    }
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      const targetUserId = userId || authService.getUser()?.id
      if (!targetUserId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  async getBroadcastMetrics(broadcastId: string): Promise<{ total: number, read: number }> {
    try {
      const { count: total, error: tError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('broadcast_id', broadcastId)

      if (tError) throw tError

      const { count: read, error: rError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('broadcast_id', broadcastId)
        .eq('is_read', true)

      if (rError) throw rError

      return { total: total || 0, read: read || 0 }
    } catch (error) {
      console.error('Error fetching broadcast metrics:', error)
      return { total: 0, read: 0 }
    }
  }

  // --- Leaderboard & Pulse ---

  async getLeaderboard(region?: string): Promise<LeaderboardEntry[]> {
    try {
      let query = supabase
        .from('movement_leaderboard')
        .select('full_name, total_points, region, national_rank, regional_rank')
        .order('total_points', { ascending: false })
        .limit(10)

      if (region) {
        query = query.eq('region', region)
      }

      const { data, error } = await query

      if (error) throw error
      
      return (data || []).map((entry, index) => ({
        name: entry.full_name,
        points: entry.total_points,
        region: entry.region,
        rank: region ? entry.regional_rank : (entry.national_rank || index + 1)
      }))
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }
  }

  async getMovementPulse(): Promise<MovementPulse> {
    try {
      const [leaderboardRes, chaptersRes, velocityRes] = await Promise.all([
        supabase.from('movement_leaderboard').select('total_points, region'),
        supabase.from('chapter_performance_operational metrics').select('*'),
        supabase.from('logistics_velocity_operational metrics').select('fulfillment_rate')
      ])

      const leaderboard = leaderboardRes.data || []
      const chapters = chaptersRes.data || []
      const velocity = velocityRes.data || []

      const totalPoints = leaderboard.reduce((sum, u) => sum + (u.total_points || 0), 0)
      const activeChapters = chapters.length
      
      const regionalPulse = chapters.map(c => ({
        name: `${c.chapter} (${c.region})`,
        growth: 0,
        activity: Math.round((c.aggregate_chapter_points / (c.total_patriots || 1)) * 10) / 10,
        status: (c.aggregate_chapter_points > 1000 ? 'Ascending' : 'Stable') as 'Ascending' | 'Stable' | 'Descending'
      }))

      const regions = [...new Set(leaderboard.map(u => u.region))]
      const regionalPoints = regions.map(r => ({
        region: r,
        points: leaderboard.filter(u => u.region === r).reduce((sum, u) => sum + (u.total_points || 0), 0)
      }))
      const topRegion = regionalPoints.sort((a, b) => b.points - a.points)[0]?.region || 'N/A'

      const avgFulfillment = velocity.length > 0
        ? velocity.reduce((sum, v) => sum + (v.fulfillment_rate || 0), 0) / velocity.length
        : 100

      const growthRate = leaderboard.length > 0 ? (leaderboard.length / 50).toFixed(1) : "0.0"

      return {
        nationalGrowth: Number(growthRate) || 0,
        activeChapters,
        totalMobilizationPoints: totalPoints,
        topPerformingRegion: topRegion,
        logisticsHealth: Math.round(avgFulfillment),
        regionalPulse: regionalPulse.slice(0, 6)
      }
    } catch (error) {
      console.error('[DATABASE] Failed to fetch movement pulse:', error)
      return {
        nationalGrowth: 0,
        activeChapters: 0,
        totalMobilizationPoints: 0,
        topPerformingRegion: 'N/A',
        logisticsHealth: 0,
        regionalPulse: []
      }
    }
  }

  // --- Milestones ---

  async getMilestones(): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('movement_milestones')
        .select('*')
        .order('target_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching milestones:', error)
      return []
    }
  }

  async createMilestone(milestone: Omit<Milestone, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('movement_milestones')
        .insert([milestone])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error creating milestone:', error)
      return false
    }
  }

  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('movement_milestones')
        .update(milestone)
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating milestone:', error)
      return false
    }
  }

  async deleteMilestone(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('movement_milestones')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting milestone:', error)
      return false
    }
  }

  // --- Tactical Intelligence (AI/Mock) ---

  async verifyMemberID(memberId: string): Promise<{ confidence: number, matches: string[], flagged: boolean }> {
    // High-fidelity identity verification simulation (Phase 12)
    console.log(`[TACTICAL] Running biometric signature check for ID: ${memberId}`)
    const score = Math.floor(Math.random() * 40) + 60
    const flagged = score < 75

    return {
      confidence: score,
      matches: flagged ? ['Partial ID Mismatch', 'Low Quality Photo'] : ['Face Match', 'ID Valid', 'No Prior Records'],
      flagged
    }
  }
}

export const tacticalService = TacticalService.getInstance()
