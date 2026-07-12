export type MemberAssignmentIssue = {
  id: string
  registrationNumber: string | null
  fullName: string
  platform: 'GHANA' | 'DIASPORA'
  country: string | null
  region: string | null
  constituency: string | null
  chapter: string | null
  issueCode:
    | 'missing_constituency'
    | 'invalid_constituency'
    | 'ghana_has_chapter'
    | 'diaspora_has_ghana_assignment'
    | 'diaspora_country_is_ghana'
    | 'invalid_diaspora_chapter'
}

import { supabase } from '@/lib/supabase'
import { getPublicDirectoryProfiles } from '@/lib/publicDirectory'
import { discordService } from '@/services/discordService'
import type { Constituency, ConstituencyActivity, ConstituencyLeader } from '@/types/admin'

export function constituencySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

class ConstituencyService {
  async getAssignmentIssues(): Promise<MemberAssignmentIssue[]> {
    const { data, error } = await supabase
      .from('admin_member_assignment_issues')
      .select(
        'id, registration_number, full_name, platform, country, region, constituency, chapter, issue_code'
      )
      .order('full_name')

    if (error) {
      console.error('[CONSTITUENCY] Assignment reconciliation failed:', error)
      return []
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      registrationNumber: row.registration_number as string | null,
      fullName: row.full_name as string,
      platform: row.platform as 'GHANA' | 'DIASPORA',
      country: row.country as string | null,
      region: row.region as string | null,
      constituency: row.constituency as string | null,
      chapter: row.chapter as string | null,
      issueCode: row.issue_code as MemberAssignmentIssue['issueCode'],
    }))
  }

  private static instance: ConstituencyService
  private constructor() {}

  static getInstance(): ConstituencyService {
    if (!ConstituencyService.instance) {
      ConstituencyService.instance = new ConstituencyService()
    }
    return ConstituencyService.instance
  }

  async getConstituencies(): Promise<Constituency[]> {
    const [{ data, error }, directoryRows] = await Promise.all([
      supabase
        .from('ghana_constituencies')
        .select('*, region:ghana_regions(name)')
        .order('name', { ascending: true }),
      getPublicDirectoryProfiles(),
    ])

    if (error) {
      console.error('[CONSTITUENCY] Fetch failed:', error)
      return []
    }

    const liveCounts: Record<string, number> = {}
    directoryRows.forEach((u: { constituency: string | null }) => {
      if (u.constituency) {
        const key = u.constituency.toLowerCase()
        liveCounts[key] = (liveCounts[key] || 0) + 1
      }
    })

    const leaderIds = (data || [])
      .map((c) => c.leader_id as string | null)
      .filter(Boolean) as string[]

    const leaderAvatarMap: Record<string, string> = {}
    directoryRows.forEach((u: { id: string; avatar_url: string | null }) => {
      if (leaderIds.includes(u.id) && u.avatar_url) leaderAvatarMap[u.id] = u.avatar_url
    })

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

    const directoryRows = await getPublicDirectoryProfiles()
    const count = directoryRows.filter(
      (u) => u.constituency?.toLowerCase() === (row.name as string).toLowerCase()
    ).length
    const leaderAvatarUrl =
      directoryRows.find((u) => u.id === (row.leader_id as string | null))?.avatar_url || undefined

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

    const directoryRows = await getPublicDirectoryProfiles()
    const count = directoryRows.filter(
      (u) => u.constituency?.toLowerCase() === (data.name as string).toLowerCase()
    ).length
    const leaderAvatarUrl =
      directoryRows.find((u) => u.id === (data.leader_id as string | null))?.avatar_url || undefined

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

    if (error) {
      console.error('[CONSTITUENCY] Fetch activities failed:', error)
      return []
    }

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

    const { data: c } = await supabase
      .from('ghana_constituencies')
      .select('name')
      .eq('id', constituencyId)
      .maybeSingle()
    discordService.constituencyActivity((c?.name as string) ?? '', activity.title, activity.type)
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

    // Announce a new leader appointment (not a clear/removal).
    if (patch.leaderId && patch.leaderName) {
      const { data: c } = await supabase
        .from('ghana_constituencies')
        .select('name')
        .eq('id', id)
        .maybeSingle()
      if (c?.name)
        discordService.leaderAppointed('Constituency', c.name as string, patch.leaderName)
    }
    return true
  }

  // --- Committee (Secretary, Deputy Secretary, Treasurer) ---

  async getCommittee(constituencyId: number): Promise<ConstituencyLeader[]> {
    const { data, error } = await supabase
      .from('constituency_leaders')
      .select('*')
      .eq('constituency_id', constituencyId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[CONSTITUENCY] Fetch committee failed:', error)
      return []
    }

    return (data || []).map((r) => ({
      id: r.id as string,
      constituencyId: r.constituency_id as number,
      memberId: (r.member_id as string | null) || undefined,
      name: r.name as string,
      role: r.role as ConstituencyLeader['role'],
      imageUrl: (r.image_url as string | null) || undefined,
      createdAt: r.created_at as string,
    }))
  }

  async addCommitteeMember(
    constituencyId: number,
    member: { memberId?: string; name: string; role: ConstituencyLeader['role']; imageUrl?: string }
  ): Promise<boolean> {
    const { error } = await supabase.from('constituency_leaders').insert({
      constituency_id: constituencyId,
      member_id: member.memberId || null,
      name: member.name,
      role: member.role,
      image_url: member.imageUrl || null,
    })

    if (error) {
      console.error('[CONSTITUENCY] Add committee member failed:', error)
      return false
    }
    return true
  }

  async listNames(): Promise<{ id: number; name: string; regionName?: string }[]> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('id, name, region:ghana_regions(name)')
      .order('name')
    if (error) return []
    return (data || []).map((c) => ({
      id: c.id as number,
      name: c.name as string,
      regionName: (c.region as unknown as { name: string } | null)?.name,
    }))
  }

  async getMembersByConstituencyName(constituencyName: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, status, profession, registration_number')
      .eq('constituency', constituencyName)
      .order('full_name', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async getDonationsByConstituencyName(constituencyName: string) {
    const { data: members } = await supabase
      .from('users')
      .select('id')
      .eq('constituency', constituencyName)
    const memberIds = (members ?? []).map((m) => m.id)
    if (memberIds.length === 0) return []
    const { data } = await supabase
      .from('donations')
      .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
      .in('member_id', memberIds)
      .eq('status', 'Verified')
      .order('created_at', { ascending: false })
    return (data ?? []) as {
      id: string
      full_name: string
      phone: string
      amount: number
      payment_method: string
      status: string
      created_at: string
      reference: string
    }[]
  }

  async searchUsersByName(query: string, limit = 10) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${query}%`)
      .limit(limit)
    return data ?? []
  }

  async removeCommitteeMember(memberId: string): Promise<boolean> {
    const { error } = await supabase.from('constituency_leaders').delete().eq('id', memberId)

    if (error) {
      console.error('[CONSTITUENCY] Remove committee member failed:', error)
      return false
    }
    return true
  }
  // ── Announcements ──

  async getAnnouncements(constituencyId: number) {
    const { data } = await supabase
      .from('constituency_announcements')
      .select('*')
      .eq('constituency_id', constituencyId)
      .order('created_at', { ascending: false })
    return data ?? []
  }

  async postAnnouncement(constituencyId: number, content: string, authorName: string) {
    const { error } = await supabase.from('constituency_announcements').insert({
      constituency_id: constituencyId,
      content,
      author_name: authorName,
    })
    if (error) throw error
    return this.getAnnouncements(constituencyId)
  }

  async deleteAnnouncement(id: string) {
    const { error } = await supabase.from('constituency_announcements').delete().eq('id', id)
    if (error) throw error
  }
}

export const constituencyService = ConstituencyService.getInstance()
