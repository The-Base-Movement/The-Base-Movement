import { supabase } from '@/lib/supabase'
import { sessionStore } from '@/lib/sessionStore'
import { sanitizeOrTerm } from '@/lib/supabaseFilters'
import { resolveStoredAdminPermissions } from '@/lib/adminPermissionHydration'
import type { JobSelection } from '@/services/jobTaxonomyService'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Member, PendingVerification, AdminUser, AdminRole, User } from '@/types/admin'

function stripMarkdownEmail(value: string | null | undefined): string {
  if (!value) return ''
  const match = value.match(/\(mailto:([^)]+)\)/)
  return match ? match[1] : value
}

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
        .select(
          'id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,city,residential_address,voters_id_card,polling_station_code'
        )
        .is('deleted_at', null)
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
        email: stripMarkdownEmail(u.email),
        phone: u.phone_number || '',
        region: u.region || '',
        constituency: u.constituency || '',
        status: u.status,
        joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : '',
        platform: u.platform || 'GHANA',
        type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
        avatarUrl: u.avatar_url || undefined,
        gender: u.gender || 'Not specified',
        chapter: u.chapter || undefined,
        country: u.country || 'Ghana',
        profession: u.profession || 'Compatriot',
        city: u.city || undefined,
        residentialAddress: u.residential_address || undefined,
        votersIdCard: u.voters_id_card || undefined,
        pollingStationCode: u.polling_station_code || undefined,
      }))
  }

  async getAdministrators(): Promise<AdminUser[]> {
    interface AdminDbResponse {
      id: string
      role: string
      permissions: unknown
      users: {
        full_name: string
        email: string
        region: string | null
      } | null
    }

    const { data, error } = await supabase.from('admins').select(`
        id,
        role,
        permissions,
        assigned_region,
        users!admins_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)

    if (error || !data) {
      console.error('[DATABASE] Failed to fetch administrators:', error)
      return []
    }

    const typedData = data as unknown as (AdminDbResponse & {
      assigned_region: string | null
      users: { avatar_url: string | null }
    })[]

    return typedData.map((a) => ({
      id: a.id,
      name: a.users?.full_name || 'Authorized Officer',
      email: a.users?.email || 'hq@thebase.gh',
      role: a.role as AdminRole,
      region: a.assigned_region || undefined,
      permissions: resolveStoredAdminPermissions(a.role as AdminRole, a.permissions),
      avatarUrl: a.users?.avatar_url || undefined,
    }))
  }

  async getMemberProfile(regNo: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,city,residential_address,age_range,job_industry_id,job_sub_category_id,job_role_id,job_custom_title,emergency_name,emergency_relationship,emergency_phone,voters_id_card,polling_station_code'
      )
      .eq('registration_number', regNo)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Failed to fetch member profile:', error)
      return null
    }
    if (!data) return null

    return {
      id: data.registration_number,
      authId: data.id,
      name: data.full_name,
      email: stripMarkdownEmail(data.email),
      phone: data.phone_number || '',
      region: data.region || 'Unknown',
      constituency: data.constituency || 'Unknown',
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : 'N/A',
      platform: data.platform || 'GHANA',
      type: data.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: data.avatar_url || undefined,
      gender: data.gender || 'Unknown',
      chapter: data.chapter || undefined,
      country: data.country || 'Ghana',
      profession: data.profession || 'Compatriot',
      city: data.city || undefined,
      residentialAddress: data.residential_address || undefined,
      ageRange: data.age_range || undefined,
      jobIndustryId: data.job_industry_id ?? null,
      jobSubCategoryId: data.job_sub_category_id ?? null,
      jobRoleId: data.job_role_id ?? null,
      jobCustomTitle: data.job_custom_title ?? null,
      emergencyName: data.emergency_name || undefined,
      emergencyRelationship: data.emergency_relationship || undefined,
      emergencyPhone: data.emergency_phone || undefined,
      votersIdCard: data.voters_id_card || undefined,
      pollingStationCode: data.polling_station_code || undefined,
    }
  }

  async getMemberProfileByAuthId(authId: string): Promise<Member | null> {
    try {
      await supabase.rpc('link_imported_member_profile')
    } catch (e) {
      console.warn('[memberService] Auto-link imported member profile failed:', e)
    }

    const { data, error } = await supabase
      .from('users')
      .select(
        'id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,age_range,emergency_name,emergency_relationship,emergency_phone,voters_id_card,polling_station_code'
      )
      .eq('id', authId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      id: data.registration_number,
      authId: data.id,
      name: data.full_name,
      email: stripMarkdownEmail(data.email),
      phone: data.phone_number || '',
      region: data.region || 'Unknown',
      constituency: data.constituency || 'Unknown',
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : 'N/A',
      platform: data.platform || 'GHANA',
      type: data.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: data.avatar_url || undefined,
      gender: data.gender || 'Unknown',
      chapter: data.chapter || undefined,
      country: data.country || 'Ghana',
      profession: data.profession || 'Compatriot',
      ageRange: data.age_range || undefined,
      emergencyName: data.emergency_name || undefined,
      emergencyRelationship: data.emergency_relationship || undefined,
      emergencyPhone: data.emergency_phone || undefined,
      votersIdCard: data.voters_id_card || undefined,
      pollingStationCode: data.polling_station_code || undefined,
    }
  }

  async ensureRegistrationNumber(authId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, registration_number, platform')
      .eq('id', authId)
      .maybeSingle()

    if (error || !data) return null

    const existing = data.registration_number as string | null
    const isTbmFormat = existing && /^TBM-(GH|DI)-\d{6}$/.test(existing)
    if (isTbmFormat) return existing

    const yearStr = new Date().getFullYear().toString().slice(-2)
    const randomNum = String(Math.floor(1000 + Math.random() * 9000))
    const platform = (data.platform as string) || 'GHANA'
    const newRegNo = `TBM-${platform === 'DIASPORA' ? 'DI' : 'GH'}-${yearStr}${randomNum}`

    await supabase.from('users').update({ registration_number: newRegNo }).eq('id', authId)

    return newRegNo
  }

  async registerMember(data: User): Promise<{ data: boolean; error: PostgrestError | null }> {
    const { error } = await supabase.from('users').insert([data])

    return { data: !error, error }
  }

  async bulkRegisterMembers(
    users: User[]
  ): Promise<{ inserted: number; skipped: number; error: PostgrestError | null }> {
    const batchSize = 50
    let totalInserted = 0
    let totalSkipped = 0

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)

      // Pre-check phone numbers, emails, and registration numbers so duplicates are skipped/resolved
      const phones = batch.map((u) => u.phone_number).filter(Boolean)
      const emails = batch.map((u) => u.email).filter(Boolean) as string[]
      const regNos = batch.map((u) => u.registration_number).filter(Boolean)

      const [phoneRes, emailRes, regNoRes] = await Promise.all([
        supabase.from('users').select('phone_number').in('phone_number', phones),
        emails.length > 0
          ? supabase.from('users').select('email').in('email', emails)
          : Promise.resolve({ data: [] }),
        supabase.from('users').select('registration_number').in('registration_number', regNos),
      ])

      const existingPhones = new Set(phoneRes.data?.map((u) => u.phone_number) ?? [])
      const existingEmails = new Set(emailRes.data?.map((u) => u.email) ?? [])
      const existingRegNos = new Set(regNoRes.data?.map((u) => u.registration_number) ?? [])

      const seenPhones = new Set<string>()
      const seenEmails = new Set<string>()
      const seenRegNos = new Set<string>()

      const newRecords = batch
        .filter((u) => {
          if (existingPhones.has(u.phone_number) || seenPhones.has(u.phone_number)) return false
          if (u.email && (existingEmails.has(u.email) || seenEmails.has(u.email))) return false
          seenPhones.add(u.phone_number)
          if (u.email) seenEmails.add(u.email)
          return true
        })
        .map((u) => {
          let regNo = u.registration_number
          const platform = u.platform || 'GHANA'
          const yearStr = new Date().getFullYear().toString().slice(-2)

          // If the registration number collides with an existing one, or is a duplicate within the current batch, regenerate
          while (!regNo || existingRegNos.has(regNo) || seenRegNos.has(regNo)) {
            const randomNum = String(Math.floor(1000 + Math.random() * 9000))
            regNo = `TBM-${platform === 'DIASPORA' ? 'DI' : 'GH'}-${yearStr}${randomNum}`
          }
          seenRegNos.add(regNo)
          return { ...u, registration_number: regNo }
        })

      totalSkipped += batch.length - newRecords.length

      if (newRecords.length > 0) {
        const { error } = await supabase.from('users').insert(newRecords)
        if (error) {
          console.error('[DATABASE] Bulk member registration failed at batch:', i, error)
          return { inserted: totalInserted, skipped: totalSkipped, error }
        }
        totalInserted += newRecords.length
      }
    }

    return { inserted: totalInserted, skipped: totalSkipped, error: null }
  }

  async getGrowthStats(): Promise<{
    joined_last_hour: number
    joined_last_24h: number
    joined_last_7d: number
  }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      const [hourRes, dayRes, weekRes] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('joined_at', oneHourAgo),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('joined_at', oneDayAgo),
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('joined_at', sevenDaysAgo),
      ])

      return {
        joined_last_hour: hourRes.count || 0,
        joined_last_24h: dayRes.count || 0,
        joined_last_7d: weekRes.count || 0,
      }
    } catch (error) {
      console.warn('[DATABASE] Failed to fetch growth stats:', error)
      return { joined_last_hour: 0, joined_last_24h: 0, joined_last_7d: 0 }
    }
  }

  async updateMemberProfile(
    regNo: string,
    profile: Partial<Member> & { job?: JobSelection }
  ): Promise<boolean> {
    const updateData: Record<string, string | number | null | undefined> = {}
    if (profile.job) {
      updateData.job_industry_id = profile.job.industryId
      updateData.job_sub_category_id = profile.job.subCategoryId
      updateData.job_role_id = profile.job.isOther ? null : profile.job.roleId
      updateData.job_custom_title = profile.job.isOther
        ? profile.job.customTitle.trim() || null
        : null
    }
    if (profile.name) updateData.full_name = profile.name
    if (profile.email) updateData.email = profile.email
    if (profile.phone && profile.phone !== 'N/A') updateData.phone_number = profile.phone
    if (profile.region) updateData.region = profile.region
    if (profile.constituency) updateData.constituency = profile.constituency
    if (profile.avatarUrl !== undefined) updateData.avatar_url = profile.avatarUrl

    // The gender field from ProfileSettings actually comes in as "Gender / Age Range"
    if (profile.gender) {
      if (profile.gender.includes(' / ')) {
        const [g, a] = profile.gender.split(' / ')
        updateData.gender = g
        updateData.age_range = a
      } else {
        updateData.gender = profile.gender
      }
    }

    if (profile.chapter) updateData.chapter = profile.chapter
    if (profile.country) updateData.country = profile.country
    if (profile.profession) updateData.profession = profile.profession
    if (profile.nationalId) updateData.national_id = profile.nationalId
    if (profile.city) updateData.city = profile.city
    // Optional field: use `!== undefined` (not truthy) so a member can also
    // CLEAR their residential address later, not just set/change it.
    if (profile.residentialAddress !== undefined)
      updateData.residential_address = profile.residentialAddress || null
    if (profile.emergencyName !== undefined)
      updateData.emergency_name = profile.emergencyName || null
    if (profile.emergencyRelationship !== undefined)
      updateData.emergency_relationship = profile.emergencyRelationship || null
    if (profile.emergencyPhone !== undefined)
      updateData.emergency_phone = profile.emergencyPhone || null

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('registration_number', regNo)

    if (error) {
      console.error('[DATABASE] Failed to update member profile:', error)
      if (error.code === '23505') {
        if (error.message.includes('phone')) {
          throw new Error('That phone number is already registered to another member.')
        }
        if (error.message.includes('email')) {
          throw new Error('That email address is already registered to another member.')
        }
        throw new Error('A profile with those details already exists.')
      }
      throw new Error('Failed to save profile. Please try again.')
    }

    if (profile.name) sessionStore.setItem('userName', profile.name)
    if (profile.avatarUrl) sessionStore.setItem('userAvatar', profile.avatarUrl)
    window.dispatchEvent(new Event('storage'))

    return true
  }

  async getPendingVerifications(
    statuses: string[] = ['In Review', 'Processing', 'Flagged'],
    maxRows = Number.POSITIVE_INFINITY
  ): Promise<PendingVerification[]> {
    const PAGE = 1000
    let from = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let all: any[] = []

    // Supabase caps results at 1000 rows by default — paginate to get all,
    // stopping early at maxRows (used to cap large terminal buckets like Approved).
    while (all.length < maxRows) {
      const { data, error } = await supabase
        .from('users')
        .select(
          'id,registration_number,full_name,region,constituency,platform,country,phone_number,gender,age_range,profession,education_level,emergency_name,emergency_relationship,emergency_phone,joined_at,avatar_url,chapter,verification_status,voters_id_card,polling_station_code'
        )
        .in('verification_status', statuses)
        .order('joined_at', { ascending: false })
        .range(from, from + PAGE - 1)

      if (error) {
        console.error('[DATABASE] Failed to fetch pending verifications:', error)
        break
      }

      all = all.concat(data || [])
      if (!data || data.length < PAGE) break
      from += PAGE
    }
    if (all.length > maxRows) all = all.slice(0, maxRows)

    return all.map((u) => ({
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
      submitted: new Date(u.joined_at as string).toLocaleString(),
      status: u.verification_status,
      photoUrl: u.avatar_url,
      chapter: u.chapter,
      votersIdCard: u.voters_id_card,
      pollingStationCode: u.polling_station_code,
    }))
  }

  /** Live count of members in each verification stage — for the queue KPI tiles. */
  async getVerificationCounts(): Promise<Record<string, number>> {
    const statuses = ['In Review', 'Processing', 'Flagged', 'Approved', 'Rejected']
    const entries = await Promise.all(
      statuses.map(async (s) => {
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', s)
        return [s, count || 0] as const
      })
    )
    return Object.fromEntries(entries)
  }

  /**
   * Move a member between verification stages (In Review / Processing / Flagged /
   * Approved / Rejected) without deleting them — used by the manual review
   * controls. Approve uses verifyMember() instead (it also runs bonuses/emails);
   * this keeps a rejected member on record so it stays visible in the queue.
   */
  async updateVerificationStatus(id: string, status: string): Promise<boolean> {
    const accountStatus =
      status === 'Approved' ? 'Active' : status === 'Rejected' ? 'Suspended' : 'Pending'
    const { error } = await supabase
      .from('users')
      .update({ verification_status: status, status: accountStatus })
      .eq('registration_number', id)
    if (error) {
      console.error('[DATABASE] Update verification status failed:', error)
      return false
    }
    return true
  }

  async verifyMember(
    id: string,
    approve: boolean,
    reason?: string,
    chapterName?: string
  ): Promise<boolean> {
    if (!approve) {
      // 1. Get avatar URL to clean up storage
      const { data: member } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('registration_number', id)
        .maybeSingle()

      if (member?.avatar_url) {
        const marker = '/avatars/'
        const idx = member.avatar_url.indexOf(marker)
        if (idx !== -1) {
          const path = decodeURIComponent(
            member.avatar_url.slice(idx + marker.length).split('?')[0]
          )
          if (path) {
            await supabase.storage.from('avatars').remove([path])
          }
        }
      }

      // 2. Call the secure RPC to completely delete user from auth.users and public.users
      const { error: purgeErr } = await supabase.rpc('purge_member_completely', {
        p_reg_no: id,
      })

      if (purgeErr) {
        console.error('[DATABASE] Purge member completely failed:', purgeErr)
        return false
      }

      return true
    }

    const status = approve ? 'Approved' : 'Rejected'
    const accountStatus = approve ? 'Active' : 'Suspended'

    const { error } = await supabase
      .from('users')
      .update({
        verification_status: status,
        status: accountStatus,
        chapter: chapterName || null,
        verification_notes: reason || null,
      })
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member verification failed:', error)
      return false
    }

    // Award verification bonus to the referrer — fire-and-forget
    if (approve) {
      ;(async () => {
        try {
          const { data: member } = await supabase
            .from('users')
            .select('id')
            .eq('registration_number', id)
            .single()
          if (member?.id) {
            const { error: rpcErr } = await supabase.rpc('award_referral_verification_bonus', {
              p_member_id: member.id,
            })
            if (rpcErr) console.warn('[referral] verification bonus RPC failed:', rpcErr)
          }
        } catch {
          // non-critical — verification already succeeded
        }
      })()
    }

    return true
  }

  async getCountries(): Promise<
    { id: string | number; name: string; dialing_code: string; is_diaspora: boolean }[]
  > {
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
      .update({ deleted_at: new Date().toISOString() })
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member soft-delete failed:', error)
      return false
    }
    return true
  }

  async getTrashedMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id,registration_number,full_name,email,avatar_url,platform,region,constituency,status,joined_at,deleted_at'
      )
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch trashed members:', error)
      return []
    }

    return (data || []).map((u) => ({
      id: u.registration_number,
      authId: u.id,
      name: u.full_name,
      email: stripMarkdownEmail(u.email),
      phone: 'N/A',
      region: u.region || '',
      constituency: u.constituency || '',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      platform: u.platform || 'GHANA',
      type: 'Standard',
      avatarUrl: u.avatar_url || undefined,
      deletedAt: u.deleted_at as string,
    }))
  }

  async restoreMember(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: null })
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member restore failed:', error)
      return false
    }
    return true
  }

  async permanentlyDeleteMember(id: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member permanent deletion failed:', error)
      return false
    }
    return true
  }

  async searchMembers(
    query: string,
    searchType: 'name' | 'id' | 'phone' = 'name'
  ): Promise<Member[]> {
    if (!query || query.length < 2) return []

    let supabaseQuery = supabase
      .from('users')
      .select(
        'id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,age_range,city,residential_address'
      )
      .is('deleted_at', null)

    if (searchType === 'id') {
      supabaseQuery = supabaseQuery.ilike('registration_number', `%${query}%`)
    } else if (searchType === 'phone') {
      supabaseQuery = supabaseQuery.ilike('phone_number', `%${query}%`)
    } else {
      supabaseQuery = supabaseQuery.ilike('full_name', `%${query}%`)
    }

    const { data, error } = await supabaseQuery.limit(10)

    if (error) {
      console.warn('[DATABASE] Failed to search members:', error)
      return []
    }

    return (data || []).map((u) => ({
      id: u.registration_number,
      authId: u.id,
      name: u.full_name,
      email: stripMarkdownEmail(u.email),
      phone: u.phone_number || 'N/A',
      region: u.region || '',
      constituency: u.constituency || '',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      platform: u.platform || 'GHANA',
      type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: u.avatar_url || undefined,
      gender: u.gender || 'Not specified',
      chapter: u.chapter || undefined,
      country: u.country || 'Ghana',
      profession: u.profession || 'Compatriot',
      city: u.city || undefined,
      residentialAddress: u.residential_address || undefined,
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
          filter: 'status=eq.Active',
        },
        (payload) => {
          const u = payload.new
          callback({
            id: u.registration_number,
            name: u.full_name,
            email: stripMarkdownEmail(u.email),
            phone: u.phone_number || 'N/A',
            region: u.region || 'Region pending',
            constituency: u.constituency || 'Constituency pending',
            status: u.status,
            joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
            platform: u.platform || 'GHANA',
            type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
            avatarUrl: u.avatar_url || undefined,
            gender: u.gender || 'Not specified',
            chapter: u.chapter || undefined,
            country: u.country || 'Ghana',
            profession: u.profession || 'Compatriot',
            city: u.city || undefined,
            residentialAddress: u.residential_address || undefined,
          })
        }
      )
      .subscribe()
  }

  async getMembersPaginated(
    page: number,
    pageSize: number,
    searchTerm?: string,
    registrationSource?: string,
    searchType: 'default' | 'constituency' | 'polling_station' = 'default',
    sortOrder?: 'asc' | 'desc',
    gender?: string,
    ageRange?: string
  ): Promise<{ data: Member[]; totalCount: number }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('users')
      .select(
        'id,registration_number,full_name,email,phone_number,region,constituency,status,joined_at,platform,avatar_url,gender,chapter,country,profession,city,residential_address,registration_source,age_range',
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .eq('status', 'Active')

    if (gender) query = query.eq('gender', gender)
    if (ageRange) query = query.eq('age_range', ageRange)

    if (searchTerm) {
      if (searchType === 'constituency') {
        query = query.ilike('constituency', `%${searchTerm}%`)
      } else if (searchType === 'polling_station') {
        const { data: agentRows } = await supabase
          .from('polling_station_agents')
          .select('member_id')
          .ilike('polling_station_id', `%${searchTerm}%`)
        const memberIds = (agentRows ?? []).map((r: { member_id: string }) => r.member_id)
        if (memberIds.length === 0) {
          return { data: [], totalCount: 0 }
        }
        query = query.in('id', memberIds)
      } else {
        const term = sanitizeOrTerm(searchTerm)
        query = query.or(
          `full_name.ilike.%${term}%,phone_number.ilike.%${term}%,registration_number.ilike.%${term}%`
        )
      }
    }

    if (registrationSource && registrationSource !== 'all') {
      query = query.eq('registration_source', registrationSource)
    }

    if (sortOrder) {
      query = query.order('full_name', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('joined_at', { ascending: false })
    }

    const { data, count, error } = await query.range(from, to)

    if (error) {
      console.warn('[DATABASE] Failed to fetch paginated members:', error)
      return { data: [], totalCount: 0 }
    }

    const members: Member[] = (data || []).map((u) => ({
      id: u.registration_number,
      authId: u.id,
      name: u.full_name,
      email: stripMarkdownEmail(u.email),
      phone: u.phone_number || 'N/A',
      region: u.region || '',
      constituency: u.constituency || '',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      platform: u.platform || 'GHANA',
      type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: u.avatar_url || undefined,
      gender: u.gender || 'Not specified',
      chapter: u.chapter || undefined,
      country: u.country || 'Ghana',
      profession: u.profession || 'Compatriot',
      city: u.city || undefined,
      residentialAddress: u.residential_address || undefined,
      registrationSource: u.registration_source || 'digital',
    }))

    return { data: members, totalCount: count || 0 }
  }

  async getTotalMemberCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_verified_member_count')

    if (error) {
      console.warn('[DATABASE] Failed to fetch total member count:', error)
      return 0
    }

    return Number(data) || 0
  }

  async getTotalRegisteredCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_registered_member_count')

    if (error) {
      console.warn('[DATABASE] Failed to fetch registered member count:', error)
      return 0
    }

    return Number(data) || 0
  }

  /**
   * Anon-safe regional member distribution for the public Impact page.
   * Reads the SECURITY DEFINER get_regional_member_counts() RPC (region label +
   * count only, no PII), since anon cannot read member rows directly.
   */
  async getRegionalMemberCounts(): Promise<{ region: string; count: number }[]> {
    const { data, error } = await supabase.rpc('get_regional_member_counts')

    if (error) {
      console.warn('[DATABASE] Failed to fetch regional member counts:', error)
      return []
    }

    return ((data ?? []) as { region: string; member_count: number }[]).map((r) => ({
      region: r.region,
      count: Number(r.member_count) || 0,
    }))
  }

  async syncSendgridBulk(): Promise<{ total: number; success: number; failed: number }> {
    const { data, error } = await supabase.functions.invoke('sync-sendgrid-bulk')
    if (error) throw error
    return data as { total: number; success: number; failed: number }
  }
}

export const memberService = MemberService.getInstance()
