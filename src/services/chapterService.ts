import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import { allChapters } from '../data/chaptersData'
import type { ChapterApplication, ChapterLeaderboard, Chapter } from '@/types/admin'

class ChapterService {
  private static instance: ChapterService

  private constructor() {}

  public static getInstance(): ChapterService {
    if (!ChapterService.instance) {
      ChapterService.instance = new ChapterService()
    }
    return ChapterService.instance
  }

  private getFallbackChapters(): Chapter[] {
    return allChapters.map(c => ({
      id: c.id,
      name: c.name,
      city_or_region: c.city_or_region,
      country: c.country,
      leader_name: 'Unassigned',
      member_count: c.membersCount,
      status: c.status as Chapter['status'],
      description: c.description,
      details_url: c.details_url
    }))
  }

  async getChapters(): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Chapters Fetch Error:', error)
      return this.getFallbackChapters()
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      city_or_region: c.city_or_region,
      country: c.country || 'Ghana',
      leader_name: c.leader_name || 'Unassigned',
      member_count: c.member_count || 0,
      status: c.status,
      description: c.description || undefined,
      details_url: c.details_url || undefined
    }))
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
        description: chapter.description,
        details_url: chapter.details_url
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
    if (chapter.status) updateData.status = chapter.status
    if (chapter.member_count !== undefined) updateData.member_count = chapter.member_count
    if (chapter.description) updateData.description = chapter.description
    if (chapter.details_url) updateData.details_url = chapter.details_url

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
    const user = await authService.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('chapter_applications')
      .insert({
        applicant_id: user.id,
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
    const user = await authService.getUser()
    if (!user) return false

    const { error } = await supabase.rpc('approve_chapter_application', {
      app_id: applicationId,
      admin_uid: user.id,
      notes: notes
    })

    if (error) {
      console.error('[DATABASE] Approval failed:', error)
      return false
    }

    return true
  }

  async getRegionalLeaderboard(): Promise<ChapterLeaderboard[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_performance_telemetry')
        .select('*')
        .order('regional_chapter_rank', { ascending: true })
      if (error) throw error
      
      return (data || []).map(item => ({
        region: item.region,
        chapter: item.chapter,
        total_patriots: item.total_patriots,
        total_mobilization_points: item.aggregate_chapter_points,
        achievements_unlocked: item.total_chapter_achievements,
        regional_rank: item.regional_chapter_rank
      }))
    } catch (error) {
      console.error('[DATABASE] Failed to fetch regional leaderboard:', error)
      return []
    }
  }
}

export const chapterService = ChapterService.getInstance()
