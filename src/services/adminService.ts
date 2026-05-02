import { authService } from './authService'

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
  status: 'Active' | 'Pending' | 'Closed' | 'Member' | 'Join Chapter'
  image_url?: string
}

export interface Poll {
  id: string
  title: string
  status: 'Active' | 'Draft' | 'Closed'
  votes: number
  region: string
  endDate: string
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

// ── Database Schema Interfaces ──────────────────────────────────────────────
interface DBUser {
  registration_number: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  region: string | null;
  constituency: string | null;
  status: Member['status'];
  joined_at: string;
  platform: string;
  passport_photo_url: string | null;
  gender: string | null;
  chapter: string | null;
  country: string | null;
}

interface DBChapter {
  id: string;
  name: string;
  city_or_region: string;
  country: string;
  leader_name: string | null;
  member_count: number;
  status: Chapter['status'];
}

interface DBPoll {
  id: string;
  title: string;
  status: Poll['status'];
  votes: number;
  region: string;
  end_date: string;
}

interface DBInventory {
  id: string;
  name: string;
  category: string;
  price_ghs: number;
  stock_quantity: number;
  status: InventoryItem['status'];
  image_emoji: string;
  brand_color: string;
}

interface DBRegion {
  id: number;
  name: string;
  ghana_constituencies: { name: string }[];
}

interface DBLog {
  id: string;
  timestamp: string;
  admin_id: string | null;
  action: string;
  resource: string;
  status: AuditLogEntry['status'];
  metadata: Record<string, unknown>;
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
  action: 'VERIFY_MEMBER' | 'MANAGE_CHAPTER' | 'MANAGE_POLLS' | 'MANAGE_INVENTORY' | 'VIEW_AUDIT_LOGS' | 'APPOINT_LEAD'
  resource: 'MEMBERS' | 'CHAPTERS' | 'POLLS' | 'STORE' | 'SYSTEM'
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

// ── Data API Configuration ─────────────────────────────────────────────────
const DATA_API_URL = 'https://ep-ancient-tooth-amjyc3yp.apirest.c-5.us-east-1.aws.neon.tech/neondb/rest/v1'
const DATA_API_MANAGEMENT_TOKEN = import.meta.env.VITE_NEON_DATA_API_TOKEN

// ── State Store ─────────────────────────────────────────────────────────────
const sessionAuditLogs: AuditLogEntry[] = []

class AdminService {
  private static instance: AdminService
  private currentUser: AdminUser | null = null

  private getAuthHeader(): Record<string, string> {
    const token = authService.getToken()
    const activeToken = token || DATA_API_MANAGEMENT_TOKEN
    if (!activeToken) return {}
    return { 'Authorization': `Bearer ${activeToken}` }
  }

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
        { action: 'APPOINT_LEAD', resource: 'CHAPTERS' }
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
    if (!this.currentUser) return false
    if (this.currentUser.role === 'SUPER_ADMIN') return true
    return this.currentUser.permissions.some(p => p.action === action && p.resource === resource)
  }

  public getCurrentUser(): AdminUser | null {
    return this.currentUser
  }

  // --- Audit Log ---
  async logAction(
    action: string, 
    resource: string, 
    status: 'Success' | 'Failure' | 'Warning' = 'Success',
    details?: Record<string, unknown>
  ): Promise<void> {
    const logEntry = {
      action,
      resource,
      status,
      metadata: details,
      admin_id: this.currentUser?.id === 'USR-001' ? null : this.currentUser?.id,
      ip_address: '127.0.0.1'
    }

    try {
      await fetch(`${DATA_API_URL}/audit_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(logEntry)
      })
    } catch (error) {
      console.error('[AUDIT VAULT] Failed to persist log:', error)
      sessionAuditLogs.unshift({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        adminId: this.currentUser?.id || 'SYS',
        adminName: this.currentUser?.name || 'System',
        action,
        resource,
        status,
        details
      })
    }
  }


  // --- Member Operations ---
  async getMembers(): Promise<Member[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/users?select=*&order=joined_at.desc`, {
        headers: this.getAuthHeader()
      })
      const data = (await response.json()) as DBUser[]
      if (!Array.isArray(data)) throw new Error('Invalid data format')

      return data.map((u) => ({
        id: u.registration_number,
        name: u.full_name,
        email: u.email || 'N/A',
        phone: u.phone_number || 'N/A',
        region: u.region || 'Unknown',
        constituency: u.constituency || 'Unknown',
        status: u.status,
        joined: new Date(u.joined_at).toLocaleDateString(),
        type: u.platform === 'GHANA' ? 'Standard' : 'Premium',
        avatarUrl: u.passport_photo_url || undefined,
        gender: u.gender || 'Unknown',
        chapter: u.chapter || 'Central',
        country: u.country || 'Ghana'
      }))
    } catch (error) {
      console.warn('[SYSTEM] Failed to fetch members from API:', error)
      return []
    }
  }

  async verifyMember(id: string, approve: boolean, reason?: string, chapterName?: string): Promise<boolean> {
    const status = approve ? 'Approved' : 'Rejected'
    const accountStatus = approve ? 'Active' : 'Suspended'
    
    try {
      await fetch(`${DATA_API_URL}/users?registration_number=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ 
          verification_status: status,
          status: accountStatus,
          chapter: chapterName || null
        })
      })

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
    } catch (error) {
      console.error('[SYSTEM] Member verification failed:', error)
      return false
    }
  }

  // --- Chapter Operations ---

  async getChapters(): Promise<Chapter[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/chapters?select=*&order=name.asc`, {
        headers: this.getAuthHeader()
      })
      if (!response.ok) {
        const err = await response.json()
        console.error('[SYSTEM] Chapters API Error:', response.status, err)
        throw new Error(`API Error: ${response.status}`)
      }
      const data = (await response.json()) as DBChapter[]
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        city_or_region: c.city_or_region,
        country: c.country || 'Ghana',
        leader_name: c.leader_name || 'Unassigned',
        member_count: c.member_count || 0,
        status: c.status
      }))
    } catch (error) {
      console.warn('[SYSTEM] Failed to fetch chapters from API:', error)
      return []
    }
  }

  async createChapter(chapter: Omit<Chapter, 'id'>): Promise<boolean> {
    try {
      await fetch(`${DATA_API_URL}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({
          name: chapter.name,
          city_or_region: chapter.city_or_region,
          country: chapter.country,
          leader_name: chapter.leader_name,
          member_count: chapter.member_count,
          status: chapter.status
        })
      })
      await this.logAction('CHAPTER_CREATE', `CHAPTERS/${chapter.name}`, 'Success')
      return true
    } catch (error) {
      console.error('[SYSTEM] Chapter creation failed:', error)
      return false
    }
  }

  async updateChapter(id: string, chapter: Partial<Chapter>): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {}
      if (chapter.name) updateData.name = chapter.name
      if (chapter.city_or_region) updateData.city_or_region = chapter.city_or_region
      if (chapter.country) updateData.country = chapter.country
      if (chapter.leader_name) updateData.leader_name = chapter.leader_name
      if (chapter.status) updateData.status = chapter.status
      if (chapter.member_count !== undefined) updateData.member_count = chapter.member_count

      await fetch(`${DATA_API_URL}/chapters?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify(updateData)
      })
      await this.logAction('CHAPTER_UPDATE', `CHAPTERS/${id}`, 'Success', chapter)
      return true
    } catch (error) {
      console.error('[SYSTEM] Chapter update failed:', error)
      return false
    }
  }

  async deleteChapter(id: string, name: string): Promise<boolean> {
    try {
      await fetch(`${DATA_API_URL}/chapters?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeader()
      })
      await this.logAction('CHAPTER_DELETE', `CHAPTERS/${name}`, 'Warning')
      return true
    } catch (error) {
      console.error('[SYSTEM] Chapter deletion failed:', error)
      return false
    }
  }

  async incrementChapterMemberCount(chapterName: string): Promise<void> {
    try {
      const getResponse = await fetch(`${DATA_API_URL}/chapters?name=eq.${chapterName}&select=id,member_count`, {
        headers: this.getAuthHeader()
      })
      const chapters = await getResponse.json()
      if (chapters.length > 0) {
        const { id, member_count } = chapters[0]
        await fetch(`${DATA_API_URL}/chapters?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeader()
          },
          body: JSON.stringify({ member_count: (member_count || 0) + 1 })
        })
      }
    } catch (error) {
      console.error('[SYSTEM] Failed to increment chapter count:', error)
    }
  }

  // --- Poll Operations ---

  async getPolls(): Promise<Poll[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/polls?select=*&order=created_at.desc`, {
        headers: this.getAuthHeader()
      })
      const data = (await response.json()) as DBPoll[]
      return data.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        votes: p.votes || 0,
        region: p.region || 'National',
        endDate: p.end_date ? new Date(p.end_date).toLocaleDateString() : 'N/A'
      }))
    } catch (error) {
      console.warn('[SYSTEM] Failed to fetch polls from API:', error)
      return []
    }
  }

  async getPollStats(): Promise<PollStats> {
    try {
      const [pollsRes, usersRes] = await Promise.all([
        fetch(`${DATA_API_URL}/polls?select=votes,status`, {
          headers: this.getAuthHeader()
        }),
        fetch(`${DATA_API_URL}/users?select=id`, {
          method: 'HEAD',
          headers: this.getAuthHeader()
        })
      ])

      const pollsData = (await pollsRes.json()) as { votes: number, status: string }[]
      const totalUsers = parseInt(usersRes.headers.get('content-range')?.split('/')?.[1] || '1')
      
      const totalVotes = pollsData.reduce((sum, p) => sum + (p.votes || 0), 0)
      const activeCount = pollsData.filter(p => p.status === 'Active').length
      const feedbackRate = Math.round((totalVotes / (totalUsers || 1)) * 10) / 10

      return {
        totalEngagements: totalVotes > 1000 ? `${(totalVotes / 1000).toFixed(1)}k` : totalVotes.toString(),
        activePolls: activeCount,
        avgResponseTime: '4.2m', // Placeholder until we have session data
        feedbackRate: `${Math.min(feedbackRate * 10, 100)}%`
      }
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch poll stats:', error)
      return {
        totalEngagements: '0',
        activePolls: 0,
        avgResponseTime: '0m',
        feedbackRate: '0%'
      }
    }
  }

  // --- Store Operations ---

  async getInventory(): Promise<InventoryItem[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/store_inventory?select=*&order=name.asc`, {
        headers: this.getAuthHeader()
      })
      const data = (await response.json()) as DBInventory[]
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
    } catch (error) {
      console.warn('[SYSTEM] Failed to fetch inventory from API:', error)
      return []
    }
  }

  // --- Analytics & Geospatial Intelligence ---
  async getGlobalStats(): Promise<{ label: string, value: string, change: string }[]> {
    try {
      const [usersRes, chaptersRes] = await Promise.all([
        fetch(`${DATA_API_URL}/users?select=id&limit=1`, { 
          headers: { ...this.getAuthHeader(), 'Prefer': 'count=exact' }, 
          method: 'HEAD' 
        }),
        fetch(`${DATA_API_URL}/chapters?select=id&limit=1`, { 
          headers: { ...this.getAuthHeader(), 'Prefer': 'count=exact' }, 
          method: 'HEAD' 
        })
      ])
      
      const parseCount = (res: Response) => {
        const range = res.headers.get('Content-Range')
        if (range) {
          const match = range.match(/\/(\d+)$/)
          if (match) return parseInt(match[1], 10)
        }
        return 0
      }

      const usersCount = parseCount(usersRes)
      const chaptersCount = parseCount(chaptersRes)

      return [
        { label: 'Total Membership', value: usersCount.toLocaleString(), change: '+12.4%' },
        { label: 'Regional Chapters', value: chaptersCount.toString(), change: '+4.2%' },
        { label: 'Member Engagement', value: '88.4%', change: '+2.1%' },
        { label: 'Merch Orders', value: '1,245', change: '+15.8%' }
      ]
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch global stats:', error)
      return []
    }
  }


  async getRegions(): Promise<Region[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/ghana_regions?select=id,name,ghana_constituencies(name)`, {
        headers: this.getAuthHeader()
      })
      console.log('[SYSTEM] Fetch Regions Status:', response.status)
      const data = (await response.json()) as DBRegion[]
      console.log('[SYSTEM] Fetch Regions Data:', data)
      if (!Array.isArray(data)) throw new Error('Invalid data format')
      return data.map((r) => ({
        id: r.id,
        name: r.name,
        constituencies: (r.ghana_constituencies || [])
          .map((c: { name: string }) => c?.name)
          .filter((name: string | null | undefined): name is string => typeof name === 'string' && name.length > 0)
      }))
    } catch (error) {
      console.error('[SYSTEM] Failed to fetch geographical data:', error)
      return []
    }
  }

  async updateRegion(id: string, name: string): Promise<boolean> {
    try {
      await fetch(`${DATA_API_URL}/ghana_regions?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ name })
      })
      await this.logAction('REGION_UPDATE', `REGIONS/${name}`, 'Success')
      return true
    } catch (error) {
      console.error('[SYSTEM] Region update failed:', error)
      return false
    }
  }

  async deleteConstituency(id: string, regionName: string, conName: string): Promise<boolean> {
    try {
      await fetch(`${DATA_API_URL}/ghana_constituencies?id=eq.${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeader()
      })
      await this.logAction('CONSTITUENCY_DELETE', `REGIONS/${regionName}/CONSTITUENCIES/${conName}`, 'Warning')
      return true
    } catch (error) {
      console.error('[SYSTEM] Constituency deletion failed:', error)
      return false
    }
  }

  async getRegionalStats(): Promise<RegionalStat[]> {
    try {
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
          activePolls: 0, // Will be integrated with polls service later
          performance: totalMembers > 1000 ? 'High' : totalMembers > 500 ? 'Medium' : 'Low',
          color: totalMembers > 1000 ? 'var(--brand-green)' : totalMembers > 500 ? 'var(--brand-gold)' : 'var(--brand-red)'
        }
      })
    } catch (error) {
      console.error('[SYSTEM] Failed to aggregate regional stats:', error)
      return []
    }
  }

  async getGrowthTrends(): Promise<GrowthTrend[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/membership_growth_view?select=*&limit=12`, {
        headers: this.getAuthHeader()
      })
      const data = await response.json()
      if (!Array.isArray(data)) throw new Error('Invalid data')
      return data
    } catch (error) {
      console.warn('[SYSTEM] Growth trends fetch failed:', error)
      return []
    }
  }

  async getSentimentAnalysis(): Promise<SentimentStat[]> {
    try {
      const chapters = await this.getChapters()
      return chapters.slice(0, 4).map(c => ({
        topic: `${c.name} Mobilization`,
        score: Math.min(Math.round((c.member_count / 500) * 100), 100),
        trend: c.member_count > 100 ? 'Up' : 'Stable',
        sentiment: c.member_count > 200 ? 'Positive' : 'Neutral',
        color: c.member_count > 200 ? 'var(--brand-green)' : 'var(--brand-gold)'
      }))
    } catch {
      return []
    }
  }


  async getSystemAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/audit_logs?limit=50&order=timestamp.desc`, {
        headers: this.getAuthHeader()
      })
      const data = await response.json()
      if (!Array.isArray(data)) return sessionAuditLogs
      return (data as DBLog[]).map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        adminId: log.admin_id || 'SYS',
        adminName: log.admin_id ? 'Regional Admin' : 'National HQ',
        action: log.action,
        resource: log.resource,
        status: log.status,
        details: log.metadata
      }))
    } catch {
      return [...sessionAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
  }

  async getAuditLogsForResource(resourceId: string): Promise<AuditLogEntry[]> {
    try {
      const response = await fetch(`${DATA_API_URL}/audit_logs?resource=eq.${resourceId}&order=timestamp.desc`, {
        headers: this.getAuthHeader()
      })
      const data = await response.json()
      return (data as DBLog[]).map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        adminId: log.admin_id || 'SYS',
        adminName: log.admin_id ? 'Regional Admin' : 'National HQ',
        action: log.action,
        resource: log.resource,
        status: log.status,
        details: log.metadata
      }))
    } catch {
      return sessionAuditLogs.filter(log => log.resource === resourceId)
    }
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    try {
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
    } catch {
      return []
    }
  }
}

export const adminService = AdminService.getInstance()

