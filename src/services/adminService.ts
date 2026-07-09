import { supabase } from '@/lib/supabase'
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js'
import { compressForUpload } from '@/lib/imageUtils'
import { ROLE_CATALOG, resolveRoleAlias } from '@/lib/roleCatalog'
import { resolveStoredAdminPermissions } from '@/lib/adminPermissionHydration'
import { isUuid } from '@/lib/supabaseFilters'
import { authService } from './authService'
import { memberService } from './memberService'
import { logisticsService } from './logisticsService'
import { tacticalService } from './tacticalService'
import { chapterService } from './chapterService'
import { donationService } from './donationService'
import { contentService } from './contentService'
import { discordService } from './discordService'
import { gamificationService } from './gamificationService'
import { intelligenceService } from './intelligenceService'
import { pollService } from './pollService'
import { auditService } from './auditService'
import type { Product } from '@/types/product'
import type {
  Member,
  Region,
  Chapter,
  Country,
  Poll,
  InventoryItem,
  DonationCampaign,
  DonationDetail,
  FieldEvent,
  MobilizationLedger,
  RegionalStat,
  Milestone,
  FieldDirective,
  FieldReport,
  ChapterApplication,
  Achievement,
  LogisticsVelocity,
  InventoryAlert,
  MemberFeedback,
  SentimentIntelligence,
  ImpactProjection,
  RapidResponseDirective,
  CrisisIncident,
  MediaCounterNarrative,
  VoterRegistration,
  CanvassingCampaign,
  CanvasserLog,
  GOTVTransportRequest,
  FieldAction,
  RallyAttendance,
  ChapterLeaderboard,
  LeaderboardEntry,
  MovementPulse,
  GrowthTrend,
  PendingVerification,
  ActivityLog,
  PollStats,
  Order,
  OrderStats,
  BlogPost,
  Author,
  ResourceRequest,
  LogisticsAuditEntry,
  AuditLogEntry,
  AdminRole,
  AdminPermission,
  SentimentStat,
  Broadcast,
  Notification,
  AdminUser,
  PressRelease,
  MediaKitAsset,
  GlobalSearchResult,
  User,
  MemberDonation,
  MemberPollVote,
  MemberSession,
  MemberNote,
} from '@/types/admin'

const approvedAdminRoles = new Set<string>(ROLE_CATALOG.map((entry) => entry.role))

function normalizeAdminRole(role: string | null | undefined): AdminRole {
  const dbRole = resolveRoleAlias(role?.toUpperCase() || '')
  if (approvedAdminRoles.has(dbRole)) return dbRole as AdminRole

  if (dbRole.includes('FOUNDER')) return 'FOUNDER'
  if (dbRole.includes('SUPER')) return 'SUPER_ADMIN'
  if (dbRole === 'FINANCEOFFICER') return 'FINANCE_OFFICER'
  if (dbRole.includes('ORGANIZER')) return 'ORGANIZER'
  if (dbRole.includes('LEADER')) return 'MOVEMENT_LEADER'

  return 'ADMIN'
}

// ── Inline types not in admin.ts ─────────────────────────────────────────────
export interface PasswordResetRecord {
  id: string
  phone: string
  expires_at: string
  used: boolean
  created_at: string
}

// Re-export all types so consumers can import from either location
export type {
  Member,
  Region,
  Chapter,
  Country,
  Poll,
  PollOption,
  InventoryItem,
  DonationCampaign,
  DonationDetail,
  FieldEvent,
  MobilizationLedger,
  RegionalStat,
  Milestone,
  FieldDirective,
  FieldReport,
  ChapterApplication,
  Achievement,
  LogisticsVelocity,
  InventoryAlert,
  MemberFeedback,
  SentimentIntelligence,
  ImpactProjection,
  RapidResponseDirective,
  CrisisIncident,
  MediaCounterNarrative,
  VoterRegistration,
  CanvassingCampaign,
  CanvasserLog,
  GOTVTransportRequest,
  FieldAction,
  RallyAttendance,
  ChapterLeaderboard,
  LeaderboardEntry,
  MovementPulse,
  GrowthTrend,
  PendingVerification,
  ActivityLog,
  PollStats,
  Order,
  OrderStats,
  OrderItem,
  Author,
  BlogPost,
  ResourceRequest,
  LogisticsAuditEntry,
  AuditLogEntry,
  AdminRole,
  AdminPermission,
  SentimentStat,
  Broadcast,
  Notification,
  AdminUser,
  PressRelease,
  MediaKitAsset,
  GlobalSearchResult,
  User,
  MemberDonation,
  MemberPollVote,
  MemberSession,
  MemberNote,
} from '@/types/admin'

class AdminService {
  private static instance: AdminService
  private currentUser: AdminUser | null = null

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  async initialize(): Promise<AdminUser | null> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        this.currentUser = null
        return null
      }

      const adminData = await this.getAdminData(user.id)
      this.currentUser = adminData
      return adminData
    } catch (error) {
      console.error('[ADMIN SERVICE] Initialization failed:', error)
      this.currentUser = null
      return null
    }
  }

  public can(action: AdminPermission['action'], resource: AdminPermission['resource']): boolean {
    if (!authService.isAuthenticated()) return false
    if (!this.currentUser) return false
    if (
      this.currentUser.role === 'SUPER_ADMIN' ||
      this.currentUser.role === 'FOUNDER' ||
      this.currentUser.role === 'EXECUTIVE'
    )
      return true
    return this.currentUser.permissions.some((p) => p.action === action && p.resource === resource)
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
    return auditService.logAction(action, resource, status, details)
  }

  // --- Member Operations ---

  async getMembers(): Promise<Member[]> {
    return memberService.getMembers()
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
    return memberService.getMembersPaginated(
      page,
      pageSize,
      searchTerm,
      registrationSource,
      searchType,
      sortOrder,
      gender,
      ageRange
    )
  }

  async searchMembers(
    query: string,
    searchType: 'name' | 'id' | 'phone' = 'name'
  ): Promise<Member[]> {
    return memberService.searchMembers(query, searchType)
  }

  async getAdministrators(): Promise<AdminUser[]> {
    const admins = await memberService.getAdministrators()
    // Privileged accounts (SUPER_ADMIN / FOUNDER / EXECUTIVE) are only visible
    // to other privileged viewers — regular appointed admins cannot see them.
    const viewerIsPrivileged =
      this.currentUser?.role === 'SUPER_ADMIN' ||
      this.currentUser?.role === 'FOUNDER' ||
      this.currentUser?.role === 'EXECUTIVE'
    if (viewerIsPrivileged) return admins
    const HIDDEN: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE']
    return admins.filter((a) => !HIDDEN.includes(a.role as AdminRole))
  }

  async provisionAdministrator(
    id: string,
    role: AdminRole,
    permissions: AdminPermission[]
  ): Promise<boolean> {
    const dbPermissions: Record<string, boolean> = {}
    permissions.forEach((p) => {
      if (p.action === 'VERIFY_MEMBER') dbPermissions.can_manage_members = true
      if (p.action === 'DELETE_MEMBER') dbPermissions.can_delete_members = true
      if (p.action === 'MANAGE_CHAPTER') dbPermissions.can_manage_chapters = true
      if (p.action === 'APPOINT_LEAD') dbPermissions.can_appoint_lead = true
      if (p.action === 'MANAGE_POLLS') dbPermissions.can_manage_polls = true
      if (p.action === 'MANAGE_INVENTORY') dbPermissions.can_manage_store = true
      if (p.action === 'VIEW_AUDIT_LOGS') dbPermissions.can_view_audit_logs = true
      if (p.action === 'MANAGE_BLOGS') dbPermissions.can_post_blog = true
      if (p.action === 'MANAGE_NEWSLETTERS') dbPermissions.can_manage_newsletters = true
      if (p.action === 'MANAGE_DONATIONS') dbPermissions.can_manage_donations = true
    })
    const { error } = await supabase.rpc('provision_administrator', {
      target_id: id,
      admin_role: role,
      permissions: dbPermissions,
    })

    if (error) {
      console.error(
        '[ADMIN SERVICE] Provisioning failed:',
        error.message,
        '|',
        error.code,
        '|',
        error.details
      )
      return false
    }

    await this.logAction('ADMIN_PROVISION', `ADMINS/${id}`, 'Success', { role })
    return true
  }

  /**
   * Phone-registered members have a placeholder auth email and cannot sign in
   * to the admin panel. Returns whether the target needs a real login email
   * assigned before an admin role is granted (plus any email on their profile).
   */
  async checkAdminLoginEmail(
    userId: string
  ): Promise<{ needsEmail: boolean; currentEmail: string | null }> {
    const { data, error } = await supabase.functions.invoke('assign-admin-email', {
      body: { user_id: userId, check_only: true },
    })
    if (error) throw new Error('Could not check the member’s login email.')
    return { needsEmail: !!data?.needsEmail, currentEmail: data?.currentEmail ?? null }
  }

  /** Switches the target's auth login email to a real address (admin appointees). */
  async assignAdminLoginEmail(userId: string, email: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('assign-admin-email', {
      body: { user_id: userId, email },
    })
    if (error || data?.error) {
      throw new Error(data?.error || 'Failed to assign the admin login email.')
    }
    await this.logAction('ADMIN_EMAIL_ASSIGN', `ADMINS/${userId}`, 'Success', { email })
  }

  async revokeAdministrator(id: string): Promise<boolean> {
    const { data, error } = await supabase.from('admins').delete().eq('id', id).select('id')

    if (error) {
      console.error('[ADMIN SERVICE] Revocation failed:', error)
      return false
    }

    if (!data?.length) {
      console.error('[ADMIN SERVICE] Revocation failed: administrator record not found')
      return false
    }

    await this.logAction('ADMIN_REVOKE', `ADMINS/${id}`, 'Warning')
    return true
  }

  async getMemberProfile(regNo: string): Promise<Member | null> {
    return memberService.getMemberProfile(regNo)
  }

  async getMemberProfileByAuthId(authId: string): Promise<Member | null> {
    return memberService.getMemberProfileByAuthId(authId)
  }

  async getGrowthStats(): Promise<{
    joined_last_hour: number
    joined_last_24h: number
    joined_last_7d: number
  }> {
    return memberService.getGrowthStats()
  }

  async getTotalMemberCount(): Promise<number> {
    return memberService.getTotalMemberCount()
  }

  async updateMemberProfile(
    regNo: string,
    profile: Partial<Member> & { job?: import('@/services/jobTaxonomyService').JobSelection }
  ): Promise<boolean> {
    return memberService.updateMemberProfile(regNo, profile)
  }

  async ensureRegistrationNumber(authId: string): Promise<string | null> {
    return memberService.ensureRegistrationNumber(authId)
  }

  async registerMember(data: User): Promise<{ data: boolean; error: PostgrestError | null }> {
    const result = await memberService.registerMember(data)
    if (!result.error) {
      await this.logAction('MEMBER_REGISTER', `MEMBERS/${data.registration_number}`, 'Success', {
        name: data.full_name,
        regNo: data.registration_number,
      })
    }
    return result
  }

  /**
   * Provision an auth login for an already-inserted member so they can sign in.
   * Routes through the create-csv-member-accounts edge function (service role:
   * creates the auth user with a temp password, relinks users.id to the auth id,
   * and delivers credentials by email if present, else SMS). Matches the member
   * by registration_number.
   */
  async createMemberLogin(member: {
    reg_no: string
    name: string
    email?: string | null
    phone?: string | null
  }): Promise<{ created: number; skipped: number; failed: number; error?: string }> {
    const { data, error } = await supabase.functions.invoke('create-csv-member-accounts', {
      body: {
        members: [
          {
            reg_no: member.reg_no,
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
          },
        ],
      },
    })
    if (error) return { created: 0, skipped: 0, failed: 1, error: error.message }
    return data as { created: number; skipped: number; failed: number }
  }

  async createMemberLoginsBulk(
    members: { reg_no: string; phone: string; name: string; email?: string }[]
  ) {
    const { data, error } = await supabase.functions.invoke('create-csv-member-accounts', {
      body: { members },
    })
    if (error) throw error
    return data as {
      created: number
      skipped: number
      failed: number
      failedUsers?: { reg_no: string; error: string }[]
    }
  }

  /**
   * Admin-initiated password reset for a member. Generates a Supabase recovery
   * link via the admin-reset-password edge function (service role) and emails it
   * to the member via SendGrid; the member clicks it and lands on
   * /reset-password to choose a new password. The action link is also returned
   * so the admin can copy/share it if email delivery fails.
   */
  async resetMemberPassword(userId: string): Promise<{
    success: boolean
    emailed?: boolean
    email?: string | null
    actionLink?: string
    error?: string
  }> {
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { user_id: userId },
    })
    if (error) {
      // functions.invoke surfaces only a generic "non-2xx" message; the real
      // reason is in the JSON body on error.context (a Response). Read it.
      let detail = error.message
      try {
        const ctx = (error as { context?: Response }).context
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json()
          if (body?.error) detail = body.error
        }
      } catch {
        // body wasn't JSON — keep the generic message
      }
      return { success: false, error: detail }
    }
    return data as {
      success: boolean
      emailed?: boolean
      email?: string | null
      actionLink?: string
    }
  }

  async bulkRegisterMembers(
    users: User[]
  ): Promise<{ inserted: number; skipped: number; error: PostgrestError | null }> {
    const result = await memberService.bulkRegisterMembers(users)
    if (!result.error) {
      await this.logAction('MEMBER_BULK_REGISTER', 'SYSTEM/MEMBERS', 'Success', {
        inserted: result.inserted,
        skipped: result.skipped,
      })
    }
    return result
  }

  async getMemberDonations(authId: string): Promise<MemberDonation[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('id, amount, payment_method, reference, created_at, cleared, description')
      .eq('member_id', authId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN] Error fetching member donations:', error)
      return []
    }

    return (data || []).map((d) => ({
      id: d.id,
      amount: d.amount,
      method: d.payment_method || 'N/A',
      ref: d.reference || 'N/A',
      date: d.created_at,
      cleared: d.cleared || false,
      label: d.description || 'Contribution',
    }))
  }

  async getMemberPollVotes(authId: string): Promise<MemberPollVote[]> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select(
        `
        id,
        created_at,
        polls (
          title,
          question,
          poll_number
        ),
        poll_options (
          label
        )
      `
      )
      .eq('user_id', authId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN] Error fetching member poll votes:', error)
      return []
    }

    interface PollVoteJoined {
      id: string
      created_at: string
      polls: {
        title: string | null
        question: string | null
        poll_number: number | null
      } | null
      poll_options: {
        label: string
      } | null
    }

    return ((data as unknown as PollVoteJoined[]) || []).map((v) => ({
      id: v.id,
      pollTitle: v.polls?.title || v.polls?.question || 'Unknown Poll',
      pollNumber: v.polls?.poll_number || 0,
      choice: v.poll_options?.label || 'Unknown',
      date: v.created_at,
    }))
  }

  async getMemberSessions(authId: string): Promise<MemberSession[]> {
    const { data, error } = await supabase
      .from('member_sessions')
      .select('id, device_name, location, ip_address, created_at, is_current')
      .eq('member_id', authId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[ADMIN] Error fetching member sessions:', error)
      return []
    }

    return (data || []).map((s) => ({
      id: s.id,
      device: s.device_name || 'Unknown Device',
      location: s.location || 'Unknown Location',
      ip: s.ip_address || 'N/A',
      date: s.created_at,
      current: s.is_current || false,
    }))
  }

  /** Count of a member's field-action check-ins so far this calendar year (YTD). */
  async getMemberEventAttendanceYtd(authId: string): Promise<number> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const { count, error } = await supabase
      .from('field_action_attendance')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', authId)
      .gte('check_in_time', yearStart)

    if (error) {
      console.error('[ADMIN] Error fetching member event attendance:', error)
      return 0
    }
    return count ?? 0
  }

  async getMemberNotes(authId: string): Promise<MemberNote[]> {
    const { data, error } = await supabase
      .from('member_notes')
      .select('id, author_name, author_role, content, created_at, is_system')
      .eq('member_id', authId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[ADMIN] Error fetching member notes:', error)
      return []
    }

    return (data || []).map((n) => ({
      id: n.id,
      author: n.author_name || 'System',
      role: n.author_role || 'Admin',
      content: n.content,
      date: n.created_at,
      isSystem: n.is_system || false,
    }))
  }

  async addMemberNote(
    authId: string,
    authorName: string,
    authorRole: string,
    content: string
  ): Promise<MemberNote | null> {
    const { data, error } = await supabase
      .from('member_notes')
      .insert([
        {
          member_id: authId,
          author_name: authorName,
          author_role: authorRole,
          content,
          is_system: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('[ADMIN] Error adding member note:', error)
      return null
    }

    return {
      id: data.id,
      author: data.author_name,
      role: data.author_role,
      content: data.content,
      date: data.created_at,
      isSystem: data.is_system,
    }
  }

  async getPendingVerifications(): Promise<PendingVerification[]> {
    return memberService.getPendingVerifications()
  }

  async verifyMember(
    id: string,
    approve: boolean,
    reason?: string,
    chapterName?: string
  ): Promise<boolean> {
    const success = await memberService.verifyMember(id, approve, reason, chapterName)
    if (success) {
      const profile = await this.getMemberProfile(id)
      discordService.memberVerified(id, profile?.name || id, approve, chapterName)
      await this.logAction(
        approve ? 'VERIFY_MEMBER_APPROVE' : 'VERIFY_MEMBER_REJECT',
        `MEMBERS/${id}`,
        approve ? 'Success' : 'Warning',
        { reason, chapter: chapterName }
      )
      if (approve && chapterName) {
        await this.incrementChapterMemberCount(chapterName)
      }
      if (approve) {
        supabase.functions.invoke('send-welcome-email', { body: { userId: id } }).catch(() => {
          // Fire-and-forget — email failure must not block approval
        })
      }
    }
    return success
  }

  async getCountries(): Promise<Country[]> {
    return memberService.getCountries()
  }

  async deleteMember(id: string): Promise<boolean> {
    const success = await memberService.deleteMember(id)
    if (success) await this.logAction('SOFT_DELETE_MEMBER', `MEMBERS/${id}`, 'Warning')
    return success
  }

  async getTrashedMembers(): Promise<Member[]> {
    return memberService.getTrashedMembers()
  }

  async restoreMember(id: string): Promise<boolean> {
    const success = await memberService.restoreMember(id)
    if (success) await this.logAction('RESTORE_MEMBER', `MEMBERS/${id}`, 'Success')
    return success
  }

  async permanentlyDeleteMember(id: string): Promise<boolean> {
    const success = await memberService.permanentlyDeleteMember(id)
    if (success) await this.logAction('PERMANENT_DELETE_MEMBER', `MEMBERS/${id}`, 'Warning')
    return success
  }

  // --- Chapter Operations ---

  async getChapters(): Promise<Chapter[]> {
    return chapterService.getChapters()
  }

  async createChapter(chapter: Omit<Chapter, 'id'>): Promise<boolean> {
    const success = await chapterService.createChapter(chapter)
    if (success) {
      await this.logAction('CHAPTER_CREATE', `CHAPTERS/${chapter.name}`, 'Success')
    }
    return success
  }

  async updateChapter(id: string, chapter: Partial<Chapter>): Promise<boolean> {
    const success = await chapterService.updateChapter(id, chapter)
    if (success) {
      await this.logAction('CHAPTER_UPDATE', `CHAPTERS/${id}`, 'Success', chapter)
    }
    return success
  }

  async deleteChapter(id: string, name: string): Promise<boolean> {
    const success = await chapterService.deleteChapter(id)
    if (success) {
      await this.logAction('CHAPTER_DELETE', `CHAPTERS/${name}`, 'Warning')
    }
    return success
  }

  async incrementChapterMemberCount(chapterName: string): Promise<void> {
    return chapterService.incrementChapterMemberCount(chapterName)
  }

  async addChapterLeader(
    chapterId: string,
    leader: { name: string; role: string; imageUrl?: string }
  ): Promise<boolean> {
    const success = await chapterService.addChapterLeader(chapterId, leader)
    if (success) {
      await this.logAction('CHAPTER_LEADER_ADD', `CHAPTERS/${chapterId}/LEADERS`, 'Success', {
        leader: leader.name,
        role: leader.role,
      })
    }
    return success
  }

  async removeChapterLeader(
    chapterId: string,
    leaderId: string,
    leaderName: string
  ): Promise<boolean> {
    const success = await chapterService.removeChapterLeader(leaderId)
    if (success) {
      await this.logAction(
        'CHAPTER_LEADER_REMOVE',
        `CHAPTERS/${chapterId}/LEADERS/${leaderName}`,
        'Warning'
      )
    }
    return success
  }

  async getUserChapter(authId: string): Promise<string | null> {
    const { data } = await supabase
      .from('users')
      .select('chapter, full_name')
      .eq('id', authId)
      .maybeSingle()
    if (data?.chapter) return data.chapter

    // Fallback 1: check if this user is the leader of a chapter by leader_id UUID match
    const { data: ledById } = await supabase
      .from('chapters')
      .select('name')
      .eq('leader_id', authId)
      .maybeSingle()
    if (ledById?.name) {
      // Persist so the user appears in their own chapter directory going forward
      await supabase.from('users').update({ chapter: ledById.name }).eq('id', authId)
      return ledById.name
    }

    // Fallback 2: check if this user is the named leader of a chapter by leader_name
    if (data?.full_name) {
      const { data: led } = await supabase
        .from('chapters')
        .select('name')
        .eq('leader_name', data.full_name)
        .maybeSingle()
      if (led?.name) {
        // Persist so the user appears in their own chapter directory going forward
        await supabase.from('users').update({ chapter: led.name }).eq('id', authId)
        return led.name
      }
    }
    return null
  }

  /**
   * Returns the name of the chapter this user leads, or null if they're not a leader.
   * Tries three strategies in order:
   *   1. chapters.leader_id = authId
   *   2. chapters.leader_name case-insensitive match on users.full_name
   *   3. chapter_leaders row ilike match (handles chapters with separate leadership rows)
   */
  async getLeadChapter(authId: string): Promise<string | null> {
    // 1. Direct leader_id match
    const { data: byId } = await supabase
      .from('chapters')
      .select('name')
      .eq('leader_id', authId)
      .maybeSingle()
    if (byId?.name) return byId.name

    // Fetch user's full name once for the remaining checks
    const { data: user } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', authId)
      .maybeSingle()
    if (!user?.full_name) return null
    const fullName = user.full_name.trim()

    // 2. leader_name column match (case-insensitive)
    const { data: byName } = await supabase
      .from('chapters')
      .select('name')
      .ilike('leader_name', fullName)
      .maybeSingle()
    if (byName?.name) return byName.name

    // 3. chapter_leaders table — matches any leadership role (secretary, treasurer, etc.)
    const { data: leaderRow } = await supabase
      .from('chapter_leaders')
      .select('chapter_id')
      .ilike('name', fullName)
      .maybeSingle()
    if (leaderRow?.chapter_id) {
      const { data: ch } = await supabase
        .from('chapters')
        .select('name')
        .eq('id', leaderRow.chapter_id)
        .maybeSingle()
      if (ch?.name) return ch.name
    }

    return null
  }

  async isChapterLeader(authId: string): Promise<boolean> {
    const chapterName = await this.getLeadChapter(authId)
    return chapterName !== null
  }

  async joinChapter(chapterName: string): Promise<boolean> {
    const success = await chapterService.joinChapter(chapterName)
    if (success) {
      await this.logAction('CHAPTER_JOIN', `CHAPTERS/${chapterName}`, 'Success')
    }
    return success
  }

  // --- Poll Operations ---

  async getPolls(): Promise<Poll[]> {
    return pollService.getPolls()
  }

  async getDonationCampaigns(status?: 'Active' | 'Closed'): Promise<DonationCampaign[]> {
    let query = supabase
      .from('donation_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.warn('[DATABASE] Failed to fetch campaigns:', error)
      return []
    }

    interface DBCampaign {
      id: string
      title: string
      description: string
      target_amount: number
      raised_amount: number
      end_date: string
      status: 'Active' | 'Closed'
      image_url: string
    }

    return (data || []).map((c: DBCampaign) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targetAmount: Number(c.target_amount),
      raisedAmount: Number(c.raised_amount),
      endDate: c.end_date,
      status: c.status,
      imageUrl: c.image_url,
    }))
  }

  async createDonationCampaign(
    campaign: Omit<DonationCampaign, 'id' | 'raisedAmount'>
  ): Promise<boolean> {
    const { error } = await supabase.from('donation_campaigns').insert({
      title: campaign.title,
      description: campaign.description,
      target_amount: campaign.targetAmount,
      end_date: campaign.endDate,
      status: campaign.status,
      image_url: campaign.imageUrl,
    })

    if (error) {
      console.error('[DATABASE] Failed to create campaign:', error)
      return false
    }

    await this.logAction('CAMPAIGN_CREATE', `CAMPAIGNS/${campaign.title}`, 'Success')
    return true
  }

  async updateDonationCampaign(id: string, campaign: Partial<DonationCampaign>): Promise<boolean> {
    const updates: Record<string, string | number | null> = {}
    if (campaign.title !== undefined) updates.title = campaign.title
    if (campaign.description !== undefined) updates.description = campaign.description
    if (campaign.targetAmount !== undefined) updates.target_amount = campaign.targetAmount
    if (campaign.endDate !== undefined) updates.end_date = campaign.endDate
    if (campaign.status !== undefined) updates.status = campaign.status
    if (campaign.imageUrl !== undefined) updates.image_url = campaign.imageUrl || null

    const { error } = await supabase.from('donation_campaigns').update(updates).eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update campaign:', error)
      return false
    }

    await this.logAction('CAMPAIGN_UPDATE', `CAMPAIGNS/${id}`, 'Success')
    return true
  }

  async deleteDonationCampaign(id: string, title: string): Promise<boolean> {
    const { error } = await supabase
      .from('donation_campaigns')
      .update({ status: 'Closed' })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to close campaign:', error)
      return false
    }

    await this.logAction('CAMPAIGN_CLOSE', `CAMPAIGNS/${title}`, 'Warning')
    return true
  }

  async getDefaultDonationCampaignId(): Promise<string | null> {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('id')
      .eq('status', 'Active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.warn('[DATABASE] Failed to fetch default campaign:', error)
      return null
    }

    return data?.id ?? null
  }

  async submitDonation(donationData: {
    fullName: string
    phone: string
    amount: string
    country: string
    paymentMethod?: string
    showOnDashboard: boolean
    memberId?: string | null
    campaignId?: string | null
  }): Promise<boolean> {
    const campaignId = donationData.campaignId || (await this.getDefaultDonationCampaignId())

    const { error } = await supabase.from('donations').insert({
      full_name: donationData.fullName,
      phone: donationData.phone,
      amount: parseFloat(donationData.amount),
      country: donationData.country,
      payment_method: donationData.paymentMethod || 'MTN MoMo',
      show_on_dashboard: donationData.showOnDashboard,
      member_id: donationData.memberId || null,
      campaign_id: campaignId,
    })

    if (error) {
      console.error('[DATABASE] Donation submission failed:', error)
      return false
    }
    discordService.donationSubmitted(
      donationData.fullName,
      donationData.amount,
      donationData.paymentMethod || 'MTN MoMo',
      donationData.country
    )
    return true
  }

  async createPoll(poll: {
    question: string
    region: string
    status: string
    endDate: string
    options: string[]
  }): Promise<boolean> {
    const pollId = await pollService.createPoll(poll)
    if (pollId) {
      await this.logAction('CREATE_POLL', `POLLS/${pollId}`, 'Success', { question: poll.question })
      return true
    }
    return false
  }

  async deletePoll(id: string): Promise<boolean> {
    const success = await pollService.deletePoll(id)
    if (success) {
      await this.logAction('DELETE_POLL', `POLLS/${id}`, 'Warning')
    }
    return success
  }

  async updatePollStatus(id: string, status: 'Active' | 'Closed'): Promise<boolean> {
    return pollService.updatePollStatus(id, status)
  }

  async voteInPoll(pollId: string, optionId: string): Promise<boolean> {
    return pollService.voteInPoll(pollId, optionId)
  }

  async getPollStats(): Promise<PollStats> {
    return pollService.getPollStats()
  }

  // --- Store Operations ---

  async getInventory(): Promise<InventoryItem[]> {
    return logisticsService.getInventory()
  }

  async getStoreProducts(): Promise<Product[]> {
    return logisticsService.getStoreProducts()
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    return logisticsService.getProductBySlug(slug)
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<boolean> {
    const success = await logisticsService.addInventoryItem(item)
    if (success) {
      await this.logAction('STORE_ADD', `STORE/${item.name}`, 'Success', item)
    }
    return success
  }

  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<boolean> {
    const success = await logisticsService.updateInventoryItem(id, item)
    if (success) {
      await this.logAction('STORE_UPDATE', `STORE/${id}`, 'Success', item)
    }
    return success
  }

  async deleteInventoryItem(id: string, name: string): Promise<boolean> {
    const success = await logisticsService.deleteInventoryItem(id)
    if (success) {
      this.logAction('DELETE_INVENTORY', name, 'Success')
    }
    return success
  }

  // --- Logistics Operations ---

  async getResourceRequests(): Promise<ResourceRequest[]> {
    return logisticsService.getResourceRequests()
  }

  async updateResourceRequestStatus(
    id: string,
    status: ResourceRequest['status']
  ): Promise<boolean> {
    const success = await logisticsService.updateResourceRequestStatus(id, status)
    if (success) {
      this.logAction(
        `RESOURCE_REQUEST_${status.toUpperCase()}`,
        `REQ-${id.substring(0, 8)}`,
        'Success'
      )
    }
    return success
  }

  // --- Analytics ---
  async getPublicStats(): Promise<{
    members: number
    chapters: number
    regions: number
    diaspora: number
    countries: number
    membersDelta: string
    chaptersDelta: string
    diasporaDelta: string
  }> {
    const { data, error } = await supabase.rpc('get_public_stats')
    if (error || !data) {
      console.warn('[ADMIN SERVICE] Failed to fetch public stats:', error)
      return {
        members: 0,
        chapters: 0,
        regions: 16,
        diaspora: 0,
        countries: 0,
        membersDelta: '',
        chaptersDelta: '',
        diasporaDelta: '',
      }
    }
    return {
      members: data.members ?? 0,
      chapters: data.chapters ?? 0,
      regions: data.regions ?? 16,
      diaspora: data.diaspora ?? 0,
      countries: data.countries ?? 0,
      membersDelta: 'Steady growth',
      chaptersDelta: 'Growing nationwide',
      diasporaDelta: 'Global network',
    }
  }

  async getAboutOfficials(): Promise<
    { id: string; name: string; role: string; avatar_url: string | null }[]
  > {
    const { data, error } = await supabase
      .from('party_officials')
      .select('id, name, role, avatar_url')
      .eq('tier', 'executive')
      .order('order_index', { ascending: true })
    if (error || !data) return []
    return data
  }

  async getGlobalStats(): Promise<{ label: string; value: string; change: string }[]> {
    const [usersRes, chaptersRes, ordersRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('store_orders').select('*', { count: 'exact', head: true }),
    ])

    const usersCount = usersRes.count || 0
    const chaptersCount = chaptersRes.count || 0
    const ordersCount = ordersRes.count || 0

    return [
      { label: 'Total Membership', value: usersCount.toLocaleString(), change: '+12.4%' },
      { label: 'Regional Chapters', value: chaptersCount.toString(), change: '+4.2%' },
      {
        label: 'Member Engagement',
        value: `${Math.round((usersCount / 5000) * 100)}%`,
        change: '+2.1%',
      },
      { label: 'Merch Orders', value: ordersCount.toLocaleString(), change: '+15.8%' },
    ]
  }

  async getRegions(): Promise<Region[]> {
    return logisticsService.getRegions()
  }

  async getConstituencies(): Promise<{ data: { name: string; region_id: number }[] }> {
    return logisticsService.getConstituencies()
  }

  async updateRegion(id: string, name: string): Promise<boolean> {
    const success = await logisticsService.updateRegion(id, name)
    if (success) {
      await this.logAction('REGION_UPDATE', `REGIONS/${name}`, 'Success')
    }
    return success
  }

  // --- Storage Operations ---
  async uploadAvatar(
    fileName: string,
    blob: Blob
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    const compressed = await compressForUpload(blob, fileName)
    return supabase.storage.from('avatars').upload(fileName, compressed, {
      upsert: true,
      contentType: compressed.type || 'image/webp',
    })
  }

  /**
   * Generates a standardized avatar path: {userId}/{timestamp}.webp
   * The user-id folder satisfies the `avatars` storage RLS (both INSERT and
   * UPDATE are restricted to a folder named after auth.uid()), and the timestamp
   * busts the CDN/browser cache so a replaced photo actually shows. `userId` is
   * the member's auth user id — NOT their registration number.
   */
  generateAvatarPath(userId: string): string {
    return `${userId}/${Date.now()}.webp`
  }

  getAvatarPublicUrl(fileName: string): string {
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    return data.publicUrl
  }

  /**
   * Deletes a previously-uploaded avatar from the `avatars` bucket given its
   * public URL. Used when a member replaces their photo so the superseded file
   * does not linger as an orphan. Best-effort: a failure here is logged, not
   * thrown, since the new avatar has already been saved. Only removes objects
   * inside the `avatars` bucket; ignores blank, data:, or foreign URLs.
   */
  async deleteAvatarByPublicUrl(publicUrl: string | null | undefined): Promise<void> {
    if (!publicUrl) return
    const marker = '/avatars/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length).split('?')[0])
    if (!path) return
    const { error } = await supabase.storage.from('avatars').remove([path])
    if (error) console.error('[AVATAR] Failed to remove old avatar:', error)
  }

  async uploadBrandingAsset(
    fileName: string,
    blob: Blob
  ): Promise<{ data: { path: string } | null; error: Error | null }> {
    const compressed = await compressForUpload(blob, fileName)
    const ext = compressed.name.split('.').pop()
    const path = fileName.replace(/\.[^.]+$/, `.${ext}`)
    return supabase.storage
      .from('branding')
      .upload(path, compressed, { upsert: true, contentType: compressed.type || 'image/webp' })
  }

  /**
   * Upload a donation receipt to storage and record its storage path on the
   * matching donation so receipt access can be signed on demand.
   */
  async uploadDonationReceipt(file: File, donationReference: string): Promise<boolean> {
    if (!donationReference?.trim()) {
      console.error('[UPLOAD] donationReference is required')
      return false
    }

    try {
      const compressed = await compressForUpload(file)
      const ts = Date.now()
      const safeName = `${ts}_${compressed.name}`
      const { data, error: uploadErr } = await supabase.storage
        .from('donation-receipts')
        .upload(safeName, compressed, {
          upsert: true,
          contentType: compressed.type || 'application/octet-stream',
        })

      if (uploadErr || !data) {
        console.error('[STORAGE] Receipt upload failed:', uploadErr)
        return false
      }

      // Resolve the target donation by reference or id using parameterized
      // lookups (never interpolate user input into a raw .or() filter — that
      // would let a crafted reference broaden the UPDATE to every row). The id
      // lookup is guarded by a UUID check so a non-UUID reference can't trigger
      // a cast error.
      const ref = donationReference.trim()
      const byRef = await supabase.from('donations').select('id').eq('reference', ref)
      let targetIds = (byRef.data ?? []).map((d) => d.id as string)
      if (targetIds.length === 0 && isUuid(ref)) {
        const byId = await supabase.from('donations').select('id').eq('id', ref)
        targetIds = (byId.data ?? []).map((d) => d.id as string)
      }

      if (targetIds.length === 0) {
        console.error('[UPLOAD] No donation matched reference or id:', donationReference)
        return false
      }

      const { data: updatedDonations, error: updateErr } = await supabase
        .from('donations')
        .update({ receipt_url: `donation-receipts/${data.path}` })
        .in('id', targetIds)
        .select('id')

      if (updateErr) {
        console.error('[DATABASE] Updating donation receipt_url failed:', updateErr)
        return false
      }

      if (!updatedDonations || updatedDonations.length === 0) {
        console.error('[UPLOAD] No donation matched reference or id:', donationReference)
        return false
      }

      await this.logAction('RECEIPT_UPLOAD', `donation-receipts/${safeName}`, 'Success')
      return true
    } catch (err) {
      console.error('[UPLOAD] uploadDonationReceipt failed:', err)
      return false
    }
  }

  getBrandingAssetUrl(fileName: string): string {
    const { data } = supabase.storage.from('branding').getPublicUrl(fileName)
    return data.publicUrl
  }

  async deleteConstituency(id: string, regionName: string, conName: string): Promise<boolean> {
    const success = await logisticsService.deleteConstituency(id)
    if (success) {
      await this.logAction(
        'CONSTITUENCY_DELETE',
        `REGIONS/${regionName}/CONSTITUENCIES/${conName}`,
        'Warning'
      )
    }
    return success
  }

  async createRegion(name: string): Promise<boolean> {
    const success = await logisticsService.createRegion(name)
    if (success) await this.logAction('REGION_CREATE', `REGIONS/${name}`, 'Success')
    return success
  }

  async deleteRegion(id: string, name: string): Promise<boolean> {
    const success = await logisticsService.deleteRegion(id)
    if (success) await this.logAction('REGION_DELETE', `REGIONS/${name}`, 'Warning')
    return success
  }

  async createConstituency(regionId: string, regionName: string, name: string): Promise<boolean> {
    const success = await logisticsService.createConstituency(regionId, name)
    if (success)
      await this.logAction(
        'CONSTITUENCY_CREATE',
        `REGIONS/${regionName}/CONSTITUENCIES/${name}`,
        'Success'
      )
    return success
  }

  async updateConstituency(id: string, regionName: string, name: string): Promise<boolean> {
    const success = await logisticsService.updateConstituency(id, name)
    if (success)
      await this.logAction(
        'CONSTITUENCY_UPDATE',
        `REGIONS/${regionName}/CONSTITUENCIES/${name}`,
        'Success'
      )
    return success
  }

  async getRegionalStats(): Promise<RegionalStat[]> {
    const [regions, chapters] = await Promise.all([this.getRegions(), this.getChapters()])

    return regions.map((r) => {
      const regionalChapters = chapters.filter((c) => c.city_or_region === r.name)
      const totalMembers = regionalChapters.reduce((sum, c) => sum + c.member_count, 0)

      return {
        region: r.name,
        memberCount: totalMembers,
        chapters: regionalChapters.length,
        activePolls: 0,
        performance: totalMembers > 1000 ? 'High' : totalMembers > 500 ? 'Medium' : 'Low',
        color:
          totalMembers > 1000
            ? 'var(--brand-green)'
            : totalMembers > 500
              ? 'var(--brand-gold)'
              : 'var(--brand-red)',
      }
    })
  }

  async getGrowthTrends(): Promise<GrowthTrend[]> {
    // Note:membership_growth_view needs to be created in Supabase or handled as a table
    const { data, error } = await supabase.from('membership_growth_view').select('*').limit(12)

    if (error) {
      console.warn('[DATABASE] Growth trends fetch failed:', error)
      return []
    }
    return data
  }

  async getSentimentAnalysis(): Promise<SentimentStat[]> {
    const chapters = await this.getChapters()
    return chapters.slice(0, 4).map((c) => ({
      topic: `${c.name} Mobilization`,
      score: Math.min(Math.round((c.member_count / 500) * 100), 100),
      trend: c.member_count > 100 ? 'Up' : 'Stable',
      sentiment: c.member_count > 200 ? 'Positive' : 'Neutral',
      color: c.member_count > 200 ? 'var(--brand-green)' : 'var(--brand-gold)',
    }))
  }

  async getSystemAuditLogs(): Promise<AuditLogEntry[]> {
    return auditService.getSystemAuditLogs()
  }

  async getAuditLogsForResource(resourceId: string): Promise<AuditLogEntry[]> {
    return auditService.getAuditLogsForResource(resourceId)
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return auditService.getActivityLogs()
  }

  // --- Blog Operations ---

  async getBlogPosts(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, authors(name, role, image_url, bio)')
      .is('deleted_at', null)
      .order('published_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch blog posts:', error)
      return []
    }

    return (data || []).map((p: Record<string, unknown>) => {
      const a = p.authors as {
        name?: string
        role?: string
        image_url?: string
        bio?: string
      } | null
      return {
        id: p.id as string,
        title: p.title as string,
        slug: p.slug as string,
        excerpt: p.excerpt as string,
        content: p.content as string,
        authorId: p.author_id as string,
        authorName: a?.name || (p.author_name as string) || 'Admin',
        authorRole: a?.role || (p.author_role as string | undefined),
        authorImage: a?.image_url || (p.author_image as string | undefined),
        authorBio: a?.bio || (p.author_bio as string | undefined),
        category: p.category as string,
        imageUrl: p.image_url as string | undefined,
        readTime: p.read_time as string,
        isFeatured: p.is_featured as boolean,
        publishedAt: p.published_at as string,
        status: (p.status as 'Draft' | 'Pending Verification' | 'Published') || 'Draft',
        tags: (p.tags as string[]) || [],
        seoTitle: p.seo_title as string | undefined,
        metaDescription: p.meta_description as string | undefined,
      }
    })
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return contentService.getBlogPostBySlug(slug)
  }

  async createBlogPost(post: Omit<BlogPost, 'id'>): Promise<boolean> {
    const success = await contentService.createBlogPost(post)
    if (success) {
      await this.logAction('BLOG_CREATE', `BLOGS/${post.slug}`, 'Success')
    }
    return success
  }

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<boolean> {
    const success = await contentService.updateBlogPost(id, post)
    if (success) {
      await this.logAction('BLOG_UPDATE', `BLOGS/${id}`, 'Success', post)
    }
    return success
  }

  async deleteBlogPost(id: string, slug: string): Promise<boolean> {
    const success = await contentService.deleteBlogPost(id)
    if (success) {
      await this.logAction('BLOG_DELETE', `BLOGS/${slug}`, 'Warning')
    }
    return success
  }

  async getAuthors(): Promise<Author[]> {
    return contentService.getAuthors()
  }

  async getBlogStats(): Promise<{ publishedCount: number }> {
    const count = await contentService.getPublishedPostCount()
    return { publishedCount: count }
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const success = await contentService.deleteAuthor(id)
    if (success) {
      await this.logAction('AUTHOR_DELETE', `AUTHORS/${id}`, 'Warning')
    }
    return success
  }

  // --- Press Operations ---

  async getPressReleases(): Promise<PressRelease[]> {
    return contentService.getPressReleases()
  }

  async createPressRelease(
    release: Omit<PressRelease, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> {
    const success = await contentService.createPressRelease(release)
    if (success) {
      await this.logAction('PRESS_CREATE', `PRESS/${release.slug}`, 'Success')
    }
    return success
  }

  async getMediaKitAssets(): Promise<MediaKitAsset[]> {
    return contentService.getMediaKitAssets()
  }

  async getChapterApplications(): Promise<ChapterApplication[]> {
    return chapterService.getChapterApplications()
  }

  async submitChapterApplication(application: {
    proposed_chapter_name: string
    region: string
    constituency: string
    vision_statement: string
    experience_summary?: string
  }): Promise<boolean> {
    return chapterService.submitChapterApplication(application)
  }

  async approveChapterApplication(applicationId: string, notes: string = ''): Promise<boolean> {
    const success = await chapterService.approveChapterApplication(applicationId, notes)
    if (success) {
      await this.logAction('CHAPTER_APPROVE', `CHAPTERS/${applicationId}`, 'Success')
    }
    return success
  }

  async rejectChapterApplication(applicationId: string, notes: string = ''): Promise<boolean> {
    const success = await chapterService.rejectChapterApplication(applicationId, notes)
    if (success) {
      await this.logAction('CHAPTER_REJECT', `CHAPTERS/${applicationId}`, 'Warning')
    }
    return success
  }

  async getDonations(status?: string): Promise<DonationDetail[]> {
    return donationService.getDonations(status)
  }

  async getPendingDonations(): Promise<DonationDetail[]> {
    return donationService.getPendingDonations()
  }

  async getDonationStats(): Promise<{
    totalContributions: number
    pendingCount: number
    approvedAmount: number
    flaggedCount: number
  }> {
    return donationService.getDonationStats()
  }

  async verifyDonation(
    donationId: string,
    status: 'Verified' | 'Rejected',
    notes: string = ''
  ): Promise<boolean> {
    const success = await donationService.verifyDonation(donationId, status, notes)
    if (success) {
      await this.logAction(
        'DONATION_VERIFY',
        `DONATIONS/${donationId}`,
        status === 'Verified' ? 'Success' : 'Warning'
      )
      if (status === 'Verified') {
        supabase.functions.invoke('send-donation-receipt', { body: { donationId } }).catch(() => {
          // Fire-and-forget — receipt failure must not block the verification response
        })

        // Fetch donation details to notify Discord
        Promise.resolve(
          supabase
            .from('donations')
            .select('full_name, amount, payment_method, country, reference')
            .eq('id', donationId)
            .maybeSingle()
        )
          .then(({ data }) => {
            if (data) {
              discordService.donationVerified(
                data.full_name || 'Anonymous',
                data.amount?.toString() || '0',
                data.payment_method || 'MTN MoMo',
                data.country || 'Ghana',
                data.reference || donationId.substring(0, 8).toUpperCase()
              )
            }
          })
          .catch(() => {})
      }
    }
    return success
  }

  async getDonationCountByPhone(phone: string, excludeId: string): Promise<number> {
    const { count } = await supabase
      .from('donations')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
      .neq('id', excludeId)
    return count ?? 0
  }

  async getStrategicPriorities(): Promise<DonationCampaign[]> {
    const { data } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: true })

    interface DBCampaign {
      id: string
      title: string
      description: string
      target_amount: number
      raised_amount: number
      end_date: string
      status: 'Active' | 'Closed'
      image_url: string
    }

    return (data || []).map((c: DBCampaign) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targetAmount: Number(c.target_amount),
      raisedAmount: Number(c.raised_amount),
      endDate: c.end_date,
      status: c.status,
      imageUrl: c.image_url,
    }))
  }

  async getVictories(): Promise<DonationCampaign[]> {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .neq('status', 'Active')
      .order('end_date', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Victories fetch failed:', error)
      return []
    }

    interface DBCampaign {
      id: string
      title: string
      description: string
      target_amount: number
      raised_amount: number
      end_date: string
      status: 'Active' | 'Closed'
      image_url: string
    }

    return (data || []).map((c: DBCampaign) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      targetAmount: Number(c.target_amount),
      raisedAmount: Number(c.raised_amount),
      endDate: c.end_date,
      status: c.status,
      imageUrl: c.image_url,
    }))
  }

  async getGlobalMobilizationStats(): Promise<{
    totalRaised: number
    totalMembers: number
    totalDonors: number
  }> {
    // Aggregates come from a SECURITY DEFINER RPC because donations RLS only
    // lets members read their own rows — direct sums undercount for non-admins
    const [statsRes, { count }] = await Promise.all([
      supabase.rpc('get_public_donation_stats'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])

    const stats = (statsRes.data ?? {}) as { total_raised?: number; donor_count?: number }

    return {
      totalRaised: Number(stats.total_raised ?? 0),
      totalMembers: count || 0,
      totalDonors: Number(stats.donor_count ?? 0),
    }
  }

  async getPublicDonationHistory(): Promise<DonationDetail[]> {
    return donationService.getPublicDonationFeed(50)
  }

  async getPersonalDonationHistory(userId: string): Promise<DonationDetail[]> {
    const [byId, user] = await Promise.all([
      donationService.getMemberDonationsById(userId),
      supabase.from('users').select('phone_number').eq('id', userId).single(),
    ])

    const byPhone = user.data?.phone_number
      ? await donationService.getMemberDonations(user.data.phone_number)
      : []

    const seen = new Set<string>()
    return [...byId, ...byPhone].filter((d) => !seen.has(d.id) && seen.add(d.id))
  }

  async getMovementSpendingHistory(): Promise<MobilizationLedger[]> {
    const data = await donationService.getMobilizationLedger(50)
    return data.map((d) => {
      const amount = Number(String(d.amount).replace(/[^0-9.-]+/g, ''))
      return {
        id: d.id,
        chapter: d.chapter,
        transaction_type: d.type,
        amount: Number.isFinite(amount) ? amount : 0,
        description: d.description,
        timestamp: d.date,
        category: d.category as MobilizationLedger['category'],
      }
    })
  }

  subscribeToPublicDonations(callback: (donation: DonationDetail) => void): {
    unsubscribe: () => void
  } {
    return donationService.subscribeToPublicDonations(callback)
  }

  async getAdminData(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admins')
      .select(
        `
        *,
        users!admins_id_fkey (
          full_name,
          email,
          phone_number,
          avatar_url
        )
      `
      )
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Error fetching admin data:', error)
      return null
    }
    if (!data) return null

    interface DBAdminResponse {
      id: string
      role: string
      permissions: unknown
      assigned_region: string | null
      users:
        | {
            full_name: string
            email: string
            phone_number: string
            avatar_url: string
          }
        | {
            full_name: string
            email: string
            phone_number: string
            avatar_url: string
          }[]
        | null
      preferences?: Record<string, unknown>
    }

    const admin = data as unknown as DBAdminResponse
    const userProfile = (Array.isArray(admin.users) ? admin.users[0] : admin.users) as {
      full_name: string
      email: string
      phone_number: string
      avatar_url: string
    } | null

    const role = normalizeAdminRole(admin.role)
    const permissions = resolveStoredAdminPermissions(role, admin.permissions)

    const defaultPreferences: import('@/types/admin').AdminPreferences = {
      interfaceDensity: 'Comfortable',
      darkMode: false,
      notifications: {
        newRegistrations: true,
        securityAlerts: true,
        auditEvents: true,
        financeRequests: true,
      },
    }

    const mergedPreferences = {
      ...defaultPreferences,
      ...(admin.preferences || {}),
      notifications: {
        ...defaultPreferences.notifications,
        ...(admin.preferences?.notifications || {}),
      },
    }

    return {
      id: admin.id,
      email: userProfile?.email || '',
      name: userProfile?.full_name || 'Admin',
      role,
      assigned_region: admin.assigned_region,
      permissions,
      phone: userProfile?.phone_number || '',
      avatarUrl: userProfile?.avatar_url || '',
      preferences: mergedPreferences,
    } as AdminUser
  }

  async updatePreferences(
    userId: string,
    preferences: import('@/types/admin').AdminPreferences
  ): Promise<void> {
    const { error } = await supabase.from('admins').update({ preferences }).eq('id', userId)

    if (error) {
      console.error('[ADMIN SERVICE] Failed to update preferences:', error)
      throw new Error(error.message || 'Failed to update preferences')
    }

    // Update local currentUser if it matches
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser.preferences = preferences
    }
  }

  async updateAdminData(
    userId: string,
    updates: {
      role?: AdminRole
      permissions?: AdminPermission[]
      assigned_region?: string | null
    }
  ) {
    const { data, error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', userId)
      .select('id')

    if (error) throw new Error(error.message || 'Failed to update admin data')
    if (!data?.length)
      throw new Error('Update failed — you may not have permission to edit this record')

    if (this.currentUser?.id === userId) {
      const assignedRegion =
        'assigned_region' in updates
          ? updates.assigned_region || undefined
          : this.currentUser.region
      this.currentUser = {
        ...this.currentUser,
        role: updates.role ?? this.currentUser.role,
        region: assignedRegion,
        assigned_region: assignedRegion,
        permissions: updates.permissions ?? this.currentUser.permissions,
      } as AdminUser & { assigned_region?: string }
    }
  }

  async updatePublicUserProfile(
    userId: string,
    updates: {
      full_name?: string
      avatar_url?: string
      phone_number?: string
    }
  ) {
    return supabase.from('users').update(updates).eq('id', userId)
  }

  async getWishlist(userId: string): Promise<Product[]> {
    interface StoreInventoryDbRow {
      id: string
      name: string
      slug: string | null
      category: string
      price_ghs: number
      stock_quantity: number
      image_url: string | null
      description: string | null
      rating: number | null
      reviews: number | null
      sizes: string[] | null
      colors: string[] | null
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select(
        `
        id,
        product_id,
        store_inventory (*)
      `
      )
      .eq('user_id', userId)

    if (error || !data) {
      console.error('[DATABASE] Error fetching wishlist:', error)
      return []
    }

    return data.map((item) => {
      const i = item.store_inventory as unknown as StoreInventoryDbRow
      return {
        id: i.id,
        name: i.name,
        slug: i.slug || i.name.toLowerCase().replace(/\s+/g, '-'),
        category: i.category,
        price: `GH₵ ${Number(i.price_ghs).toLocaleString()}`,
        stock: i.stock_quantity,
        status: i.stock_quantity > 10 ? 'Stable' : i.stock_quantity > 0 ? 'Low Stock' : 'Critical',
        image:
          i.image_url ||
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        description: i.description || '',
        rating: i.rating || 4.8,
        reviews: i.reviews || 0,
        sizes: i.sizes || ['S', 'M', 'L', 'XL'],
        colors: i.colors || ['Standard'],
      }
    })
  }

  async addToWishlist(userId: string, productId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId })

    if (error && error.code !== '23505') {
      // Ignore unique constraint violation
      console.error('[DATABASE] Error adding to wishlist:', error)
      return false
    }
    return true
  }

  async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) {
      console.error('[DATABASE] Error removing from wishlist:', error)
      return false
    }
    return true
  }

  // --- Communication Engine (Field Mobilization) ---

  async getBroadcasts(): Promise<Broadcast[]> {
    return tacticalService.getBroadcasts()
  }

  async sendBroadcast(
    broadcast: Omit<Broadcast, 'id' | 'created_at' | 'sender_id'>
  ): Promise<boolean> {
    const success = await tacticalService.sendBroadcast(broadcast)
    if (success) {
      await this.logAction('SEND_BROADCAST', `TARGET/${broadcast.target_type}`, 'Success', {
        title: broadcast.title,
      })
    } else {
      await this.logAction('SEND_BROADCAST', `TARGET/${broadcast.target_type}`, 'Failure')
    }
    return success
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    return tacticalService.getNotifications(userId)
  }

  async markNotificationRead(id: string): Promise<boolean> {
    return tacticalService.markNotificationRead(id)
  }

  async getBroadcastMetrics(broadcastId: string): Promise<{ total: number; read: number }> {
    return tacticalService.getBroadcastMetrics(broadcastId)
  }

  async getLeaderboard(region?: string): Promise<LeaderboardEntry[]> {
    return tacticalService.getLeaderboard(region)
  }

  async getMovementPulse(): Promise<MovementPulse> {
    return tacticalService.getMovementPulse()
  }

  async getMilestones(): Promise<Milestone[]> {
    return tacticalService.getMilestones()
  }

  async createMilestone(milestone: Omit<Milestone, 'id' | 'created_at'>): Promise<boolean> {
    const success = await tacticalService.createMilestone(milestone)
    if (success) {
      await this.logAction('MILESTONE_CREATE', `ROADMAP/${milestone.title}`, 'Success', milestone)
    }
    return success
  }

  async updateMilestone(id: string, milestone: Partial<Milestone>): Promise<boolean> {
    const success = await tacticalService.updateMilestone(id, milestone)
    if (success) {
      await this.logAction('MILESTONE_UPDATE', `ROADMAP/${id}`, 'Success', milestone)
    }
    return success
  }

  async deleteMilestone(id: string, title: string): Promise<boolean> {
    const success = await tacticalService.deleteMilestone(id)
    if (success) {
      await this.logAction('MILESTONE_DELETE', `ROADMAP/${title}`, 'Warning')
    }
    return success
  }

  async getRoadmapForecast(): Promise<Milestone[]> {
    const milestones = await tacticalService.getMilestones()
    const growth = await this.getGrowthStats()
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true })
    const totalMembers = count || 0
    const avgDailyGrowth = Math.max(1, growth.joined_last_7d / 7)

    return milestones.map((m) => {
      if (m.status !== 'Completed' && m.target_members && m.target_members > totalMembers) {
        const remaining = m.target_members - totalMembers
        // Ensure a more realistic minimum growth floor for forecasting
        const realisticGrowth = Math.max(5, avgDailyGrowth)
        const daysToTarget = Math.ceil(remaining / realisticGrowth)

        // Cap the forecast at a reasonable horizon (e.g., 1 year) to avoid extreme dates
        const maxDays = 365
        const actualDays = Math.min(daysToTarget, maxDays)

        const forecast = new Date()
        forecast.setDate(forecast.getDate() + actualDays)
        return { ...m, forecasted_date: forecast.toISOString().split('T')[0] }
      }
      return m
    })
  }

  async verifyMemberID(
    memberId: string
  ): Promise<{ confidence: number; matches: string[]; flagged: boolean }> {
    return tacticalService.verifyMemberID(memberId)
  }

  async generateComplianceReport(region = 'National'): Promise<string> {
    console.warn(`[AUDIT-GEN] Generating ${region} compliance report...`)

    try {
      // 1. Fetch Member Metrics
      let membersQuery = supabase.from('users').select('id', { count: 'exact', head: true })
      let approvedQuery = supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('verification_status', 'Approved')

      if (region !== 'National') {
        membersQuery = membersQuery.eq('region', region)
        approvedQuery = approvedQuery.eq('region', region)
      }

      const [totalRes, approvedRes] = await Promise.all([membersQuery, approvedQuery])
      const totalMembers = totalRes.count || 0
      const approvedMembers = approvedRes.count || 0
      const verificationAccuracy =
        totalMembers > 0 ? ((approvedMembers / totalMembers) * 100).toFixed(1) + '%' : '100%'

      // 2. Fetch Logistics Latency (Simulated from orders if data exists)
      const { data: orders } = await supabase
        .from('store_orders')
        .select('dispatched_at, delivered_at')
        .not('dispatched_at', 'is', null)
        .not('delivered_at', 'is', null)
        .limit(100)

      let avgLatency = '4.2 days' // Fallback
      if (orders && orders.length > 0) {
        const latencies = orders.map((o) => {
          const start = new Date(o.dispatched_at).getTime()
          const end = new Date(o.delivered_at).getTime()
          return (end - start) / (1000 * 60 * 60 * 24) // days
        })
        const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length
        avgLatency = avg.toFixed(1) + ' days'
      }

      // 3. Fetch Sentiment Intelligence
      let sentimentQuery = supabase.from('national_sentiment_intelligence').select('avg_sentiment')
      if (region !== 'National') {
        sentimentQuery = sentimentQuery.eq('region', region)
      }
      const { data: sentimentData } = await sentimentQuery
      const sentimentIndex =
        sentimentData && sentimentData.length > 0
          ? (
              sentimentData.reduce((acc, curr) => acc + Number(curr.avg_sentiment), 0) /
              sentimentData.length
            ).toFixed(0) + '%'
          : '78%'

      // 4. Recent Audit Logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('id, action, status, admin_id')
        .order('timestamp', { ascending: false })
        .limit(10)

      const reportData = {
        timestamp: new Date().toISOString(),
        scope: region,
        metrics: {
          total_members: totalMembers,
          verification_accuracy: verificationAccuracy,
          avg_logistics_latency: avgLatency,
          sentiment_index: sentimentIndex,
        },
        audit_logs:
          logs?.map((l) => ({
            id: l.id.substring(0, 8).toUpperCase(),
            action: l.action,
            status: l.status,
            admin: l.admin_id ? `ADMIN-${l.admin_id.substring(0, 5)}` : 'SYSTEM',
          })) || [],
      }

      return JSON.stringify(reportData, null, 2)
    } catch (error) {
      console.error('[AUDIT-GEN] Report generation failed:', error)
      throw new Error('Failed to aggregate compliance metrics from live database.')
    }
  }

  // ─── ORDER LIFECYCLE ENGINE ──────────────────────────────────────────────────

  async getPublicDonationFeed(limit?: number): Promise<DonationDetail[]> {
    return donationService.getPublicDonationFeed(limit)
  }

  async getMobilizationLedger(limit?: number) {
    return donationService.getMobilizationLedger(limit)
  }

  async getAllSpendingEntries() {
    return donationService.getAllSpendingEntries()
  }

  async addSpendingEntry(entry: {
    chapter: string
    amount: number
    description: string
    category: string
    timestamp: string
  }) {
    return donationService.addSpendingEntry(entry)
  }

  async updateSpendingEntry(
    id: string,
    updates: {
      chapter?: string
      amount?: number
      description?: string
      category?: string
      timestamp?: string
    }
  ) {
    return donationService.updateSpendingEntry(id, updates)
  }

  async deleteSpendingEntry(id: string) {
    return donationService.deleteSpendingEntry(id)
  }

  async getSpendingCategories() {
    return donationService.getSpendingCategories()
  }

  async addSpendingCategory(name: string) {
    return donationService.addSpendingCategory(name)
  }

  async renameSpendingCategory(id: string, name: string) {
    return donationService.renameSpendingCategory(id, name)
  }

  async deleteSpendingCategory(id: string) {
    return donationService.deleteSpendingCategory(id)
  }

  async getMemberDonationsByPhone(phone: string): Promise<DonationDetail[]> {
    return donationService.getMemberDonations(phone)
  }

  async getOrders(limit?: number): Promise<Order[]> {
    return logisticsService.getOrders(limit)
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return logisticsService.getOrderById(orderId)
  }

  async getOrderSummary(orderId: string): Promise<Order | null> {
    return logisticsService.getOrderSummary(orderId)
  }

  async getOrderStats(): Promise<OrderStats> {
    return logisticsService.getOrderStats()
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    const success = await logisticsService.updateOrderStatus(orderId, status)
    if (success) {
      await this.logAction('ORDER_UPDATE', `ORDERS/${orderId}`, 'Success', {
        message: `Status updated to ${status}`,
      })
    }
    return success
  }

  async replenishInventory(): Promise<boolean> {
    const success = await logisticsService.replenishInventory()
    if (success) {
      await this.logAction('INVENTORY_REPLENISH', 'STORE/ALL', 'Success')
    }
    return success
  }

  // --- PHASE 6: REGIONAL AUTONOMY & FIELD OPERATIONS ---

  async getFieldEvents(chapterName?: string): Promise<FieldEvent[]> {
    return intelligenceService.getFieldEvents(chapterName)
  }

  async updateFieldEvent(eventId: string, updates: Partial<FieldEvent>): Promise<boolean> {
    const success = await intelligenceService.updateFieldEvent(eventId, updates)
    if (success) {
      await this.logAction('FIELD_EVENT_UPDATE', `EVENTS/${eventId}`, 'Success', updates)
    }
    return success
  }

  async getChapterMobilizationLedger(chapterName?: string): Promise<MobilizationLedger[]> {
    return gamificationService.getMobilizationLedger(chapterName)
  }

  // --- PHASE 7: TACTICAL INTELLIGENCE & FIELD FEEDBACK ---

  async getFieldDirectives(): Promise<FieldDirective[]> {
    return intelligenceService.getFieldDirectives()
  }

  async createFieldDirective(directive: Omit<FieldDirective, 'id' | 'status'>): Promise<boolean> {
    return intelligenceService.createFieldDirective(directive)
  }

  async getFieldReports(directiveId?: string): Promise<FieldReport[]> {
    return intelligenceService.getFieldReports(directiveId)
  }

  async verifyFieldReport(reportId: string, status: FieldReport['status']): Promise<boolean> {
    return intelligenceService.verifyFieldReport(reportId, status)
  }

  // --- PHASE 8: GAMIFICATION & REGIONAL POWER ---

  async getAchievements(): Promise<Achievement[]> {
    return gamificationService.getAchievements()
  }

  async getRegionalLeaderboard(): Promise<ChapterLeaderboard[]> {
    return chapterService.getRegionalLeaderboard()
  }

  async getMemberAchievements(userId: string): Promise<Achievement[]> {
    return gamificationService.getMemberAchievements(userId)
  }

  async getMemberPoints(userId: string): Promise<number> {
    return gamificationService.getMemberPoints(userId)
  }

  async getLogisticsVelocity(): Promise<LogisticsVelocity[]> {
    return logisticsService.getLogisticsVelocity()
  }

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    return logisticsService.getInventoryAlerts()
  }

  async getLogisticsAudit(limit?: number): Promise<LogisticsAuditEntry[]> {
    return logisticsService.getLogisticsAudit(limit)
  }

  async getActiveRoutes(): Promise<{ region: string; count: number }[]> {
    return logisticsService.getActiveRoutes()
  }

  async getRegionalInventory(): Promise<{ region: string; total_stock: number }[]> {
    return logisticsService.getRegionalInventory()
  }

  async getFieldActions(): Promise<FieldAction[]> {
    return intelligenceService.getFieldActions()
  }

  async getFieldActionAttendance(actionId: string): Promise<RallyAttendance[]> {
    return intelligenceService.getFieldActionAttendance(actionId)
  }

  async createFieldAction(action: Partial<FieldAction>): Promise<boolean> {
    return intelligenceService.createFieldAction(action)
  }

  async verifyRallyAttendance(attendanceId: string): Promise<boolean> {
    return intelligenceService.verifyRallyAttendance(attendanceId)
  }

  // --- Phase 12: National Sentiment Analysis & Predictive Polling ---

  async getMemberFeedback(): Promise<MemberFeedback[]> {
    return intelligenceService.getMemberFeedback()
  }

  async getSentimentIntelligence(): Promise<SentimentIntelligence[]> {
    return intelligenceService.getSentimentIntelligence()
  }

  async getImpactProjections(): Promise<ImpactProjection[]> {
    return intelligenceService.getImpactProjections()
  }

  async submitMemberFeedback(feedback: Partial<MemberFeedback>): Promise<boolean> {
    return intelligenceService.submitMemberFeedback(feedback)
  }

  // --- Phase 13: The Movement War Room (Real-time Crisis & Rapid Response) ---

  async getRapidResponseDirectives(): Promise<RapidResponseDirective[]> {
    return intelligenceService.getRapidResponseDirectives()
  }

  async createRapidResponseDirective(
    directive: Omit<RapidResponseDirective, 'id' | 'created_at'>
  ): Promise<boolean> {
    const success = await intelligenceService.createRapidResponseDirective(directive)
    if (success) {
      await this.logAction('CREATE_RAPID_DIRECTIVE', `DIRECTIVES/${directive.title}`, 'Success', {
        title: directive.title,
      })
    }
    return success
  }

  async getCrisisIncidents(): Promise<CrisisIncident[]> {
    return intelligenceService.getCrisisIncidents()
  }

  async updateCrisisIncident(id: string, status: CrisisIncident['status']): Promise<boolean> {
    const success = await intelligenceService.updateCrisisIncident(id, status)
    if (success) {
      await this.logAction('INCIDENT_UPDATE', `CRISIS/${id}`, 'Success', { status })
    }
    return success
  }

  async getMediaCounterNarratives(crisisId?: string): Promise<MediaCounterNarrative[]> {
    return intelligenceService.getMediaCounterNarratives(crisisId)
  }

  async updateMediaCounterNarrative(
    id: string,
    status: MediaCounterNarrative['dispatch_status']
  ): Promise<boolean> {
    const success = await intelligenceService.updateMediaCounterNarrative(id, status)
    if (success) {
      await this.logAction('NARRATIVE_UPDATE', `STRIKES/${id}`, 'Success', { status })
    }
    return success
  }

  // --- Phase 14: Constituency Operations (Voter Registration & Turnout) ---

  async getVoterRegistrations(): Promise<VoterRegistration[]> {
    return intelligenceService.getVoterRegistrations()
  }

  async getMembersWithConstituency(): Promise<
    Array<{
      id: string
      full_name: string
      registration_number: string
      constituency: string
      region: string | null
      chapter: string | null
      polling_station_id: string | null
      registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER' | null
    }>
  > {
    const [{ data: members }, { data: voterRows }] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, registration_number, constituency, region, chapter')
        .not('constituency', 'is', null)
        .neq('constituency', '')
        .neq('constituency', 'Constituency pending'),
      supabase
        .from('voter_registrations')
        .select('user_id, polling_station_id, registration_status'),
    ])
    const voterMap: Record<
      string,
      { polling_station_id: string | null; registration_status: string }
    > = {}
    ;(voterRows || []).forEach((v) => {
      voterMap[v.user_id as string] = v as {
        polling_station_id: string | null
        registration_status: string
      }
    })
    return (members || []).map((m) => ({
      id: m.id as string,
      full_name: (m.full_name as string) || 'Unknown',
      registration_number: (m.registration_number as string) || '',
      constituency: m.constituency as string,
      region: (m.region as string | null) || null,
      chapter: (m.chapter as string | null) || null,
      polling_station_id: (voterMap[m.id as string]?.polling_station_id as string | null) ?? null,
      registration_status:
        (voterMap[m.id as string]?.registration_status as
          | 'UNVERIFIED'
          | 'IN_PROGRESS'
          | 'VERIFIED_VOTER'
          | null) ?? null,
    }))
  }

  async getVoterRegistrationsWithMembers(): Promise<
    Array<{
      id: string
      user_id: string
      registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'
      polling_station_id: string | null
      member_name: string
      registration_number: string
      chapter: string | null
      constituency: string | null
      region: string | null
      created_at: string
    }>
  > {
    const { data: rows, error } = await supabase
      .from('voter_registrations')
      .select('id, user_id, registration_status, polling_station_id, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[DATABASE] getVoterRegistrationsWithMembers failed:', error)
      return []
    }
    if (!rows?.length) return []
    const userIds = [...new Set(rows.map((r) => r.user_id as string).filter(Boolean))]
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, registration_number, chapter, constituency, region')
      .in('id', userIds)
    const userMap: Record<
      string,
      {
        full_name: string
        registration_number: string
        chapter: string | null
        constituency: string | null
        region: string | null
      }
    > = {}
    ;(users || []).forEach((u) => {
      userMap[u.id as string] = u as (typeof userMap)[string]
    })
    return rows.map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      registration_status: r.registration_status as 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER',
      polling_station_id: r.polling_station_id as string | null,
      member_name: userMap[r.user_id as string]?.full_name || 'Unknown',
      registration_number: userMap[r.user_id as string]?.registration_number || '',
      chapter: userMap[r.user_id as string]?.chapter || null,
      constituency: userMap[r.user_id as string]?.constituency || null,
      region: userMap[r.user_id as string]?.region || null,
      created_at: r.created_at as string,
    }))
  }

  // --- Field Agents ---

  async getFieldAgents(): Promise<
    Array<{
      id: string
      member_id: string
      member_name: string
      registration_number: string
      constituency: string
      region: string | null
      status: 'active' | 'inactive'
      notes: string | null
      created_at: string
      avatar_url: string | null
    }>
  > {
    const { data: rows, error } = await supabase
      .from('field_agent_assignments')
      .select('id, member_id, constituency, region, status, notes, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[DATABASE] getFieldAgents failed:', error)
      return []
    }
    if (!rows?.length) return []
    const memberIds = rows.map((r) => r.member_id as string)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, registration_number, avatar_url')
      .in('id', memberIds)
    const userMap: Record<
      string,
      { full_name: string; registration_number: string; avatar_url: string | null }
    > = {}
    ;(users || []).forEach((u) => {
      userMap[u.id as string] = u as (typeof userMap)[string]
    })
    return rows.map((r) => ({
      id: r.id as string,
      member_id: r.member_id as string,
      member_name: userMap[r.member_id as string]?.full_name || 'Unknown',
      registration_number: userMap[r.member_id as string]?.registration_number || '',
      avatar_url: userMap[r.member_id as string]?.avatar_url || null,
      constituency: r.constituency as string,
      region: (r.region as string | null) || null,
      status: r.status as 'active' | 'inactive',
      notes: (r.notes as string | null) || null,
      created_at: r.created_at as string,
    }))
  }

  async appointFieldAgent(
    memberId: string,
    constituency: string,
    region?: string,
    notes?: string
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('field_agent_assignments').upsert(
      {
        member_id: memberId,
        constituency,
        region: region || null,
        status: 'active',
        assigned_by: user?.id || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,constituency' }
    )
    if (error) {
      console.error('[DATABASE] appointFieldAgent failed:', error)
      return false
    }
    return true
  }

  async removeFieldAgent(assignmentId: string): Promise<boolean> {
    const { error } = await supabase.from('field_agent_assignments').delete().eq('id', assignmentId)
    if (error) {
      console.error('[DATABASE] removeFieldAgent failed:', error)
      return false
    }
    return true
  }

  async getFieldAgentStats(agentId: string): Promise<{
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }> {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - now.getDay()
    ).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { count: total } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('registered_by', agentId)
    const { count: today } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('registered_by', agentId)
      .gte('joined_at', todayStart)
    const { count: thisWeek } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('registered_by', agentId)
      .gte('joined_at', weekStart)
    const { count: thisMonth } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('registered_by', agentId)
      .gte('joined_at', monthStart)

    return {
      total: total ?? 0,
      today: today ?? 0,
      thisWeek: thisWeek ?? 0,
      thisMonth: thisMonth ?? 0,
    }
  }

  async getFieldAgentLeaderboard(): Promise<
    Array<{ agentId: string; agentName: string; avatarUrl: string | null; count: number }>
  > {
    const { data, error } = await supabase
      .from('users')
      .select('registered_by')
      .not('registered_by', 'is', null)
    if (error || !data) return []

    const counts: Record<string, number> = {}
    for (const row of data) {
      const id = row.registered_by as string
      counts[id] = (counts[id] ?? 0) + 1
    }

    const agentIds = Object.keys(counts)
    if (agentIds.length === 0) return []

    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', agentIds)

    const profileMap: Record<string, { name: string; avatar: string | null }> = {}
    for (const p of profiles ?? []) {
      profileMap[p.id as string] = {
        name: (p.full_name as string) || 'Unknown',
        avatar: (p.avatar_url as string | null) || null,
      }
    }

    return agentIds
      .map((id) => ({
        agentId: id,
        agentName: profileMap[id]?.name ?? 'Unknown',
        avatarUrl: profileMap[id]?.avatar ?? null,
        count: counts[id],
      }))
      .sort((a, b) => b.count - a.count)
  }

  // --- Polling Station Agents ---

  async getPollingStationAgents(): Promise<
    Array<{
      id: string
      member_id: string
      member_name: string
      registration_number: string
      polling_station_id: string
      constituency: string | null
      region: string | null
      status: 'assigned' | 'confirmed' | 'deployed' | 'stood_down'
      notes: string | null
      created_at: string
    }>
  > {
    const { data: rows, error } = await supabase
      .from('polling_station_agents')
      .select('id, member_id, polling_station_id, constituency, region, status, notes, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[DATABASE] getPollingStationAgents failed:', error)
      return []
    }
    if (!rows?.length) return []
    const memberIds = rows.map((r) => r.member_id as string)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, registration_number')
      .in('id', memberIds)
    const userMap: Record<string, { full_name: string; registration_number: string }> = {}
    ;(users || []).forEach((u) => {
      userMap[u.id as string] = u as (typeof userMap)[string]
    })
    return rows.map((r) => ({
      id: r.id as string,
      member_id: r.member_id as string,
      member_name: userMap[r.member_id as string]?.full_name || 'Unknown',
      registration_number: userMap[r.member_id as string]?.registration_number || '',
      polling_station_id: r.polling_station_id as string,
      constituency: (r.constituency as string | null) || null,
      region: (r.region as string | null) || null,
      status: r.status as 'assigned' | 'confirmed' | 'deployed' | 'stood_down',
      notes: (r.notes as string | null) || null,
      created_at: r.created_at as string,
    }))
  }

  async appointPollingStationAgent(
    memberId: string,
    pollingStationId: string,
    constituency?: string,
    region?: string
  ): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { error } = await supabase.from('polling_station_agents').upsert(
      {
        member_id: memberId,
        polling_station_id: pollingStationId,
        constituency: constituency || null,
        region: region || null,
        status: 'assigned',
        assigned_by: user?.id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,polling_station_id' }
    )
    if (error) {
      console.error('[DATABASE] appointPollingStationAgent failed:', error)
      return false
    }
    return true
  }

  async updatePollingStationAgentStatus(
    agentId: string,
    status: 'assigned' | 'confirmed' | 'deployed' | 'stood_down'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('polling_station_agents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', agentId)
    if (error) {
      console.error('[DATABASE] updatePollingStationAgentStatus failed:', error)
      return false
    }
    return true
  }

  async removePollingStationAgent(agentId: string): Promise<boolean> {
    const { error } = await supabase.from('polling_station_agents').delete().eq('id', agentId)
    if (error) {
      console.error('[DATABASE] removePollingStationAgent failed:', error)
      return false
    }
    return true
  }

  async getMyVoterRegistration(): Promise<VoterRegistration | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('voter_registrations')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    return (data as VoterRegistration) || null
  }

  async submitVoterRegistration(pollingStationCode: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false
    const { data: existing } = await supabase
      .from('voter_registrations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const payload = {
      polling_station_id: pollingStationCode.trim().toUpperCase(),
      registration_status: 'IN_PROGRESS',
    }
    if (existing) {
      const { error } = await supabase
        .from('voter_registrations')
        .update(payload)
        .eq('id', existing.id)
      return !error
    }
    const { error } = await supabase
      .from('voter_registrations')
      .insert({ user_id: user.id, ...payload })
    return !error
  }

  async getPollingStations(
    region: string,
    constituency: string,
    search?: string
  ): Promise<{ code: string; name: string; constituency: string }[]> {
    if (!search?.trim() && !region) return []
    let query = supabase.from('polling_stations').select('code, name, constituency').limit(25)
    // Region is reliable (all 16 match exactly after normalization)
    if (region) query = query.ilike('region', region)
    // Constituency as secondary filter — ilike handles case differences
    if (constituency) query = query.ilike('constituency', constituency)
    if (search?.trim()) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }
    const { data, error } = await query.order('name', { ascending: true })
    if (error) {
      console.error('[DATABASE] getPollingStations failed:', error)
      return []
    }
    // If constituency filter returned nothing, retry with region only
    if ((data || []).length === 0 && constituency && search?.trim()) {
      const q2 = supabase
        .from('polling_stations')
        .select('code, name, constituency')
        .ilike('region', region)
        .or(`code.ilike.%${search}%,name.ilike.%${search}%`)
        .limit(25)
        .order('name', { ascending: true })
      const { data: d2 } = await q2
      return (d2 || []) as { code: string; name: string; constituency: string }[]
    }
    return (data || []) as { code: string; name: string; constituency: string }[]
  }

  async getPollingStationsPaginated(
    page: number,
    pageSize: number,
    region?: string,
    constituency?: string,
    search?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<{
    data: {
      code: string
      name: string
      community: string
      constituency: string
      region: string
      member_count: number
    }[]
    totalCount: number
  }> {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('polling_stations')
      .select('code, name, community, constituency, region', { count: 'exact' })

    if (region) query = query.eq('region', region)
    if (constituency) query = query.eq('constituency', constituency)
    if (search?.trim()) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,community.ilike.%${search}%`)
    }

    if (sortOrder) {
      query = query.order('name', { ascending: sortOrder === 'asc' })
    } else {
      query = query
        .order('region', { ascending: true })
        .order('constituency', { ascending: true })
        .order('community', { ascending: true })
    }

    const { data, count, error } = await query.range(from, to)

    if (error) {
      console.error('[DATABASE] getPollingStationsPaginated failed:', error)
      return { data: [], totalCount: 0 }
    }

    const codes = (data || []).map((s) => s.code)
    const { data: regRows } =
      codes.length > 0
        ? await supabase
            .from('voter_registrations')
            .select('polling_station_id')
            .in('polling_station_id', codes)
        : { data: [] }

    const countMap: Record<string, number> = {}
    ;(regRows || []).forEach((r) => {
      const id = r.polling_station_id as string
      countMap[id] = (countMap[id] || 0) + 1
    })

    return {
      data: (data || []).map((s) => ({
        code: s.code as string,
        name: s.name as string,
        community: s.community as string,
        constituency: s.constituency as string,
        region: s.region as string,
        member_count: countMap[s.code as string] || 0,
      })),
      totalCount: count || 0,
    }
  }

  async getPollingStationStats(): Promise<{
    total: number
    regions: number
    constituencies: number
    withMembers: number
  }> {
    const [statsRes, membersRes] = await Promise.all([
      supabase.from('polling_stations').select('region, constituency', { count: 'exact' }),
      supabase
        .from('voter_registrations')
        .select('polling_station_id')
        .not('polling_station_id', 'is', null),
    ])
    const total = statsRes.count || 0
    const regions = new Set((statsRes.data || []).map((r) => r.region)).size
    const constituencies = new Set((statsRes.data || []).map((r) => r.constituency)).size
    const withMembers = new Set((membersRes.data || []).map((r) => r.polling_station_id)).size
    return { total, regions, constituencies, withMembers }
  }

  async getCanvassingCampaigns(): Promise<CanvassingCampaign[]> {
    return intelligenceService.getCanvassingCampaigns()
  }

  async getCanvasserLogs(campaignId?: string): Promise<CanvasserLog[]> {
    return intelligenceService.getCanvasserLogs(campaignId)
  }

  async getGOTVTransportRequests(): Promise<GOTVTransportRequest[]> {
    return intelligenceService.getGOTVTransportRequests()
  }

  async updateTransportRequest(
    requestId: string,
    status: GOTVTransportRequest['status']
  ): Promise<boolean> {
    const success = await intelligenceService.updateTransportRequest(requestId, status)
    if (success) {
      await this.logAction('TRANSPORT_UPDATE', `TRANSPORT/${requestId}`, 'Success', { status })
    }
    return success
  }

  async getGhanaRegions(): Promise<{ id: string; name: string }[]> {
    return intelligenceService.getGhanaRegions()
  }

  async getGhanaConstituencies(
    regionId?: string
  ): Promise<{ id: string; region_id: string; name: string }[]> {
    return intelligenceService.getGhanaConstituencies(regionId)
  }

  async createCanvassingCampaign(campaign: Partial<CanvassingCampaign>): Promise<boolean> {
    const success = await intelligenceService.createCanvassingCampaign(campaign)
    if (success) {
      await this.logAction('CREATE_CAMPAIGN', `CAMPAIGNS/${campaign.title}`, 'Success', {
        title: campaign.title,
      })
    }
    return success
  }

  // --- Phase 15: Public Engagement & Communication (Standardization) ---

  async subscribeToNewsletter(email: string, phone?: string): Promise<boolean> {
    try {
      const normalizedPhone = phone?.trim() || null
      const normalizedEmail = email.trim().toLowerCase()
      const { data: subscriber, error } = await supabase
        .from('newsletter_subscribers')
        .upsert(
          { email: normalizedEmail, phone_number: normalizedPhone, status: 'Active' },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select('id, email, phone_number, created_at')
        .single()

      if (error && error.code === '42501') {
        const { data: insertedSubscriber, error: insertError } = await supabase
          .from('newsletter_subscribers')
          .insert({ email: normalizedEmail, phone_number: normalizedPhone, status: 'Active' })
          .select('id, email, phone_number, created_at')
          .single()
        if (insertError && insertError.code === '23505') return true
        if (insertError) throw insertError
        discordService.newsletterSubscription(normalizedEmail)
        supabase.functions
          .invoke('newsletter-subscribe-autoreply', {
            body: {
              email: normalizedEmail,
              phone: normalizedPhone,
              subscriberId: insertedSubscriber?.id,
            },
          })
          .catch((invokeError) => {
            console.warn('[NEWSLETTER] Subscription auto-reply failed:', invokeError)
          })
        return true
      } else if (error) {
        throw error
      }
      discordService.newsletterSubscription(normalizedEmail)
      supabase.functions
        .invoke('newsletter-subscribe-autoreply', {
          body: {
            email: normalizedEmail,
            phone: normalizedPhone,
            subscriberId: subscriber?.id,
          },
        })
        .catch((invokeError) => {
          console.warn('[NEWSLETTER] Subscription auto-reply failed:', invokeError)
        })
      return true
    } catch (error) {
      console.error('[DATABASE] Newsletter subscription failed:', error)
      return false
    }
  }

  async checkIsSubscribed(email: string): Promise<boolean> {
    try {
      // 1. Check newsletter_subscribers table
      const { data: subData, error: subError } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (subError) throw subError
      if (subData) return true

      // 2. Check users table for registered members who haven't opted out
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('newsletter_opt_out', false)
        .is('deleted_at', null)
        .maybeSingle()

      if (userError) throw userError
      return !!userData
    } catch (error) {
      console.error('[DATABASE] Check newsletter subscription failed:', error)
      return false
    }
  }

  async submitContactForm(submission: {
    name: string
    email: string
    subject?: string
    message: string
    metadata?: unknown
  }): Promise<boolean> {
    try {
      const { error } = await supabase.from('contact_submissions').insert([submission])

      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Contact submission failed:', error)
      return false
    }
  }

  async getSiteSettings(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase.from('site_settings').select('key, value')

      if (error) throw error

      return (data || []).reduce(
        (acc, curr) => ({
          ...acc,
          [curr.key]: curr.value,
        }),
        {}
      )
    } catch (error) {
      console.error('[DATABASE] Failed to fetch site settings:', error)
      return {}
    }
  }

  async updateSiteSetting(key: string, value: unknown): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Failed to update site setting:', error)
      return false
    }
  }

  subscribeToSiteSettings(callback: () => void) {
    const channel = supabase
      .channel('public:site_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        console.warn('[BRANDING] Realtime update detected')
        callback()
      })
      .subscribe()

    return channel
  }

  unsubscribeFromChannel(channel: RealtimeChannel) {
    supabase.removeChannel(channel)
  }

  async getDiasporaChapters(): Promise<{ id: string; name: string; country: string }[]> {
    const { data, error } = await supabase
      .from('chapters')
      .select('id, name, country')
      .neq('country', 'Ghana')
      .order('name', { ascending: true })

    if (error) {
      console.error('[ADMIN SERVICE] Failed to fetch diaspora chapters:', error)
      return []
    }
    return data || []
  }

  // --- Global Command Search ---
  async globalSearch(query: string): Promise<GlobalSearchResult[]> {
    if (!query || query.length < 2) return []

    try {
      const [members, blogPosts, chapters, products, authors] = await Promise.all([
        this.searchMembers(query),
        supabase
          .from('blog_posts')
          .select('id, title, slug')
          .ilike('title', `%${query}%`)
          .is('deleted_at', null)
          .limit(5),
        supabase.from('chapters').select('id, name').ilike('name', `%${query}%`).limit(5),
        supabase
          .from('store_inventory')
          .select('id, name, slug')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('authors')
          .select('id, name, role')
          .ilike('name', `%${query}%`)
          .is('deleted_at', null)
          .limit(5),
      ])

      const results: GlobalSearchResult[] = []

      // Map members
      members.forEach((m) => {
        results.push({
          type: 'Member',
          title: m.name,
          subtitle: `${m.id} · ${m.region}`,
          id: m.id,
          to: `/admin/members?search=${m.id}`,
        })
      })

      // Map blog posts
      blogPosts.data?.forEach((p) => {
        results.push({
          type: 'Article',
          title: p.title,
          subtitle: 'Editorial Update',
          id: p.id,
          to: `/admin/blogs?edit=${p.id}`,
        })
      })

      // Map chapters
      chapters.data?.forEach((c) => {
        results.push({
          type: 'Chapter',
          title: c.name,
          subtitle: 'Regional Mobilization Hub',
          id: c.id,
          to: `/admin/chapters?id=${c.id}`,
        })
      })

      // Map products
      products.data?.forEach((p) => {
        results.push({
          type: 'Product',
          title: p.name,
          subtitle: 'Movement Supply',
          id: p.id,
          to: `/admin/store?id=${p.id}`,
        })
      })

      // Map authors
      authors.data?.forEach((a) => {
        results.push({
          type: 'Author',
          title: a.name,
          subtitle: a.role || 'Contributor',
          id: a.id,
          to: `/admin/authors?view=${a.id}`,
        })
      })

      return results.slice(0, 10)
    } catch (error) {
      console.error('[ADMIN SERVICE] Global search failed:', error)
      return []
    }
  }

  async getNationalId(regNo: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('admin_get_national_id', {
      p_reg_no: regNo,
    })
    if (error) {
      console.error('[adminService] getNationalId failed:', error)
      return null
    }
    return data as string | null
  }

  async getMemberVoterRegistration(authId: string): Promise<VoterRegistration | null> {
    const { data } = await supabase
      .from('voter_registrations')
      .select('*')
      .eq('user_id', authId)
      .maybeSingle()
    return (data as VoterRegistration) || null
  }

  async setMemberPollingStation(authId: string, code: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('voter_registrations')
      .select('id')
      .eq('user_id', authId)
      .maybeSingle()
    const payload = {
      polling_station_id: code.trim().toUpperCase(),
      registration_status: 'VERIFIED_VOTER',
    }
    if (existing) {
      const { error } = await supabase
        .from('voter_registrations')
        .update(payload)
        .eq('id', existing.id)
      return !error
    }
    const { error } = await supabase
      .from('voter_registrations')
      .insert({ user_id: authId, ...payload })
    return !error
  }

  // ── Password Reset Audit Log ──────────────────────────────────────────────

  async getPasswordResets(): Promise<PasswordResetRecord[]> {
    const { data, error } = await supabase
      .from('password_reset_otps')
      .select('id, phone, expires_at, used, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) throw error
    return (data ?? []) as PasswordResetRecord[]
  }
}

export const adminService = AdminService.getInstance()
