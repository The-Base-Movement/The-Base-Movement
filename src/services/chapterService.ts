import { supabase } from '@/lib/supabase'
import type { ChapterApplication, ChapterLeaderboard, Chapter, ChapterLeader, ChapterActivity } from '@/types/admin'

interface ChapterLeaderRow {
  id: string
  chapter_id: string
  name: string
  role: string
  image_url: string | null
  created_at: string
}

interface ChapterActivityRow {
  id: string
  chapter_id: string
  title: string
  description: string | null
  type: string
  activity_date: string
  created_at: string
}

class ChapterService {
  private static instance: ChapterService

  private constructor() {}

  public static getInstance(): ChapterService {
    if (!ChapterService.instance) {
      ChapterService.instance = new ChapterService()
    }
    return ChapterService.instance
  }



  async getChapters(): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        *,
        countries(flag_url),
        leadership:chapter_leaders(*),
        activities:chapter_activities(*)
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Chapters Fetch Error:', error)
      return []
    }

    return (data || []).map((c) => {
      // Supabase join on countries might return an array or object depending on schema
      const countryData = Array.isArray(c.countries) ? c.countries[0] : c.countries;
      
      return {
        id: c.id || '',
        name: c.name || 'Unknown Chapter',
        city_or_region: c.city_or_region || 'Unknown Location',
        country: c.country || 'Ghana',
        flag_url: countryData?.flag_url || undefined,
        leader_name: c.leader_name || 'Unassigned',
        leader_id: c.leader_id || undefined,
        member_count: c.member_count || 0,
        status: c.status || 'Pending',
        region: c.region || undefined,
        description: c.description || undefined,
        details_url: c.details_url || undefined,
        meeting_schedule: c.meeting_schedule || undefined,
        local_focus: c.local_focus || undefined,
        email: c.email || undefined,
        phone_number: c.phone_number || undefined,
        leadership: (c.leadership as unknown as ChapterLeaderRow[])?.map((l: ChapterLeaderRow): ChapterLeader => ({
          id: l.id,
          name: l.name,
          role: l.role,
          imageUrl: l.image_url || undefined
        })) || [],
        activities: (c.activities as unknown as ChapterActivityRow[])?.map((a: ChapterActivityRow): ChapterActivity => ({
          id: a.id,
          title: a.title,
          description: a.description || undefined,
          type: a.type,
        activityDate: a.activity_date
      }))
    }
    })
  }

  async getChapterById(id: string): Promise<Chapter | null> {
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        *,
        countries(flag_url),
        leadership:chapter_leaders(*),
        activities:chapter_activities(*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('[DATABASE] Chapter Fetch Error:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      city_or_region: data.city_or_region,
      country: data.country || 'Ghana',
      flag_url: data.countries?.flag_url,
      leader_name: data.leader_name || 'Unassigned',
      member_count: data.member_count || 0,
      status: data.status,
      region: data.region || undefined,
      description: data.description || undefined,
      details_url: data.details_url || undefined,
      meeting_schedule: data.meeting_schedule || undefined,
      local_focus: data.local_focus || undefined,
      email: data.email || undefined,
      phone_number: data.phone_number || undefined,
      leadership: data.leadership?.map((l: ChapterLeaderRow): ChapterLeader => ({
        id: l.id,
        name: l.name,
        role: l.role,
        imageUrl: l.image_url || undefined
      })),
      activities: data.activities?.map((a: ChapterActivityRow): ChapterActivity => ({
        id: a.id,
        title: a.title,
        description: a.description || undefined,
        type: a.type,
        activityDate: a.activity_date
      }))
    }
  }

  async createChapter(chapter: Omit<Chapter, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('chapters')
      .insert({
        name: chapter.name,
        city_or_region: chapter.city_or_region,
        country: chapter.country,
        leader_name: chapter.leader_name,
        member_count: chapter.member_count,
        status: chapter.status,
        region: chapter.region,
        description: chapter.description,
        details_url: chapter.details_url,
        meeting_schedule: chapter.meeting_schedule,
        local_focus: chapter.local_focus,
        email: chapter.email,
        phone_number: chapter.phone_number
      })

    if (error) {
      console.error('[DATABASE] Chapter creation failed:', error)
      return false
    }

    return true
  }

  async updateChapter(id: string, chapter: Partial<Chapter>): Promise<boolean> {
    const updateData: Record<string, string | number | null | undefined> = {}
    if (chapter.name) updateData.name = chapter.name
    if (chapter.city_or_region) updateData.city_or_region = chapter.city_or_region
    if (chapter.country) updateData.country = chapter.country
    if (chapter.leader_name) updateData.leader_name = chapter.leader_name
    if (chapter.leader_id !== undefined) updateData.leader_id = chapter.leader_id
    if (chapter.status) updateData.status = chapter.status
    if (chapter.region) updateData.region = chapter.region
    if (chapter.member_count !== undefined) updateData.member_count = chapter.member_count
    if (chapter.description) updateData.description = chapter.description
    if (chapter.details_url) updateData.details_url = chapter.details_url
    if (chapter.meeting_schedule) updateData.meeting_schedule = chapter.meeting_schedule
    if (chapter.local_focus) updateData.local_focus = chapter.local_focus
    if (chapter.email) updateData.email = chapter.email
    if (chapter.phone_number) updateData.phone_number = chapter.phone_number

    const { error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Chapter update failed:', error)
      return false
    }

    return true
  }

  async deleteChapter(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Chapter deletion failed:', error)
      return false
    }

    return true
  }

  async incrementChapterMemberCount(chapterName: string): Promise<void> {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, member_count')
      .eq('name', chapterName)
      .single()

    if (data && !error) {
      await supabase
        .from('chapters')
        .update({ member_count: (data.member_count || 0) + 1 })
        .eq('id', data.id)
    }
  }

  async addChapterLeader(chapterId: string, leader: { name: string, role: string, imageUrl?: string }): Promise<boolean> {
    const { error } = await supabase
      .from('chapter_leaders')
      .insert({
        chapter_id: chapterId,
        name: leader.name,
        role: leader.role,
        image_url: leader.imageUrl || null
      })

    if (error) {
      console.error('[DATABASE] Failed to add chapter leader:', error)
      return false
    }

    // Also update chapter leader_name if it was unassigned
    const { data: chapter } = await supabase
      .from('chapters')
      .select('leader_name')
      .eq('id', chapterId)
      .single()

    if (chapter && (chapter.leader_name === 'Unassigned' || !chapter.leader_name)) {
      await supabase
        .from('chapters')
        .update({ leader_name: leader.name })
        .eq('id', chapterId)
    }

    return true
  }

  async removeChapterLeader(leaderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chapter_leaders')
      .delete()
      .eq('id', leaderId)

    if (error) {
      console.error('[DATABASE] Failed to remove chapter leader:', error)
      return false
    }

    return true
  }

  async joinChapter(chapterName: string): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase
      .from('users')
      .update({ chapter: chapterName })
      .eq('id', session.user.id)

    if (error) {
      console.error('[DATABASE] Join chapter failed:', error)
      return false
    }

    await this.incrementChapterMemberCount(chapterName)
    return true
  }

  async getChapterApplications(): Promise<ChapterApplication[]> {
    const { data, error } = await supabase
      .from('chapter_applications')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch chapter applications:', error)
      return []
    }

    interface DBApplication {
      id: string
      applicant_id: string
      proposed_chapter_name: string
      region: string
      constituency: string
      experience_summary: string
      vision_statement: string
      status: 'Pending' | 'Approved' | 'Rejected'
      created_at: string
      users: { full_name: string }
    }

    return (data || []).map((app: DBApplication) => ({
      id: app.id,
      applicant_id: app.applicant_id,
      applicant_name: app.users?.full_name,
      proposed_chapter_name: app.proposed_chapter_name,
      region: app.region,
      constituency: app.constituency,
      experience_summary: app.experience_summary,
      vision_statement: app.vision_statement,
      status: app.status,
      created_at: app.created_at
    }))
  }

  async submitChapterApplication(application: { 
    proposed_chapter_name: string; 
    region: string; 
    constituency: string; 
    vision_statement: string;
    experience_summary?: string;
  }): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase
      .from('chapter_applications')
      .insert({
        applicant_id: session.user.id,
        proposed_chapter_name: application.proposed_chapter_name,
        region: application.region,
        constituency: application.constituency,
        vision_statement: application.vision_statement,
        experience_summary: application.experience_summary,
        status: 'Pending'
      })

    if (error) {
      console.error('[DATABASE] Chapter application submission failed:', error)
      return false
    }

    return true
  }

  async approveChapterApplication(applicationId: string, notes: string = ''): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase.rpc('approve_chapter_application', {
      app_id: applicationId,
      admin_uid: session.user.id,
      notes: notes
    })

    if (error) {
      console.error('[DATABASE] Approval failed:', error)
      return false
    }

    return true
  }

  async rejectChapterApplication(applicationId: string, notes: string = ''): Promise<boolean> {
    const { error } = await supabase
      .from('chapter_applications')
      .update({ status: 'Rejected', notes: notes })
      .eq('id', applicationId)

    if (error) {
      console.error('[DATABASE] Rejection failed:', error)
      return false
    }

    return true
  }

  async getRegionalLeaderboard(): Promise<ChapterLeaderboard[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_performance')
        .select('*')
        .order('regional_chapter_rank', { ascending: true })
      if (error) return []

      return (data || []).map(item => ({
        region: item.region,
        chapter: item.chapter,
        total_patriots: item.total_patriots,
        total_mobilization_points: item.aggregate_chapter_points,
        achievements_unlocked: item.total_chapter_achievements,
        regional_rank: item.regional_chapter_rank
      }))
    } catch {
      return []
    }
  }
}

export const chapterService = ChapterService.getInstance()
