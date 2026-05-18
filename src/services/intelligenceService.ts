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
  FieldEvent
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
      const { error } = await supabase
        .from('field_events')
        .update(updates)
        .eq('id', eventId)
      
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
      const { error } = await supabase
        .from('field_directives')
        .insert([directive])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create field directive:', error)
      return false
    }
  }

  async getFieldReports(directiveId?: string): Promise<FieldReport[]> {
    try {
      let query = supabase.from('field_reports').select('*')
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
      const { error } = await supabase
        .from('field_reports')
        .update({ status })
        .eq('id', reportId)
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
      return (data || []).map(action => ({
        ...action,
        actual_attendance: action.field_action_attendance?.[0]?.count || 0
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
      return (data || []).map(item => ({
        ...item,
        user_name: item.users?.full_name
      })) as RallyAttendance[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch rally attendance:', error)
      return []
    }
  }

  async createFieldAction(action: Partial<FieldAction>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('field_actions')
        .insert([action])
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
      const { data, error } = await supabase
        .from('national_sentiment_intelligence')
        .select('*')
        .order('avg_sentiment', { ascending: false })
      if (error) throw error
      return (data || []) as SentimentIntelligence[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch sentiment operational metrics:', error)
      return []
    }
  }

  async getImpactProjections(): Promise<ImpactProjection[]> {
    try {
      const { data, error } = await supabase
        .from('predictive_impact_projections')
        .select('*')
        .order('projected_reach_30d', { ascending: false })
      if (error) throw error
      return (data || []) as ImpactProjection[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch impact projections:', error)
      return []
    }
  }

  async submitMemberFeedback(feedback: Partial<MemberFeedback>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('member_feedback')
        .insert([feedback])
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

  async createRapidResponseDirective(directive: Omit<RapidResponseDirective, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rapid_response_directives')
        .insert([directive])
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

  async updateCrisisIncident(incidentId: string, status: CrisisIncident['status']): Promise<boolean> {
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
      let query = supabase.from('media_counter_narratives').select('*').order('created_at', { ascending: false })
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

  async updateMediaCounterNarrative(narrativeId: string, status: MediaCounterNarrative['dispatch_status']): Promise<boolean> {
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
      let query = supabase.from('canvasser_logs').select('*').order('created_at', { ascending: false })
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

  async getGhanaRegions(): Promise<{ id: string, name: string }[]> {
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

  async getGhanaConstituencies(regionId?: string): Promise<{ id: string, region_id: string, name: string }[]> {
    try {
      let query = supabase.from('ghana_constituencies').select('*').order('name', { ascending: true })
      if (regionId) query = query.eq('region_id', regionId)
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[DATABASE] Failed to fetch constituencies:', error)
      return []
    }
  }

  async updateTransportRequest(requestId: string, status: GOTVTransportRequest['status']): Promise<boolean> {
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
      const { error } = await supabase
        .from('canvassing_campaigns')
        .insert([campaign])
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to create canvassing campaign:', error)
      return false
    }
  }
}

export const intelligenceService = IntelligenceService.getInstance()
