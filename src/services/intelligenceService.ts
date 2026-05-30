import { supabase } from '@/lib/supabase'
import type {
  FieldDirective,
  FieldReport,
  FieldAction,
  RallyAttendance,
  MemberFeedback,
  SentimentIntelligence,
  ImpactProjection,
  RapidResponseDirective,
  CrisisIncident,
  MediaCounterNarrative,
  VoterRegistration,
  CanvassingCampaign,
  CanvasserLog,
  GOTVTransportRequest,
  FieldEvent,
} from '@/types/admin'

class IntelligenceService {
  private static instance: IntelligenceService

  private constructor() {}

  public static getInstance(): IntelligenceService {
    if (!IntelligenceService.instance) {
      IntelligenceService.instance = new IntelligenceService()
    }
    return IntelligenceService.instance
  }

  // --- Field Operations ---

  async getFieldEvents(chapterName?: string): Promise<FieldEvent[]> {
    try {
      let query = supabase.from('field_events').select('*')
      if (chapterName) query = query.eq('chapter', chapterName)

      const { data, error } = await query.order('date', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch field events:', error)
      return []
    }
  }

  async updateFieldEvent(eventId: string, updates: Partial<FieldEvent>): Promise<boolean> {
    try {
      const { error } = await supabase.from('field_events').update(updates).eq('id', eventId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to update field event:', error)
      return false
    }
  }

  async getFieldDirectives(): Promise<FieldDirective[]> {
    try {
      const { data, error } = await supabase
        .from('field_directives')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch field directives:', error)
      return []
    }
  }

  async createFieldDirective(directive: Omit<FieldDirective, 'id' | 'status'>): Promise<boolean> {
    try {
      const { error } = await supabase.from('field_directives').insert([directive])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create field directive:', error)
      return false
    }
  }

  async getFieldReports(directiveId?: string): Promise<FieldReport[]> {
    try {
      let query = supabase
        .from('field_reports')
        .select('*, users!field_reports_member_id_fkey(full_name, avatar_url)')
      if (directiveId) query = query.eq('directive_id', directiveId)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch field reports:', error)
      return []
    }
  }

  async verifyFieldReport(reportId: string, status: FieldReport['status']): Promise<boolean> {
    try {
      const { error } = await supabase.from('field_reports').update({ status }).eq('id', reportId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to verify field report:', error)
      return false
    }
  }

  async getFieldActions(): Promise<FieldAction[]> {
    try {
      const { data, error } = await supabase
        .from('field_actions')
        .select('*, field_action_attendance(count)')
        .order('start_time', { ascending: false })

      if (error) throw error
      return (data || []).map((action) => ({
        ...action,
        actual_attendance: action.field_action_attendance?.[0]?.count || 0,
      })) as FieldAction[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch field actions:', error)
      return []
    }
  }

  async getFieldActionAttendance(actionId: string): Promise<RallyAttendance[]> {
    try {
      const { data, error } = await supabase
        .from('field_action_attendance')
        .select('*, users(full_name)')
        .eq('action_id', actionId)

      if (error) throw error
      return (data || []).map((item) => ({
        ...item,
        user_name: item.users?.full_name,
      })) as RallyAttendance[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch rally attendance:', error)
      return []
    }
  }

  async createFieldAction(action: Partial<FieldAction>): Promise<boolean> {
    try {
      const { error } = await supabase.from('field_actions').insert([action])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create field action:', error)
      return false
    }
  }

  async verifyRallyAttendance(attendanceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('field_action_attendance')
        .update({ is_verified: true })
        .eq('id', attendanceId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to verify rally attendance:', error)
      return false
    }
  }

  // --- Sentiment & Projections ---

  async getMemberFeedback(): Promise<MemberFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('member_feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as MemberFeedback[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch member feedback:', error)
      return []
    }
  }

  async getSentimentIntelligence(): Promise<SentimentIntelligence[]> {
    try {
      // Fetch all 16 canonical regions as the spine, then left-join user data
      const [regionsRes, usersRes] = await Promise.all([
        supabase.from('ghana_regions').select('name').order('name'),
        supabase
          .from('users')
          .select('id, region, status')
          .not('region', 'is', null)
          .neq('region', ''),
      ])
      if (regionsRes.error) throw regionsRes.error
      if (usersRes.error) throw usersRes.error

      const allRegions = (regionsRes.data || []).map((r: { name: string }) => r.name)
      const users = (usersRes.data || []) as { id: string; region: string; status: string }[]

      // Seed every region with zero counts
      const map = new Map<string, { pos: number; neg: number; neu: number; total: number }>()
      for (const name of allRegions) map.set(name, { pos: 0, neg: 0, neu: 0, total: 0 })

      // Populate from real user data
      for (const u of users) {
        if (!map.has(u.region)) map.set(u.region, { pos: 0, neg: 0, neu: 0, total: 0 })
        const g = map.get(u.region)!
        g.total++
        if (['Active', 'Approved'].includes(u.status)) g.pos++
        else if (u.status === 'Suspended') g.neg++
        else g.neu++
      }

      return Array.from(map.entries())
        .map(([region, g]) => ({
          id: region,
          region,
          total_responses: g.total,
          positive_count: g.pos,
          negative_count: g.neg,
          neutral_count: g.neu,
          avg_sentiment:
            g.total === 0 ? 0.5 : Math.max(0, Math.min(1, ((g.pos - g.neg) / g.total) * 0.5 + 0.5)),
          last_updated: new Date().toISOString(),
        }))
        .sort((a, b) => b.avg_sentiment - a.avg_sentiment) as SentimentIntelligence[]
    } catch (error) {
      console.error('[DATABASE] Failed to derive sentiment from users:', error)
      return []
    }
  }

  async getImpactProjections(): Promise<ImpactProjection[]> {
    try {
      // Fetch all 16 canonical regions as the spine, then left-join user data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [regionsRes, usersRes] = await Promise.all([
        supabase.from('ghana_regions').select('name').order('name'),
        supabase
          .from('users')
          .select('id, region, status, joined_at')
          .not('region', 'is', null)
          .neq('region', ''),
      ])
      if (regionsRes.error) throw regionsRes.error
      if (usersRes.error) throw usersRes.error

      const allRegions = (regionsRes.data || []).map((r: { name: string }) => r.name)
      const users = (usersRes.data || []) as {
        id: string
        region: string
        status: string
        joined_at: string
      }[]

      // Seed every region with zero counts
      const map = new Map<string, { active: number; newJoins: number; total: number }>()
      for (const name of allRegions) map.set(name, { active: 0, newJoins: 0, total: 0 })

      // Populate from real user data
      for (const u of users) {
        if (!map.has(u.region)) map.set(u.region, { active: 0, newJoins: 0, total: 0 })
        const g = map.get(u.region)!
        g.total++
        if (['Active', 'Approved'].includes(u.status)) g.active++
        if (u.joined_at >= thirtyDaysAgo && ['Active', 'Approved', 'Pending'].includes(u.status))
          g.newJoins++
      }

      return Array.from(map.entries())
        .map(([region, g]) => ({
          id: region,
          region,
          current_reach: g.active,
          mobilization_velocity: g.newJoins,
          projected_reach_30d: g.active + g.newJoins * 30,
          confidence_score: g.total === 0 ? 0 : Math.min(1, g.active / g.total),
          potential_election_impact: g.total * 2,
          last_updated: new Date().toISOString(),
        }))
        .sort((a, b) => b.projected_reach_30d - a.projected_reach_30d) as ImpactProjection[]
    } catch (error) {
      console.error('[DATABASE] Failed to derive impact projections from users:', error)
      return []
    }
  }

  async submitMemberFeedback(feedback: Partial<MemberFeedback>): Promise<boolean> {
    try {
      const { error } = await supabase.from('member_feedback').insert([feedback])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to submit member feedback:', error)
      return false
    }
  }

  // --- Rapid Response ---

  async getRapidResponseDirectives(): Promise<RapidResponseDirective[]> {
    try {
      const { data, error } = await supabase
        .from('rapid_response_directives')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as RapidResponseDirective[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch rapid response directives:', error)
      return []
    }
  }

  async createRapidResponseDirective(
    directive: Omit<RapidResponseDirective, 'id' | 'created_at'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('rapid_response_directives').insert([directive])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create rapid response directive:', error)
      return false
    }
  }

  async getCrisisIncidents(): Promise<CrisisIncident[]> {
    try {
      const { data, error } = await supabase
        .from('crisis_incidents')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as CrisisIncident[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch crisis incidents:', error)
      return []
    }
  }

  async updateCrisisIncident(
    incidentId: string,
    status: CrisisIncident['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crisis_incidents')
        .update({ status })
        .eq('id', incidentId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to update crisis incident:', error)
      return false
    }
  }

  async getMediaCounterNarratives(crisisId?: string): Promise<MediaCounterNarrative[]> {
    try {
      let query = supabase
        .from('media_counter_narratives')
        .select('*')
        .order('created_at', { ascending: false })
      if (crisisId) {
        query = query.eq('crisis_id', crisisId)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as MediaCounterNarrative[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch counter narratives:', error)
      return []
    }
  }

  async updateMediaCounterNarrative(
    narrativeId: string,
    status: MediaCounterNarrative['dispatch_status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('media_counter_narratives')
        .update({ dispatch_status: status })
        .eq('id', narrativeId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to update media counter narrative:', error)
      return false
    }
  }

  // --- Constituency Operations ---

  async getVoterRegistrations(): Promise<VoterRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('voter_registrations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as VoterRegistration[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch voter registrations:', error)
      return []
    }
  }

  async getCanvassingCampaigns(): Promise<CanvassingCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('canvassing_campaigns')
        .select('*')
        .order('start_date', { ascending: true })
      if (error) throw error
      return (data || []) as CanvassingCampaign[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch canvassing campaigns:', error)
      return []
    }
  }

  async getCanvasserLogs(campaignId?: string): Promise<CanvasserLog[]> {
    try {
      let query = supabase
        .from('canvasser_logs')
        .select('*')
        .order('created_at', { ascending: false })
      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as CanvasserLog[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch canvasser logs:', error)
      return []
    }
  }

  async getGOTVTransportRequests(): Promise<GOTVTransportRequest[]> {
    try {
      const { data, error } = await supabase
        .from('gotv_transport_requests')
        .select('*')
        .order('requested_time', { ascending: true })
      if (error) throw error
      return (data || []) as GOTVTransportRequest[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch GOTV transport requests:', error)
      return []
    }
  }

  async getGhanaRegions(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('ghana_regions')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch regions:', error)
      return []
    }
  }

  async getGhanaConstituencies(
    regionId?: string
  ): Promise<{ id: string; region_id: string; name: string }[]> {
    try {
      let query = supabase
        .from('ghana_constituencies')
        .select('*')
        .order('name', { ascending: true })
      if (regionId) query = query.eq('region_id', regionId)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch constituencies:', error)
      return []
    }
  }

  async updateTransportRequest(
    requestId: string,
    status: GOTVTransportRequest['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gotv_transport_requests')
        .update({ status })
        .eq('id', requestId)
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to update transport request:', error)
      return false
    }
  }

  async createCanvassingCampaign(campaign: Partial<CanvassingCampaign>): Promise<boolean> {
    try {
      const { error } = await supabase.from('canvassing_campaigns').insert([campaign])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create canvassing campaign:', error)
      return false
    }
  }
}

export const intelligenceService = IntelligenceService.getInstance()
