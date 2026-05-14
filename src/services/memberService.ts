import { supabase } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import type { Member, PendingVerification, AdminUser, AdminRole, AdminPermission, User } from '@/types/admin'

class MemberService {
  private static instance: MemberService

  private constructor() {}

  public static getInstance(): MemberService {
    if (!MemberService.instance) {
      MemberService.instance = new MemberService()
    }
    return MemberService.instance
  }

  async getMembers(): Promise<Member[]> {
    const [usersRes, adminsRes] = await Promise.all([
      supabase
        .from('users')
        .select('id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,city,residential_address')
        .order('joined_at', { ascending: false }),
      supabase.from('admins').select('id'),
    ])

    const { data, error } = usersRes
    const adminIdSet = new Set((adminsRes.data || []).map((a: { id: string }) => a.id))

    if (error) {
      console.warn('[DATABASE] Failed to fetch members:', error)
      return []
    }

    return data
      .filter((u) => !adminIdSet.has(u.id))
      .map((u) => ({
        id: u.registration_number,
        authId: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone_number || 'N/A',
        region: u.region || 'Region pending',
        constituency: u.constituency || 'Constituency pending',
        status: u.status,
        joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
        platform: u.platform || 'GHANA',
        type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
        avatarUrl: u.avatar_url || undefined,
        gender: u.gender || 'Not specified',
        chapter: u.chapter || 'TBM Ghana Chapter',
        country: u.country || 'Ghana',
        profession: u.profession || 'Patriot',
        city: u.city || undefined,
        residentialAddress: u.residential_address || undefined
      }))
  }

  async getAdministrators(): Promise<AdminUser[]> {
    interface AdminDbResponse {
      id: string;
      role: string;
      permissions: AdminPermission[];
      users: {
        full_name: string;
        email: string;
        region: string | null;
      } | null;
    }

    const { data, error } = await supabase
      .from('admins')
      .select(`
        id,
        role,
        permissions,
        users!admins_id_fkey (
          full_name,
          email,
          region,
          avatar_url
        )
      `)

    if (error || !data) {
      console.error('[DATABASE] Failed to fetch administrators:', error)
      return []
    }

    const typedData = data as unknown as (AdminDbResponse & { users: { avatar_url: string | null } })[]

    return typedData.map((a) => ({
      id: a.id,
      name: a.users?.full_name || 'Authorized Officer',
      email: a.users?.email || 'hq@thebase.gh',
      role: a.role as AdminRole,
      region: a.users?.region || 'National HQ',
      permissions: a.permissions as AdminPermission[],
      avatarUrl: a.users?.avatar_url || undefined
    }))
  }

  async getMemberProfile(regNo: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('registration_number', regNo)
      .single()

    if (error || !data) {
      console.error('[DATABASE] Failed to fetch member profile:', error)
      return null
    }

    return {
      id: data.registration_number,
      authId: data.id,
      name: data.full_name,
      email: data.email,
      phone: data.phone_number || 'N/A',
      region: data.region || 'Unknown',
      constituency: data.constituency || 'Unknown',
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : 'N/A',
      platform: data.platform || 'GHANA',
      type: data.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: data.avatar_url || undefined,
      gender: data.gender || 'Unknown',
      chapter: data.chapter || 'TBM Ghana Chapter',
      country: data.country || 'Ghana',
      profession: data.profession || 'Patriot',
      city: data.city || undefined,
      residentialAddress: data.residential_address || undefined
    }
  }

  async getMemberProfileByAuthId(authId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.registration_number,
      authId: data.id,
      name: data.full_name,
      email: data.email,
      phone: data.phone_number || 'N/A',
      region: data.region || 'Unknown',
      constituency: data.constituency || 'Unknown',
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : 'N/A',
      platform: data.platform || 'GHANA',
      type: data.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: data.avatar_url || undefined,
      gender: data.gender || 'Unknown',
      chapter: data.chapter || 'TBM Ghana Chapter',
      country: data.country || 'Ghana',
      profession: data.profession || 'Patriot'
    }
  }

  async registerMember(data: User): Promise<{ data: boolean; error: PostgrestError | null }> {
    const { error } = await supabase
      .from('users')
      .insert([data])
    
    return { data: !error, error }
  }

  async getGrowthStats(): Promise<{ joined_last_hour: number; joined_last_24h: number; joined_last_7d: number }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      const [hourRes, dayRes, weekRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('joined_at', oneHourAgo),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('joined_at', oneDayAgo),
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('joined_at', sevenDaysAgo)
      ])

      return {
        joined_last_hour: hourRes.count || 0,
        joined_last_24h: dayRes.count || 0,
        joined_last_7d: weekRes.count || 0
      }
    } catch (error) {
      console.warn('[DATABASE] Failed to fetch growth stats:', error)
      return { joined_last_hour: 0, joined_last_24h: 0, joined_last_7d: 0 }
    }
  }

  async updateMemberProfile(regNo: string, profile: Partial<Member>): Promise<boolean> {
    const updateData: Record<string, string | null | undefined> = {}
    if (profile.name) updateData.full_name = profile.name
    if (profile.email) updateData.email = profile.email
    if (profile.phone) updateData.phone_number = profile.phone
    if (profile.region) updateData.region = profile.region
    if (profile.constituency) updateData.constituency = profile.constituency
    if (profile.avatarUrl !== undefined) updateData.avatar_url = profile.avatarUrl
    if (profile.gender) updateData.gender = profile.gender
    if (profile.chapter) updateData.chapter = profile.chapter
    if (profile.profession) updateData.profession = profile.profession
    if (profile.city) updateData.city = profile.city
    if (profile.residentialAddress) updateData.residential_address = profile.residentialAddress

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('registration_number', regNo)

    if (error) {
      console.error('[DATABASE] Failed to update member profile:', error)
      return false
    }

    if (profile.name) localStorage.setItem('userName', profile.name)
    if (profile.avatarUrl) localStorage.setItem('userAvatar', profile.avatarUrl)
    window.dispatchEvent(new Event('storage'))

    return true
  }

  async getPendingVerifications(): Promise<PendingVerification[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('verification_status', ['In Review', 'Processing', 'Flagged'])
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch pending verifications:', error)
      return []
    }

    return (data || []).map(u => ({
      id: u.registration_number,
      name: u.full_name,
      region: u.region,
      constituency: u.constituency,
      platform: u.platform,
      country: u.country,
      phone: u.phone_number,
      gender: u.gender,
      ageRange: u.age_range,
      profession: u.profession,
      educationLevel: u.education_level,
      emergencyName: u.emergency_name,
      emergencyRelationship: u.emergency_relationship,
      emergencyPhone: u.emergency_phone,
      submitted: new Date(u.joined_at).toLocaleString(),
      status: u.verification_status,
      photoUrl: u.avatar_url,
      chapter: u.chapter
    }))
  }

  async verifyMember(id: string, approve: boolean, reason?: string, chapterName?: string): Promise<boolean> {
    const status = approve ? 'Approved' : 'Rejected'
    const accountStatus = approve ? 'Active' : 'Suspended'
    
    const { error } = await supabase
      .from('users')
      .update({ 
        verification_status: status,
        status: accountStatus,
        chapter: chapterName || null,
        verification_notes: reason || null
      })
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member verification failed:', error)
      return false
    }

    return true
  }

  async getCountries(): Promise<{ id: string | number; name: string; dialing_code: string; is_diaspora: boolean }[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })

    if (error || !Array.isArray(data)) return []
    return data
  }

  async deleteMember(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member deletion failed:', error)
      return false
    }
    return true
  }

  async searchMembers(query: string): Promise<Member[]> {
    if (!query || query.length < 2) return []

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.warn('[DATABASE] Failed to search members:', error)
      return []
    }

    return (data || []).map((u) => ({
      id: u.registration_number,
      authId: u.id,
      name: u.full_name,
      email: u.email,
      phone: u.phone_number || 'N/A',
      region: u.region || 'Region pending',
      constituency: u.constituency || 'Constituency pending',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      platform: u.platform || 'GHANA',
      type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: u.avatar_url || undefined,
      gender: u.gender || 'Not specified',
      chapter: u.chapter || 'TBM Ghana Chapter',
      country: u.country || 'Ghana',
      profession: u.profession || 'Patriot',
      city: u.city || undefined,
      residentialAddress: u.residential_address || undefined
    }))
  }

  subscribeToNewMembers(callback: (member: Member) => void) {
    const channelId = `new_members_${Math.random().toString(36).substring(2, 9)}`
    return supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
          filter: 'status=eq.Active'
        },
        (payload) => {
          const u = payload.new
          callback({
            id: u.registration_number,
            name: u.full_name,
            email: u.email,
            phone: u.phone_number || 'N/A',
            region: u.region || 'Region pending',
            constituency: u.constituency || 'Constituency pending',
            status: u.status,
            joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
            platform: u.platform || 'GHANA',
            type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
            avatarUrl: u.avatar_url || undefined,
            gender: u.gender || 'Not specified',
            chapter: u.chapter || 'TBM Ghana Chapter',
            country: u.country || 'Ghana',
            profession: u.profession || 'Patriot',
            city: u.city || undefined,
            residentialAddress: u.residential_address || undefined
          })
        }
      )
      .subscribe()
  }

  async getMembersPaginated(page: number, pageSize: number, searchTerm?: string): Promise<{ data: Member[], totalCount: number }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('users')
      .select('id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,city,residential_address', { count: 'exact' })

    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`)
    }

    const { data, count, error } = await query
      .order('joined_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn('[DATABASE] Failed to fetch paginated members:', error)
      return { data: [], totalCount: 0 }
    }

    const members: Member[] = (data || []).map((u) => ({
      id: u.registration_number,
      authId: u.id,
      name: u.full_name,
      email: u.email,
      phone: u.phone_number || 'N/A',
      region: u.region || 'Region pending',
      constituency: u.constituency || 'Constituency pending',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      platform: u.platform || 'GHANA',
      type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: u.avatar_url || undefined,
      gender: u.gender || 'Not specified',
      chapter: u.chapter || 'TBM Ghana Chapter',
      country: u.country || 'Ghana',
      profession: u.profession || 'Patriot',
      city: u.city || undefined,
      residentialAddress: u.residential_address || undefined
    }))

    return { data: members, totalCount: count || 0 }
  }

  async getTotalMemberCount(): Promise<number> {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'Verified')
    
    if (error) {
      console.warn('[DATABASE] Failed to fetch total member count:', error)
      return 0
    }
    
    return count || 0
  }
}

export const memberService = MemberService.getInstance()
