import { supabase } from '@/lib/supabase'

export type ActivityType =
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'password_change'
  | 'donation'
  | 'poll_vote'
  | 'store_order'

export interface ActivityEntry {
  id: string
  action_type: ActivityType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

class UserActivityService {
  private static instance: UserActivityService
  private constructor() {}

  static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService()
    }
    return UserActivityService.instance
  }

  async logActivity(
    userId: string,
    action_type: ActivityType,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase.from('user_activity_logs').insert({
      user_id: userId,
      action_type,
      description,
      metadata: metadata ?? null,
    })
    if (error) console.warn('[ACTIVITY] Failed to log activity:', error)
  }

  async getUserActivity(userId: string, limit = 20): Promise<ActivityEntry[]> {
    const since = new Date()
    since.setDate(since.getDate() - 7)

    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('id, action_type, description, metadata, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('[ACTIVITY] Failed to fetch activity:', error)
      return []
    }
    return (data ?? []) as ActivityEntry[]
  }
}

export const userActivityService = UserActivityService.getInstance()
