import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import { allChapters } from '../data/chaptersData'

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  region: string
  constituency: string
  status: 'Active' | 'Pending' | 'Suspended' | 'In Review'
  joined: string
  type: 'Standard' | 'Premium'
  avatarUrl?: string
  gender?: string
  chapter?: string
  country?: string
  profession?: string
}

export interface Region {
  id: number
  name: string
  constituencies: string[]
}

export interface Chapter {
  id: string
  name: string
  city_or_region: string
  country: string
  leader_name: string
  member_count: number
  status: 'Active' | 'Pending' | 'Closed' | 'Member' | 'Join Chapter' | string
  image_url?: string
  description?: string
  details_url?: string
}

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  status: 'Active' | 'Draft' | 'Closed'
  totalVotes: number
  region: string
  endDate: string
  category: string
  options: PollOption[]
  voted?: boolean
  userSelection?: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  price: string
  stock: number
  status: 'Stable' | 'Low Stock' | 'Critical' | 'Processing'
  image: string
  color: string
}

export interface PollStats {
  totalEngagements: string
  activePolls: number
  avgResponseTime: string
  feedbackRate: string
}

export interface RegionalStat {
  region: string
  memberCount: number
  chapters: number
  activePolls: number
  performance: 'High' | 'Medium' | 'Low'
  color: string
}

export interface GrowthTrend {
  date: string
  count: number
}

export interface ActivityLog {
  id: number
  type: 'registration' | 'chapter' | 'poll' | 'store' | 'security'
  user: string
  time: string
  details: string
  icon: string
  color: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  authorId: string
  authorName?: string
  category: string
  imageUrl?: string
  readTime: string
  isFeatured: boolean
  publishedAt: string
  tags: string[]
  seoTitle?: string
  metaDescription?: string
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  adminId: string
  adminName: string
  action: string
  resource: string
  status: 'Success' | 'Failure' | 'Warning'
  ipAddress?: string
  details?: Record<string, unknown>
}

export type AdminRole = 'SUPER_ADMIN' | 'REGIONAL_DIRECTOR' | 'CONSTITUENCY_LEAD' | 'VERIFIER'

export interface AdminPermission {
  action: 'VERIFY_MEMBER' | 'MANAGE_CHAPTER' | 'MANAGE_POLLS' | 'MANAGE_INVENTORY' | 'VIEW_AUDIT_LOGS' | 'APPOINT_LEAD' | 'MANAGE_BLOGS'
  resource: 'MEMBERS' | 'CHAPTERS' | 'POLLS' | 'STORE' | 'SYSTEM' | 'BLOGS'
}

export interface SentimentStat {
  topic: string
  score: number // 0-100
  trend: 'Up' | 'Down' | 'Stable'
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  color: string
}

export interface AdminUser {
  id: string
  name: string
  role: AdminRole
  region?: string
  permissions: AdminPermission[]
}

class AdminService {
  private static instance: AdminService
  private currentUser: AdminUser | null = null

  private constructor() {
    this.currentUser = {
      id: 'USR-001',
      name: 'National Admin HQ',
      role: 'SUPER_ADMIN',
      permissions: [
        { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
        { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
        { action: 'MANAGE_POLLS', resource: 'POLLS' },
        { action: 'MANAGE_INVENTORY', resource: 'STORE' },
        { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        { action: 'APPOINT_LEAD', resource: 'CHAPTERS' },
        { action: 'MANAGE_BLOGS', resource: 'BLOGS' }
      ]
    }
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  public can(action: AdminPermission['action'], resource: AdminPermission['resource']): boolean {
    if (!authService.isAuthenticated()) return false
    if (!this.currentUser) return false
    if (this.currentUser.role === 'SUPER_ADMIN') return true
    return this.currentUser.permissions.some(p => p.action === action && p.resource === resource)
  }

  public getCurrentUser(): AdminUser | null {
    if (!authService.isAuthenticated()) return null
    return this.currentUser
  }

  // --- Audit Log ---
  async logAction(
    action: string, 
    resource: string, 
    status: 'Success' | 'Failure' | 'Warning' = 'Success',
    details?: Record<string, unknown>
  ): Promise<void> {
    const user = authService.getUser()
    try {
      await supabase.from('audit_logs').insert({
        action,
        resource,
        status,
        metadata: details,
        admin_id: user?.id,
      })
    } catch (error) {
      console.error('[DATABASE] Failed to persist log:', error)
    }
  }

  // --- Member Operations ---
  
  private getFallbackMembers(): Member[] {
    return [
      { id: 'TBM-GH-24001', name: 'Abena Mensah', email: 'a.mensah@example.com', phone: '+233 24 123 4567', region: 'Greater Accra', constituency: 'Madina', status: 'Active', joined: '01/10/2024', type: 'Standard', profession: 'Healthcare', country: 'Ghana' },
      { id: 'TBM-GH-24002', name: 'Kwesi Osei', email: 'k.osei@example.com', phone: '+233 20 987 6543', region: 'Ashanti', constituency: 'Bantama', status: 'Active', joined: '15/10/2024', type: 'Standard', profession: 'Education', country: 'Ghana' },
      { id: 'TBM-DI-24003', name: 'John Smith', email: 'jsmith@example.uk', phone: '+44 7700 900123', region: 'Unknown', constituency: 'Unknown', status: 'Active', joined: '20/10/2024', type: 'Premium', profession: 'Finance', country: 'United Kingdom' },
      { id: 'TBM-GH-24004', name: 'Ama Adow', email: 'ama.adow@example.com', phone: '+233 55 555 5555', region: 'Greater Accra', constituency: 'Adenta', status: 'Active', joined: '05/11/2024', type: 'Standard', profession: 'Law', country: 'Ghana' },
      { id: 'TBM-DI-24005', name: 'Sarah Wilson', email: 'swilson@example.com', phone: '+1 202 555 0123', region: 'Unknown', constituency: 'Unknown', status: 'Active', joined: '12/11/2024', type: 'Premium', profession: 'Technology', country: 'United States' }
    ]
  }

  async getMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('joined_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Falling back to mock members:', error)
      return this.getFallbackMembers()
    }

    return data.map((u) => ({
      id: u.registration_number,
      name: u.full_name,
      email: u.email,
      phone: u.phone_number || 'N/A',
      region: u.region || 'Unknown',
      constituency: u.constituency || 'Unknown',
      status: u.status,
      joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A',
      type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: u.avatar_url || undefined,
      gender: u.gender || 'Unknown',
      chapter: u.chapter || 'Central',
      country: u.country || 'Ghana',
      profession: u.profession || 'Patriot'
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
      name: data.full_name,
      email: data.email,
      phone: data.phone_number || 'N/A',
      region: data.region || 'Unknown',
      constituency: data.constituency || 'Unknown',
      status: data.status,
      joined: data.joined_at ? new Date(data.joined_at).toLocaleDateString() : 'N/A',
      type: data.platform === 'GHANA' ? 'Standard' : 'Premium',
      avatarUrl: data.avatar_url || undefined,
      gender: data.gender || 'Unknown',
      chapter: data.chapter || 'Central',
      country: data.country || 'Ghana',
      profession: data.profession || 'Patriot'
    }
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

  async verifyMember(id: string, approve: boolean, reason?: string, chapterName?: string): Promise<boolean> {
    const status = approve ? 'Approved' : 'Rejected'
    const accountStatus = approve ? 'Active' : 'Suspended'
    
    const { error } = await supabase
      .from('users')
      .update({ 
        verification_status: status,
        status: accountStatus,
        chapter: chapterName || null
      })
      .eq('registration_number', id)

    if (error) {
      console.error('[DATABASE] Member verification failed:', error)
      return false
    }

    await this.logAction(
      approve ? 'VERIFY_MEMBER_APPROVE' : 'VERIFY_MEMBER_REJECT',
      `MEMBERS/${id}`,
      approve ? 'Success' : 'Warning',
      { reason, chapter: chapterName }
    )

    if (approve && chapterName) {
      await this.incrementChapterMemberCount(chapterName)
    }

    return true
  }

  async getCountries(): Promise<{ name: string; dialing_code: string; is_diaspora: boolean }[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name', { ascending: true })

    if (error || !Array.isArray(data)) return []
    return data
  }

  // --- Chapter Operations ---

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

    await this.logAction('CHAPTER_CREATE', `CHAPTERS/${chapter.name}`, 'Success')
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

    await this.logAction('CHAPTER_UPDATE', `CHAPTERS/${id}`, 'Success', chapter)
    return true
  }

  async deleteChapter(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Chapter deletion failed:', error)
      return false
    }

    await this.logAction('CHAPTER_DELETE', `CHAPTERS/${name}`, 'Warning')
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

  // --- Poll Operations ---

  async getPolls(): Promise<Poll[]> {
    const { data, error } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch polls:', error)
      return []
    }

    return (data || []).map((p: { 
      id: string; 
      question: string; 
      status: 'Active' | 'Closed'; 
      total_votes: number | null; 
      region: string | null; 
      category: string | null; 
      end_date: string | null; 
      poll_options: { id: string; label: string; votes: number }[] | null;
    }) => {
      // Ensure we have an array for options
      const rawOptions = p.poll_options || [];
      
      return {
        id: p.id,
        question: p.question,
        status: p.status,
        totalVotes: p.total_votes || 0,
        region: p.region || 'National',
        category: p.category || 'General',
        endDate: p.end_date || 'N/A',
        options: rawOptions.map((o: { id: string, label: string, votes: number }) => ({
          id: o.id,
          label: o.label,
          votes: o.votes || 0
        }))
      };
    })
  }

  async voteInPoll(pollId: string, optionId: string): Promise<boolean> {
    try {
      // 1. Get current counts
      const { data: optionData } = await supabase
        .from('poll_options')
        .select('votes')
        .eq('id', optionId)
        .single();
      
      const { data: pollData } = await supabase
        .from('polls')
        .select('total_votes')
        .eq('id', pollId)
        .single();

      // 2. Perform updates
      const { error: optError } = await supabase
        .from('poll_options')
        .update({ votes: (optionData?.votes || 0) + 1 })
        .eq('id', optionId);

      if (optError) throw optError;

      const { error: pollError } = await supabase
        .from('polls')
        .update({ total_votes: (pollData?.total_votes || 0) + 1 })
        .eq('id', pollId);

      if (pollError) throw pollError;

      return true;
    } catch (err) {
      console.error('[DATABASE] Vote submission failed:', err);
      return false;
    }
  }

  async getPollStats(): Promise<PollStats> {
    const [pollsRes, usersRes] = await Promise.all([
      supabase.from('polls').select('total_votes, status'),
      supabase.from('users').select('id', { count: 'exact', head: true })
    ])

    const pollsData = pollsRes.data || []
    const totalUsers = usersRes.count || 1
    
    const totalVotes = pollsData.reduce((sum, p) => sum + (p.total_votes || 0), 0)
    const activeCount = pollsData.filter(p => p.status === 'Active').length
    const feedbackRate = Math.round((totalVotes / (totalUsers || 1)) * 10) / 10

    return {
      totalEngagements: totalVotes > 1000 ? `${(totalVotes / 1000).toFixed(1)}k` : totalVotes.toString(),
      activePolls: activeCount,
      avgResponseTime: '4.2m',
      feedbackRate: `${Math.min(feedbackRate * 10, 100)}%`
    }
  }

  // --- Store Operations ---

  async getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.warn('[DATABASE] Failed to fetch inventory:', error)
      return []
    }

    return data.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji,
      color: i.brand_color
    }))
  }

  // --- Analytics ---
  async getGlobalStats(): Promise<{ label: string, value: string, change: string }[]> {
    const [usersRes, chaptersRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true })
    ])
    
    const usersCount = usersRes.count || 0
    const chaptersCount = chaptersRes.count || 0

    return [
      { label: 'Total Membership', value: usersCount.toLocaleString(), change: '+12.4%' },
      { label: 'Regional Chapters', value: chaptersCount.toString(), change: '+4.2%' },
      { label: 'Member Engagement', value: '88.4%', change: '+2.1%' },
      { label: 'Merch Orders', value: '1,245', change: '+15.8%' }
    ]
  }


  async getRegions(): Promise<Region[]> {
    const { data, error } = await supabase
      .from('ghana_regions')
      .select(`
        id,
        name,
        ghana_constituencies (
          name
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Regional data fetch failed:', error)
      return this.getRegionsFallback()
    }

    return data.map((r) => ({
      id: r.id,
      name: r.name,
      constituencies: (r.ghana_constituencies || []).map((c: { name: string }) => c.name)
    }))
  }

  async getConstituencies(): Promise<{ data: { name: string, region_id: number }[] }> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('name, region_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Constituencies fetch failed:', error)
      return { data: [] }
    }
    return { data: data || [] }
  }

  private async getRegionsFallback(): Promise<Region[]> {
    const ghanaRegions = [
      'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
      'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
    ]
    return ghanaRegions.map((name, index) => ({
      id: index + 1,
      name,
      constituencies: []
    }))
  }

  async updateRegion(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('ghana_regions')
      .update({ name })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Region update failed:', error)
      return false
    }
    await this.logAction('REGION_UPDATE', `REGIONS/${name}`, 'Success')
    return true
  }

  // --- Storage Operations ---
  async uploadAvatar(fileName: string, blob: Blob): Promise<{ data: { path: string } | null, error: Error | null }> {
    return supabase.storage
      .from('avatars')
      .upload(fileName, blob, { upsert: true })
  }

  getAvatarPublicUrl(fileName: string): string {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    return data.publicUrl
  }

  async deleteConstituency(id: string, regionName: string, conName: string): Promise<boolean> {
    const { error } = await supabase
      .from('ghana_constituencies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Constituency deletion failed:', error)
      return false
    }
    await this.logAction('CONSTITUENCY_DELETE', `REGIONS/${regionName}/CONSTITUENCIES/${conName}`, 'Warning')
    return true
  }

  async getRegionalStats(): Promise<RegionalStat[]> {
    const [regions, chapters] = await Promise.all([
      this.getRegions(),
      this.getChapters()
    ])

    return regions.map(r => {
      const regionalChapters = chapters.filter(c => c.city_or_region === r.name)
      const totalMembers = regionalChapters.reduce((sum, c) => sum + c.member_count, 0)
      
      return {
        region: r.name,
        memberCount: totalMembers,
        chapters: regionalChapters.length,
        activePolls: 0,
        performance: totalMembers > 1000 ? 'High' : totalMembers > 500 ? 'Medium' : 'Low',
        color: totalMembers > 1000 ? 'var(--brand-green)' : totalMembers > 500 ? 'var(--brand-gold)' : 'var(--brand-red)'
      }
    })
  }

  async getGrowthTrends(): Promise<GrowthTrend[]> {
    // Note:membership_growth_view needs to be created in Supabase or handled as a table
    const { data, error } = await supabase
      .from('membership_growth_view')
      .select('*')
      .limit(12)

    if (error) {
      console.warn('[DATABASE] Growth trends fetch failed:', error)
      return []
    }
    return data
  }

  async getSentimentAnalysis(): Promise<SentimentStat[]> {
    const chapters = await this.getChapters()
    return chapters.slice(0, 4).map(c => ({
      topic: `${c.name} Mobilization`,
      score: Math.min(Math.round((c.member_count / 500) * 100), 100),
      trend: c.member_count > 100 ? 'Up' : 'Stable',
      sentiment: c.member_count > 200 ? 'Positive' : 'Neutral',
      color: c.member_count > 200 ? 'var(--brand-green)' : 'var(--brand-gold)'
    }))
  }


  async getSystemAuditLogs(): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error || !Array.isArray(data)) return []
    return data.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || 'SYS',
      adminName: log.admin_id ? 'Regional Admin' : 'National HQ',
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata
    }))
  }

  async getAuditLogsForResource(resourceId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource', resourceId)
      .order('timestamp', { ascending: false })

    if (error || !Array.isArray(data)) return []
    return data.map((log) => ({
      id: log.id,
      timestamp: log.timestamp,
      adminId: log.admin_id || 'SYS',
      adminName: log.admin_id ? 'Regional Admin' : 'National HQ',
      action: log.action,
      resource: log.resource,
      status: log.status,
      details: log.metadata
    }))
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const logs = await this.getSystemAuditLogs()
    return logs.slice(0, 10).map((log, index) => ({
      id: index,
      type: log.resource.toLowerCase().includes('member') ? 'registration' : 'security',
      user: log.adminName,
      time: new Date(log.timestamp).toLocaleTimeString(),
      details: `${log.action} on ${log.resource}`,
      icon: log.status === 'Success' ? '✓' : '!',
      color: log.status === 'Success' ? 'var(--brand-green)' : 'var(--brand-gold)'
    }))
  }

  // --- Blog Operations ---

  async getBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch blog posts:', error)
      return []
    }

    return data.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      authorId: p.author_id,
      authorName: 'Admin',
      category: p.category,
      imageUrl: p.avatar_url || undefined,
      readTime: p.read_time,
      isFeatured: p.is_featured,
      publishedAt: p.published_at,
      tags: p.tags || [],
      seoTitle: p.seo_title || undefined,
      metaDescription: p.meta_description || undefined
    }))
  }

  async createBlogPost(post: Omit<BlogPost, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        author_id: post.authorId,
        category: post.category,
        avatar_url: post.imageUrl || null,
        read_time: post.readTime,
        is_featured: post.isFeatured,
        published_at: post.publishedAt,
        tags: post.tags,
        seo_title: post.seoTitle || null,
        meta_description: post.metaDescription || null
      })

    if (error) {
      console.error('[DATABASE] Blog post creation failed:', error)
      return false
    }
    await this.logAction('BLOG_CREATE', `BLOGS/${post.slug}`, 'Success')
    return true
  }

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
    const updateData: Record<string, string | number | boolean | string[] | null | undefined> = {}
    if (post.title) updateData.title = post.title
    if (post.slug) updateData.slug = post.slug
    if (post.excerpt) updateData.excerpt = post.excerpt
    if (post.content) updateData.content = post.content
    if (post.category) updateData.category = post.category
    if (post.imageUrl !== undefined) updateData.avatar_url = post.imageUrl
    if (post.readTime) updateData.read_time = post.readTime
    if (post.isFeatured !== undefined) updateData.is_featured = post.isFeatured
    if (post.publishedAt) updateData.published_at = post.publishedAt
    if (post.tags) updateData.tags = post.tags
    if (post.seoTitle !== undefined) updateData.seo_title = post.seoTitle
    if (post.metaDescription !== undefined) updateData.meta_description = post.metaDescription

    const { error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post update failed:', error)
      return false
    }
    await this.logAction('BLOG_UPDATE', `BLOGS/${id}`, 'Success', post)
    return true
  }

  async deleteBlogPost(id: string, slug: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Blog post deletion failed:', error)
      return false
    }
    await this.logAction('BLOG_DELETE', `BLOGS/${slug}`, 'Warning')
    return true
  }
}

export const adminService = AdminService.getInstance()
