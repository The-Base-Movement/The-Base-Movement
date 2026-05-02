/**
 * Admin Service
 * Core architectural service for handling Back-Office CRUD operations.
 * Transitioning from mock data to real-time persistence patterns.
 */

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
}

export interface Chapter {
  id: string
  name: string
  region: string
  lead: string
  members: number
  impact: 'Low' | 'Medium' | 'High' | 'Very High'
  status: 'Active' | 'Pending' | 'Closed'
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

export interface AuditLogEntry {
  id: string
  timestamp: string
  adminId: string
  adminName: string
  action: string
  resource: string
  status: 'Success' | 'Failure' | 'Warning'
  ipAddress: string
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

class AdminService {
  private static instance: AdminService
  private currentUser: AdminUser | null = null

  private constructor() {
    // Initial high-fidelity mock session for Phase 2
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

  public can(action: AdminPermission['action'], resource: AdminPermission['resource']): boolean {
    if (!this.currentUser) return false
    if (this.currentUser.role === 'SUPER_ADMIN') return true
    
    return this.currentUser.permissions.some(
      p => p.action === action && p.resource === resource
    )
  }

  public getCurrentUser(): AdminUser | null {
    return this.currentUser
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  // --- Member Operations ---
  async getMembers(): Promise<Member[]> {
    // Logic for API fetching will go here
    return [] 
  }

  async verifyMember(id: string, approve: boolean): Promise<boolean> {
    console.log(`Verifying member ${id}: ${approve ? 'Approved' : 'Rejected'}`)
    return true
  }

  // --- Chapter Operations ---
  async getChapters(): Promise<Chapter[]> {
    return []
  }

  // --- Poll Operations ---
  async getPolls(): Promise<Poll[]> {
    return []
  }

  // --- Store Operations ---
  async getInventory(): Promise<InventoryItem[]> {
    return []
  }

  // --- Analytics & Geospatial Intelligence ---
  async getRegionalStats(): Promise<RegionalStat[]> {
    return [
      { region: 'Greater Accra', memberCount: 12500, chapters: 45, activePolls: 3, performance: 'High', color: 'var(--brand-green)' },
      { region: 'Ashanti', memberCount: 18200, chapters: 62, activePolls: 5, performance: 'High', color: 'var(--brand-green)' },
      { region: 'Western', memberCount: 8400, chapters: 28, activePolls: 2, performance: 'Medium', color: 'var(--brand-gold)' },
      { region: 'Central', memberCount: 6100, chapters: 22, activePolls: 1, performance: 'Medium', color: 'var(--brand-gold)' },
      { region: 'Northern', memberCount: 4200, chapters: 15, activePolls: 2, performance: 'Low', color: 'var(--brand-red)' },
    ]
  }

  async getGrowthTrends(): Promise<GrowthTrend[]> {
    return [
      { date: '2024-01', count: 1200 },
      { date: '2024-02', count: 2100 },
      { date: '2024-03', count: 3800 },
      { date: '2024-04', count: 5600 },
      { date: '2024-05', count: 8200 },
    ]
  }

  // --- Sentiment Analysis ---
  async getSentimentAnalysis(): Promise<SentimentStat[]> {
    return [
      { topic: 'Leadership Trust', score: 88, trend: 'Up', sentiment: 'Positive', color: 'var(--brand-green)' },
      { topic: 'Economic Policy', score: 65, trend: 'Stable', sentiment: 'Neutral', color: 'var(--brand-gold)' },
      { topic: 'Youth Mobilization', score: 92, trend: 'Up', sentiment: 'Positive', color: 'var(--brand-green)' },
      { topic: 'Infrastructure Focus', score: 45, trend: 'Down', sentiment: 'Negative', color: 'var(--brand-red)' },
    ]
  }

  // --- System Audit ---
  async getSystemAuditLogs(): Promise<AuditLogEntry[]> {
    return [
      { id: 'AUD-001', timestamp: '2026-05-02T08:30:00Z', adminId: 'USR-001', adminName: 'National Admin HQ', action: 'APPOINT_LEAD', resource: 'CHAPTERS/ASH-01', status: 'Success', ipAddress: '192.168.1.105' },
      { id: 'AUD-002', timestamp: '2026-05-02T09:15:00Z', adminId: 'USR-002', adminName: 'Regional Lead Accra', action: 'VERIFY_MEMBER', resource: 'MEMBERS/ACC-450', status: 'Success', ipAddress: '192.168.1.110' },
      { id: 'AUD-003', timestamp: '2026-05-02T10:45:00Z', adminId: 'USR-001', adminName: 'National Admin HQ', action: 'SECURITY_KEY_ROTATION', resource: 'SYSTEM/AUTH', status: 'Warning', ipAddress: '192.168.1.105' },
    ]
  }

  // --- Activity Logs ---
  async getActivityLogs(): Promise<ActivityLog[]> {
    return []
  }
}

export const adminService = AdminService.getInstance()
