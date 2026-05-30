import { supabase } from '@/lib/supabase'
import type { Constituency, ConstituencyActivity } from '@/types/admin'

export function constituencySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

class ConstituencyService {
  private static instance: ConstituencyService
  private constructor() {}

  static getInstance(): ConstituencyService {
    if (!ConstituencyService.instance) {
      ConstituencyService.instance = new ConstituencyService()
    }
    return ConstituencyService.instance
  }

  async getConstituencies(): Promise<Constituency[]> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')
      .order('name', { ascending: true })

    if (error) {
      console.error('[CONSTITUENCY] Fetch failed:', error)
      return []
    }

    const { data: memberRows } = await supabase
      .from('users')
      .select('constituency')
      .not('constituency', 'is', null)

    const liveCounts: Record<string, number> = {}
    ;(memberRows || []).forEach((u: { constituency: string | null }) => {
      if (u.constituency) {
        const key = u.constituency.toLowerCase()
        liveCounts[key] = (liveCounts[key] || 0) + 1
      }
    })

    const leaderIds = (data || [])
      .map((c) => c.leader_id as string | null)
      .filter(Boolean) as string[]

    const leaderAvatarMap: Record<string, string> = {}
    if (leaderIds.length > 0) {
      const { data: leaderRows } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', leaderIds)
      ;(leaderRows || []).forEach((u: { id: string; avatar_url: string | null }) => {
        if (u.id && u.avatar_url) leaderAvatarMap[u.id] = u.avatar_url
      })
    }

    return (data || []).map((c) => ({
      id: c.id as number,
      name: c.name as string,
      regionId: c.region_id as number,
      regionName: (c.region as { name: string } | null)?.name || '',
      memberCount: liveCounts[(c.name as string).toLowerCase()] ?? 0,
      leaderId: (c.leader_id as string | null) || undefined,
      leaderName: (c.leader_name as string | null) || undefined,
      leaderAvatarUrl: (c.leader_id && leaderAvatarMap[c.leader_id as string]) || undefined,
      description: (c.description as string | null) || undefined,
      status: (c.status as string) || 'Active',
      meetingSchedule: (c.meeting_schedule as string | null) || undefined,
      localFocus: (c.local_focus as string | null) || undefined,
      email: (c.email as string | null) || undefined,
      phoneNumber: (c.phone_number as string | null) || undefined,
    }))
  }

  async getConstituencyBySlug(slug: string): Promise<Constituency | null> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')

    if (error || !data) return null

    const row = data.find((c) => constituencySlug(c.name as string) === slug)
    if (!row) return null

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('constituency', row.name as string)

    let leaderAvatarUrl: string | undefined
    if (row.leader_id) {
      const { data: ld } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', row.leader_id as string)
        .maybeSingle()
      if (ld?.avatar_url) leaderAvatarUrl = ld.avatar_url as string
    }

    return {
      id: row.id as number,
      name: row.name as string,
      regionId: row.region_id as number,
      regionName: (row.region as { name: string } | null)?.name || '',
      memberCount: count || 0,
      leaderId: (row.leader_id as string | null) || undefined,
      leaderName: (row.leader_name as string | null) || undefined,
      leaderAvatarUrl,
      description: (row.description as string | null) || undefined,
      status: (row.status as string) || 'Active',
      meetingSchedule: (row.meeting_schedule as string | null) || undefined,
      localFocus: (row.local_focus as string | null) || undefined,
      email: (row.email as string | null) || undefined,
      phoneNumber: (row.phone_number as string | null) || undefined,
    }
  }

  async getConstituencyById(id: number): Promise<Constituency | null> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('*, region:ghana_regions(name)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return null

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('constituency', data.name as string)

    let leaderAvatarUrl: string | undefined
    if (data.leader_id) {
      const { data: ld } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', data.leader_id as string)
        .maybeSingle()
      if (ld?.avatar_url) leaderAvatarUrl = ld.avatar_url as string
    }

    return {
      id: data.id as number,
      name: data.name as string,
      regionId: data.region_id as number,
      regionName: (data.region as { name: string } | null)?.name || '',
      memberCount: count || 0,
      leaderId: (data.leader_id as string | null) || undefined,
      leaderName: (data.leader_name as string | null) || undefined,
      leaderAvatarUrl,
      description: (data.description as string | null) || undefined,
      status: (data.status as string) || 'Active',
      meetingSchedule: (data.meeting_schedule as string | null) || undefined,
      localFocus: (data.local_focus as string | null) || undefined,
      email: (data.email as string | null) || undefined,
      phoneNumber: (data.phone_number as string | null) || undefined,
    }
  }

  async getConstituencyActivities(id: number): Promise<ConstituencyActivity[]> {
    const { data, error } = await supabase
      .from('constituency_activities')
      .select('*')
      .eq('constituency_id', id)
      .order('activity_date', { ascending: false })

    if (error) return []

    return (data || []).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      description: (a.description as string | null) || undefined,
      type: a.type as string,
      activityDate: a.activity_date as string,
    }))
  }

  async addActivity(
    constituencyId: number,
    activity: { title: string; description?: string; type: string; activityDate: string }
  ): Promise<boolean> {
    const { error } = await supabase.from('constituency_activities').insert({
      constituency_id: constituencyId,
      title: activity.title,
      description: activity.description || null,
      type: activity.type,
      activity_date: activity.activityDate,
    })
    if (error) {
      console.error('[CONSTITUENCY] Add activity failed:', error)
      return false
    }
    return true
  }

  async deleteActivity(activityId: string): Promise<boolean> {
    const { error } = await supabase.from('constituency_activities').delete().eq('id', activityId)
    if (error) {
      console.error('[CONSTITUENCY] Delete activity failed:', error)
      return false
    }
    return true
  }

  async updateConstituency(
    id: number,
    patch: Partial<
      Pick<
        Constituency,
        | 'leaderId'
        | 'leaderName'
        | 'description'
        | 'status'
        | 'meetingSchedule'
        | 'localFocus'
        | 'email'
        | 'phoneNumber'
      >
    >
  ): Promise<boolean> {
    const updateData: Record<string, string | null | undefined> = {}
    if (patch.leaderId !== undefined) updateData.leader_id = patch.leaderId || null
    if (patch.leaderName !== undefined) updateData.leader_name = patch.leaderName || null
    if (patch.description !== undefined) updateData.description = patch.description || null
    if (patch.status !== undefined) updateData.status = patch.status
    if (patch.meetingSchedule !== undefined)
      updateData.meeting_schedule = patch.meetingSchedule || null
    if (patch.localFocus !== undefined) updateData.local_focus = patch.localFocus || null
    if (patch.email !== undefined) updateData.email = patch.email || null
    if (patch.phoneNumber !== undefined) updateData.phone_number = patch.phoneNumber || null

    const { error } = await supabase.from('ghana_constituencies').update(updateData).eq('id', id)

    if (error) {
      console.error('[CONSTITUENCY] Update failed:', error)
      return false
    }
    return true
  }
}

export const constituencyService = ConstituencyService.getInstance()
