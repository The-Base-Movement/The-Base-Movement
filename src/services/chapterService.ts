import { supabase } from '@/lib/supabase'
import type {
  ChapterApplication,
  ChapterLeaderboard,
  Chapter,
  ChapterLeader,
  ChapterActivity,
} from '@/types/admin'

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

  async getActiveChapterCount(): Promise<number> {
    const { count, error } = await supabase
      .from('chapters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')

    if (error) {
      console.warn('[DATABASE] Failed to fetch active chapter count:', error)
      return 0
    }

    return count || 0
  }

  async getChapters(): Promise<Chapter[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select(
        `
        *,
        leadership:chapter_leaders(*),
        activities:chapter_activities(*)
      `
      )
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Chapters Fetch Error:', error)
      return []
    }

    // Collect leader_ids to fetch their real avatars
    const leaderIds = (data || []).map((c) => c.leader_id).filter(Boolean) as string[]

    // Fetch countries, live member counts, and leader avatars in parallel
    const [{ data: countriesData }, { data: memberRows }, { data: leaderAvatarRows }] =
      await Promise.all([
        supabase.from('countries').select('name, flag_url'),
        supabase.from('users').select('chapter').not('chapter', 'is', null),
        leaderIds.length > 0
          ? supabase.from('users').select('id, avatar_url').in('id', leaderIds)
          : Promise.resolve({ data: [] }),
      ])

    const leaderAvatarMap: Record<string, string> = {}
    ;(leaderAvatarRows || []).forEach((u: { id: string; avatar_url: string | null }) => {
      if (u.id && u.avatar_url) leaderAvatarMap[u.id] = u.avatar_url
    })

    const countryFlagsMap = (countriesData || []).reduce((acc: Record<string, string>, curr) => {
      if (curr.name && curr.flag_url) acc[curr.name.toLowerCase()] = curr.flag_url
      return acc
    }, {})

    const liveCounts: Record<string, number> = {}
    ;(memberRows || []).forEach((u: { chapter: string | null }) => {
      if (u.chapter)
        liveCounts[u.chapter.toLowerCase()] = (liveCounts[u.chapter.toLowerCase()] || 0) + 1
    })

    return (data || []).map((c) => {
      const resolvedCountry = c.country || 'Ghana'
      const isGhana = resolvedCountry.toLowerCase() === 'ghana'
      const dbFlag = isGhana ? '/flags/gh.png' : countryFlagsMap[resolvedCountry.toLowerCase()]

      return {
        id: c.id || '',
        name: c.name || 'Unknown Chapter',
        city_or_region: c.city_or_region || 'Unknown Location',
        country: resolvedCountry,
        flag_url: dbFlag || undefined,
        leader_name: c.leader_name || 'Unassigned',
        leader_id: c.leader_id || undefined,
        member_count: liveCounts[(c.name || '').toLowerCase()] ?? 0,
        status: c.status || 'Pending',
        region: c.region || undefined,
        description: c.description || undefined,
        details_url: c.details_url || undefined,
        meeting_schedule: c.meeting_schedule || undefined,
        local_focus: c.local_focus || undefined,
        email: c.email || undefined,
        phone_number: c.phone_number || undefined,
        latitude: c.latitude || undefined,
        longitude: c.longitude || undefined,
        leadership:
          (c.leadership as unknown as ChapterLeaderRow[])?.map(
            (l: ChapterLeaderRow): ChapterLeader => ({
              id: l.id,
              name: l.name,
              role: l.role,
              // Prefer the member's real avatar (looked up via chapter.leader_id) over seed placeholder
              imageUrl: (c.leader_id && leaderAvatarMap[c.leader_id]) || l.image_url || undefined,
            })
          ) || [],
        activities: (c.activities as unknown as ChapterActivityRow[])?.map(
          (a: ChapterActivityRow): ChapterActivity => ({
            id: a.id,
            title: a.title,
            description: a.description || undefined,
            type: a.type,
            activityDate: a.activity_date,
          })
        ),
      }
    })
  }

  async getChapterById(id: string): Promise<Chapter | null> {
    const { data, error } = await supabase
      .from('chapters')
      .select(
        `
        *,
        leadership:chapter_leaders(*),
        activities:chapter_activities(*)
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('[DATABASE] Chapter Fetch Error:', error)
      return null
    }

    // Fetch country flag manually
    const { data: countryData } = await supabase
      .from('countries')
      .select('flag_url')
      .eq('name', data.country)
      .single()

    return {
      id: data.id,
      name: data.name,
      city_or_region: data.city_or_region,
      country: data.country || 'Ghana',
      flag_url: countryData?.flag_url || data.flag_url,
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
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      leadership: data.leadership?.map(
        (l: ChapterLeaderRow): ChapterLeader => ({
          id: l.id,
          name: l.name,
          role: l.role,
          imageUrl: l.image_url || undefined,
        })
      ),
      activities: data.activities?.map(
        (a: ChapterActivityRow): ChapterActivity => ({
          id: a.id,
          title: a.title,
          description: a.description || undefined,
          type: a.type,
          activityDate: a.activity_date,
        })
      ),
    }
  }

  private async geocodeLocation(
    cityOrRegion: string,
    country: string
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN
      if (!token) return null
      const query = encodeURIComponent(`${cityOrRegion}, ${country}`)
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`
      )
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        return { lat, lng }
      }
    } catch (err) {
      console.warn('[GEOCODING] Failed:', err)
    }
    return null
  }

  async createChapter(chapter: Omit<Chapter, 'id'>): Promise<boolean> {
    let lat = chapter.latitude
    let lng = chapter.longitude

    if (!lat || !lng) {
      const coords = await this.geocodeLocation(chapter.city_or_region, chapter.country)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
      }
    }

    const { error } = await supabase.from('chapters').insert({
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
      phone_number: chapter.phone_number,
      latitude: lat,
      longitude: lng,
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
    if (chapter.latitude !== undefined) updateData.latitude = chapter.latitude
    if (chapter.longitude !== undefined) updateData.longitude = chapter.longitude

    // If location changed but no coordinates provided, auto-geocode
    if ((chapter.city_or_region || chapter.country) && chapter.latitude === undefined) {
      const cCity = chapter.city_or_region || ''
      const cCountry = chapter.country || 'Ghana'
      const coords = await this.geocodeLocation(cCity, cCountry)
      if (coords) {
        updateData.latitude = coords.lat
        updateData.longitude = coords.lng
      }
    }

    const { error } = await supabase.from('chapters').update(updateData).eq('id', id)

    if (error) {
      console.error('[DATABASE] Chapter update failed:', error)
      return false
    }

    return true
  }

  async deleteChapter(id: string): Promise<boolean> {
    const { error } = await supabase.from('chapters').delete().eq('id', id)

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

  async addChapterLeader(
    chapterId: string,
    leader: { name: string; role: string; imageUrl?: string }
  ): Promise<boolean> {
    const { error } = await supabase.from('chapter_leaders').insert({
      chapter_id: chapterId,
      name: leader.name,
      role: leader.role,
      image_url: leader.imageUrl || null,
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
      await supabase.from('chapters').update({ leader_name: leader.name }).eq('id', chapterId)
    }

    return true
  }

  async removeChapterLeader(leaderId: string): Promise<boolean> {
    const { error } = await supabase.from('chapter_leaders').delete().eq('id', leaderId)

    if (error) {
      console.error('[DATABASE] Failed to remove chapter leader:', error)
      return false
    }

    return true
  }

  async joinChapter(chapterName: string): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
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

  async requestToJoin(chapterId: string): Promise<{ success: boolean; alreadyRequested: boolean }> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return { success: false, alreadyRequested: false }

    const { error } = await supabase
      .from('chapter_requests')
      .insert({ member_id: session.user.id, chapter_id: chapterId, status: 'pending' })

    if (error) {
      if (error.code === '23505') return { success: false, alreadyRequested: true }
      console.error('[DATABASE] Chapter request failed:', error)
      return { success: false, alreadyRequested: false }
    }

    return { success: true, alreadyRequested: false }
  }

  async getMyJoinRequest(chapterId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return null

    const { data } = await supabase
      .from('chapter_requests')
      .select('status')
      .eq('member_id', session.user.id)
      .eq('chapter_id', chapterId)
      .maybeSingle()

    return (data?.status as 'pending' | 'approved' | 'rejected') || null
  }

  async getChapterRequests(chapterId: string): Promise<
    Array<{
      id: string
      member_id: string
      member_name: string
      member_reg_no: string
      member_avatar: string | null
      status: string
      created_at: string
    }>
  > {
    const { data, error } = await supabase
      .from('chapter_requests')
      .select(
        'id, member_id, status, created_at, users(full_name, registration_number, avatar_url)'
      )
      .eq('chapter_id', chapterId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[DATABASE] Fetch chapter requests failed:', error)
      return []
    }

    return (data || []).map((r) => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      return {
        id: r.id as string,
        member_id: r.member_id as string,
        member_name: (u?.full_name as string) || 'Unknown',
        member_reg_no: (u?.registration_number as string) || '',
        member_avatar: (u?.avatar_url as string | null) || null,
        status: r.status as string,
        created_at: r.created_at as string,
      }
    })
  }

  async approveJoinRequest(
    requestId: string,
    memberId: string,
    chapterName: string
  ): Promise<boolean> {
    const { error: reqError } = await supabase
      .from('chapter_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (reqError) {
      console.error('[DATABASE] Approve request failed:', reqError)
      return false
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ chapter: chapterName })
      .eq('id', memberId)

    if (userError) {
      console.error('[DATABASE] Chapter assign failed:', userError)
      return false
    }

    await this.incrementChapterMemberCount(chapterName)
    return true
  }

  async rejectJoinRequest(
    requestId: string,
    memberId: string,
    chapterName: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('chapter_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      console.error('[DATABASE] Reject request failed:', error)
      return false
    }

    await supabase.from('notifications').insert({
      user_id: memberId,
      title: 'Chapter Request Declined',
      message: `Your request to join "${chapterName}" was not approved. You may reapply or contact your chapter leader.`,
      type: 'Info',
    })

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
      created_at: app.created_at,
    }))
  }

  async submitChapterApplication(application: {
    proposed_chapter_name: string
    region: string
    constituency: string
    vision_statement: string
    experience_summary?: string
  }): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase.from('chapter_applications').insert({
      applicant_id: session.user.id,
      proposed_chapter_name: application.proposed_chapter_name,
      region: application.region,
      constituency: application.constituency,
      vision_statement: application.vision_statement,
      experience_summary: application.experience_summary,
      status: 'Pending',
    })

    if (error) {
      console.error('[DATABASE] Chapter application submission failed:', error)
      return false
    }

    return true
  }

  async approveChapterApplication(applicationId: string, notes: string = ''): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { error } = await supabase.rpc('approve_chapter_application', {
      app_id: applicationId,
      admin_uid: session.user.id,
      notes: notes,
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
      .update({ status: 'Rejected', review_notes: notes })
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

      return (data || []).map((item) => ({
        region: item.region,
        chapter: item.chapter,
        total_patriots: item.total_patriots,
        total_mobilization_points: item.aggregate_chapter_points,
        achievements_unlocked: item.total_chapter_achievements,
        regional_rank: item.regional_chapter_rank,
      }))
    } catch {
      return []
    }
  }
}

export const chapterService = ChapterService.getInstance()
