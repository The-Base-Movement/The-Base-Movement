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

export type AdminRole = 'SUPER_ADMIN' | 'REGIONAL_DIRECTOR' | 'CONSTITUENCY_LEAD' | 'VERIFIER'

export interface AdminPermission {
  action: 'VERIFY_MEMBER' | 'MANAGE_CHAPTER' | 'MANAGE_POLLS' | 'MANAGE_INVENTORY' | 'VIEW_AUDIT_LOGS' | 'APPOINT_LEAD'
  resource: 'MEMBERS' | 'CHAPTERS' | 'POLLS' | 'STORE' | 'SYSTEM'
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
  async getInventory(): Promise<any[]> {
    return []
  }

  // --- Activity Logs ---
  async getActivityLogs(): Promise<any[]> {
    return []
  }
}

export const adminService = AdminService.getInstance()
