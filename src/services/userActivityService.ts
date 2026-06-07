import { supabase } from '@/lib/supabase'

export type ActivityType =
  | 'login'
  | 'logout'
  | 'profile_update'
  | 'password_change'
  | 'donation'
  | 'poll_vote'
  | 'store_order'
  | 'notification'
  | 'wishlist'
  | 'helpdesk_ticket'
  | 'chapter_poll_vote'
  | 'feedback'
  | 'voter_registration'

export type ActivitySource =
  | 'activity_log'
  | 'donations'
  | 'poll_votes'
  | 'store_orders'
  | 'notifications'
  | 'wishlist'
  | 'helpdesk_tickets'
  | 'chapter_poll_votes'
  | 'member_feedback'
  | 'voter_registrations'

export interface ActivityEntry {
  id: string
  action_type: ActivityType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  source?: ActivitySource
  source_label?: string
  value?: number
  minutes?: number
  status?: string | null
}

export interface ActivitySourceStatus {
  source: ActivitySource
  label: string
  count: number
  loaded: boolean
}

export interface UserActivityAnalytics {
  entries: ActivityEntry[]
  sources: ActivitySourceStatus[]
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
    return ((data ?? []) as ActivityEntry[]).map((entry) => ({
      ...entry,
      source: 'activity_log',
      source_label: 'Account events',
      minutes: getEstimatedMinutes(entry.action_type),
    }))
  }

  async getUserActivityAnalytics(userId: string, since: Date): Promise<UserActivityAnalytics> {
    const sinceIso = since.toISOString()
    const sources: ActivitySourceStatus[] = []

    const sourceLabels: Record<ActivitySource, string> = {
      activity_log: 'Account events',
      donations: 'Donations',
      poll_votes: 'Poll votes',
      store_orders: 'Store orders',
      notifications: 'Notifications',
      wishlist: 'Wishlist',
      helpdesk_tickets: 'Helpdesk tickets',
      chapter_poll_votes: 'Chapter polls',
      member_feedback: 'Feedback',
      voter_registrations: 'Voter registration',
    }

    const runSource = async <T>(
      source: ActivitySource,
      loader: () => Promise<T[]>,
      mapper: (row: T) => ActivityEntry
    ): Promise<ActivityEntry[]> => {
      try {
        const rows = await loader()
        sources.push({ source, label: sourceLabels[source], count: rows.length, loaded: true })
        return rows.map(mapper)
      } catch (error) {
        console.warn(`[ACTIVITY] Failed to fetch ${source}:`, error)
        sources.push({ source, label: sourceLabels[source], count: 0, loaded: false })
        return []
      }
    }

    const [
      activityLogs,
      donations,
      pollVotes,
      storeOrders,
      notifications,
      wishlist,
      helpdeskTickets,
      chapterPollVotes,
      feedback,
      voterRegistrations,
    ] = await Promise.all([
      runSource(
        'activity_log',
        async () => {
          const { data, error } = await supabase
            .from('user_activity_logs')
            .select('id, action_type, description, metadata, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(500)
          if (error) throw error
          return (data ?? []) as ActivityEntry[]
        },
        (row) => ({
          ...row,
          source: 'activity_log',
          source_label: sourceLabels.activity_log,
          minutes: getEstimatedMinutes(row.action_type),
        })
      ),
      runSource(
        'donations',
        async () => {
          const { data, error } = await supabase
            .from('donations')
            .select('id, amount, status, created_at, description')
            .eq('member_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as {
            id: string
            amount: number | null
            status: string | null
            created_at: string
            description: string | null
          }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'donation',
          description:
            row.description || `Donation ${row.status ? `marked ${row.status}` : 'recorded'}`,
          metadata: { amount: row.amount },
          created_at: row.created_at,
          source: 'donations',
          source_label: sourceLabels.donations,
          value: Number(row.amount ?? 0),
          minutes: getEstimatedMinutes('donation'),
          status: row.status,
        })
      ),
      runSource(
        'poll_votes',
        async () => {
          const { data, error } = await supabase
            .from('poll_votes')
            .select('id, poll_id, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as { id: string; poll_id: string | null; created_at: string }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'poll_vote',
          description: 'Voted in a movement poll',
          metadata: { poll_id: row.poll_id },
          created_at: row.created_at,
          source: 'poll_votes',
          source_label: sourceLabels.poll_votes,
          minutes: getEstimatedMinutes('poll_vote'),
        })
      ),
      runSource(
        'store_orders',
        async () => {
          const { data, error } = await supabase
            .from('store_orders')
            .select('id, total_amount, status, created_at')
            .eq('customer_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as {
            id: string
            total_amount: number | null
            status: string | null
            created_at: string
          }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'store_order',
          description: `Store order ${row.status ? `is ${row.status}` : 'placed'}`,
          metadata: { total_amount: row.total_amount },
          created_at: row.created_at,
          source: 'store_orders',
          source_label: sourceLabels.store_orders,
          value: Number(row.total_amount ?? 0),
          minutes: getEstimatedMinutes('store_order'),
          status: row.status,
        })
      ),
      runSource(
        'notifications',
        async () => {
          const { data, error } = await supabase
            .from('notifications')
            .select('id, title, type, is_read, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as {
            id: string
            title: string
            type: string | null
            is_read: boolean | null
            created_at: string
          }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'notification',
          description: row.title,
          metadata: { type: row.type, is_read: row.is_read },
          created_at: row.created_at,
          source: 'notifications',
          source_label: sourceLabels.notifications,
          minutes: getEstimatedMinutes('notification'),
          status: row.is_read ? 'Read' : 'Unread',
        })
      ),
      runSource(
        'wishlist',
        async () => {
          const { data, error } = await supabase
            .from('wishlist')
            .select('id, product_id, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as { id: string; product_id: string; created_at: string }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'wishlist',
          description: 'Saved a store item to wishlist',
          metadata: { product_id: row.product_id },
          created_at: row.created_at,
          source: 'wishlist',
          source_label: sourceLabels.wishlist,
          minutes: getEstimatedMinutes('wishlist'),
        })
      ),
      runSource(
        'helpdesk_tickets',
        async () => {
          const { data, error } = await supabase
            .from('helpdesk_tickets')
            .select('id, subject, status, priority, created_at')
            .eq('submitted_by', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as {
            id: string
            subject: string | null
            status: string | null
            priority: string | null
            created_at: string
          }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'helpdesk_ticket',
          description: row.subject || 'Submitted an IT support ticket',
          metadata: { priority: row.priority },
          created_at: row.created_at,
          source: 'helpdesk_tickets',
          source_label: sourceLabels.helpdesk_tickets,
          minutes: getEstimatedMinutes('helpdesk_ticket'),
          status: row.status,
        })
      ),
      runSource(
        'chapter_poll_votes',
        async () => {
          const { data, error } = await supabase
            .from('chapter_poll_votes')
            .select('id, poll_id, created_at')
            .eq('voter_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as { id: string; poll_id: string | null; created_at: string }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'chapter_poll_vote',
          description: 'Voted in a chapter poll',
          metadata: { poll_id: row.poll_id },
          created_at: row.created_at,
          source: 'chapter_poll_votes',
          source_label: sourceLabels.chapter_poll_votes,
          minutes: getEstimatedMinutes('chapter_poll_vote'),
        })
      ),
      runSource(
        'member_feedback',
        async () => {
          const { data, error } = await supabase
            .from('member_feedback')
            .select('id, category, sentiment_score, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(200)
          if (error) throw error
          return (data ?? []) as {
            id: string
            category: string
            sentiment_score: number | null
            created_at: string
          }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'feedback',
          description: `Shared ${row.category} feedback`,
          metadata: { sentiment_score: row.sentiment_score },
          created_at: row.created_at,
          source: 'member_feedback',
          source_label: sourceLabels.member_feedback,
          minutes: getEstimatedMinutes('feedback'),
        })
      ),
      runSource(
        'voter_registrations',
        async () => {
          const { data, error } = await supabase
            .from('voter_registrations')
            .select('id, created_at')
            .eq('user_id', userId)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(50)
          if (error) throw error
          return (data ?? []) as { id: string; created_at: string }[]
        },
        (row) => ({
          id: row.id,
          action_type: 'voter_registration',
          description: 'Updated voter registration record',
          metadata: null,
          created_at: row.created_at,
          source: 'voter_registrations',
          source_label: sourceLabels.voter_registrations,
          minutes: getEstimatedMinutes('voter_registration'),
          status: null,
        })
      ),
    ])

    const entries = [
      ...activityLogs,
      ...donations,
      ...pollVotes,
      ...storeOrders,
      ...notifications,
      ...wishlist,
      ...helpdeskTickets,
      ...chapterPollVotes,
      ...feedback,
      ...voterRegistrations,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { entries, sources }
  }
}

export const userActivityService = UserActivityService.getInstance()

function getEstimatedMinutes(actionType: ActivityType): number {
  const minutes: Record<ActivityType, number> = {
    login: 8,
    logout: 1,
    profile_update: 6,
    password_change: 5,
    donation: 4,
    poll_vote: 3,
    store_order: 7,
    notification: 1,
    wishlist: 2,
    helpdesk_ticket: 6,
    chapter_poll_vote: 3,
    feedback: 5,
    voter_registration: 6,
  }
  return minutes[actionType] ?? 2
}
