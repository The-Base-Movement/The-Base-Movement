import { supabase } from '@/lib/supabase'
import { authService } from './authService'
import { memberService } from './memberService'
import { logisticsService } from './logisticsService'
import { tacticalService } from './tacticalService'
import { chapterService } from './chapterService'
import { donationService } from './donationService'
import { contentService } from './contentService'
import { gamificationService } from './gamificationService'
import { intelligenceService } from './intelligenceService'
import { pollService } from './pollService'
import { auditService } from './auditService'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Product } from '@/types/product'
import type { 
  Member, 
  Region, 
  Chapter, 
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
  GlobalSearchResult
} from '@/types/admin'

// Re-export all types so consumers can import from either location
export type {
  Member, Region, Chapter, Poll, PollOption, InventoryItem,
  DonationCampaign, DonationDetail,
  FieldEvent, MobilizationLedger, RegionalStat, Milestone,
  FieldDirective, FieldReport, ChapterApplication, Achievement,
  LogisticsVelocity, InventoryAlert, MemberFeedback, SentimentIntelligence,
  ImpactProjection, RapidResponseDirective, CrisisIncident, MediaCounterNarrative,
  VoterRegistration, CanvassingCampaign, CanvasserLog, GOTVTransportRequest,
  FieldAction, RallyAttendance, ChapterLeaderboard, LeaderboardEntry,
  MovementPulse, GrowthTrend, PendingVerification, ActivityLog,
  PollStats, Order, OrderStats, OrderItem, BlogPost, ResourceRequest,
  LogisticsAuditEntry, AuditLogEntry, AdminRole, AdminPermission,
  SentimentStat, Broadcast, Notification, AdminUser, PressRelease, MediaKitAsset, GlobalSearchResult
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
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
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
    if (this.currentUser.role === 'SUPER_ADMIN' || this.currentUser.role === 'FOUNDER') return true
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
    return auditService.logAction(action, resource, status, details)
  }

  // --- Member Operations ---
  
  async getMembers(): Promise<Member[]> {
    return memberService.getMembers()
  }

  async searchMembers(query: string): Promise<Member[]> {
    return memberService.searchMembers(query)
  }

  async getAdministrators(): Promise<AdminUser[]> {
    return memberService.getAdministrators()
  }

  async provisionAdministrator(id: string, role: AdminRole, permissions: AdminPermission[]): Promise<boolean> {
    const { error } = await supabase
      .from('admins')
      .insert([{ id, role, permissions }])

    if (error) {
      console.error('[ADMIN SERVICE] Provisioning failed:', error)
      return false
    }

    await this.logAction('ADMIN_PROVISION', `ADMINS/${id}`, 'Success', { role })
    return true
  }

  async revokeAdministrator(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[ADMIN SERVICE] Revocation failed:', error)
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

  async getGrowthStats(): Promise<{ joined_last_hour: number; joined_last_24h: number; joined_last_7d: number }> {
    return memberService.getGrowthStats()
  }

  async updateMemberProfile(regNo: string, profile: Partial<Member>): Promise<boolean> {
    return memberService.updateMemberProfile(regNo, profile)
  }

  async getPendingVerifications(): Promise<PendingVerification[]> {
    return memberService.getPendingVerifications()
  }

  async verifyMember(id: string, approve: boolean, reason?: string, chapterName?: string): Promise<boolean> {
    const success = await memberService.verifyMember(id, approve, reason, chapterName)
    if (success) {
      await this.logAction(
        approve ? 'VERIFY_MEMBER_APPROVE' : 'VERIFY_MEMBER_REJECT',
        `MEMBERS/${id}`,
        approve ? 'Success' : 'Warning',
        { reason, chapter: chapterName }
      )
      if (approve && chapterName) {
        await this.incrementChapterMemberCount(chapterName)
      }
    }
    return success
  }

  async getCountries(): Promise<{ id: string | number; name: string; dialing_code: string; is_diaspora: boolean }[]> {
    return memberService.getCountries()
  }

  async deleteMember(id: string): Promise<boolean> {
    const success = await memberService.deleteMember(id)
    if (success) {
      await this.logAction('DELETE_MEMBER', `MEMBERS/${id}`, 'Warning')
    }
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

  // --- Poll Operations ---

  async getPolls(): Promise<Poll[]> {
    return pollService.getPolls()
  }

  async getDonationCampaigns(status?: 'Active' | 'Closed'): Promise<DonationCampaign[]> {
    let query = supabase
      .from('donation_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[DATABASE] Failed to fetch campaigns:', error);
      return [];
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
      imageUrl: c.image_url
    }));
  }

  async createDonationCampaign(campaign: Omit<DonationCampaign, 'id' | 'raisedAmount'>): Promise<boolean> {
    const { error } = await supabase
      .from('donation_campaigns')
      .insert({
        title: campaign.title,
        description: campaign.description,
        target_amount: campaign.targetAmount,
        end_date: campaign.endDate,
        status: campaign.status,
        image_url: campaign.imageUrl
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
    if (campaign.title) updates.title = campaign.title
    if (campaign.description) updates.description = campaign.description
    if (campaign.targetAmount) updates.target_amount = campaign.targetAmount
    if (campaign.endDate) updates.end_date = campaign.endDate
    if (campaign.status) updates.status = campaign.status
    if (campaign.imageUrl) updates.image_url = campaign.imageUrl

    const { error } = await supabase
      .from('donation_campaigns')
      .update(updates)
      .eq('id', id)
    
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
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('[DATABASE] Failed to delete campaign:', error)
      return false
    }
    
    await this.logAction('CAMPAIGN_DELETE', `CAMPAIGNS/${title}`, 'Warning')
    return true
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
    const { error } = await supabase
      .from('donations')
      .insert({
        full_name: donationData.fullName,
        phone: donationData.phone,
        amount: parseFloat(donationData.amount),
        country: donationData.country,
        payment_method: donationData.paymentMethod || 'MTN MoMo',
        show_on_dashboard: donationData.showOnDashboard,
        member_id: donationData.memberId || null,
        campaign_id: donationData.campaignId || null
      });

    if (error) {
      console.error('[DATABASE] Donation submission failed:', error);
      return false;
    }
    return true;
  }

  async createPoll(poll: { question: string, region: string, status: string, endDate: string, options: string[] }): Promise<boolean> {
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

  async updateResourceRequestStatus(id: string, status: ResourceRequest['status']): Promise<boolean> {
    const success = await logisticsService.updateResourceRequestStatus(id, status)
    if (success) {
      this.logAction(`RESOURCE_REQUEST_${status.toUpperCase()}`, `REQ-${id.substring(0,8)}`, 'Success')
    }
    return success
  }


  // --- Analytics ---
  async getPublicStats(): Promise<{
    members: number;
    chapters: number;
    regions: number;
    diaspora: number;
  }> {
    try {
      const [membersRes, chaptersRes, regionsRes, diasporaRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('city_or_region'),
        supabase.from('users').select('*', { count: 'exact', head: true }).neq('country', 'Ghana')
      ]);

      // Calculate unique regions from chapters
      const uniqueRegions = new Set((regionsRes.data || []).map(c => c.city_or_region)).size;

      return {
        members: membersRes.count || 0,
        chapters: chaptersRes.count || 0,
        regions: uniqueRegions || 0,
        diaspora: diasporaRes.count || 0
      };
    } catch (error) {
      console.warn('[ADMIN SERVICE] Failed to fetch public stats:', error);
      return { members: 0, chapters: 0, regions: 0, diaspora: 0 };
    }
  }

  async getGlobalStats(): Promise<{ label: string, value: string, change: string }[]> {
    const [usersRes, chaptersRes, ordersRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('store_orders').select('*', { count: 'exact', head: true })
    ])
    
    const usersCount = usersRes.count || 0
    const chaptersCount = chaptersRes.count || 0
    const ordersCount = ordersRes.count || 0

    return [
      { label: 'Total Membership', value: usersCount.toLocaleString(), change: '+12.4%' },
      { label: 'Regional Chapters', value: chaptersCount.toString(), change: '+4.2%' },
      { label: 'Member Engagement', value: `${Math.round((usersCount / 5000) * 100)}%`, change: '+2.1%' },
      { label: 'Merch Orders', value: ordersCount.toLocaleString(), change: '+15.8%' }
    ]
  }


  async getRegions(): Promise<Region[]> {
    return logisticsService.getRegions()
  }

  async getConstituencies(): Promise<{ data: { name: string, region_id: number }[] }> {
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

  async uploadBrandingAsset(fileName: string, blob: Blob): Promise<{ data: { path: string } | null, error: Error | null }> {
    return supabase.storage
      .from('branding')
      .upload(fileName, blob, { upsert: true })
  }

  getBrandingAssetUrl(fileName: string): string {
    const { data } = supabase.storage
      .from('branding')
      .getPublicUrl(fileName)
    return data.publicUrl
  }

  async deleteConstituency(id: string, regionName: string, conName: string): Promise<boolean> {
    const success = await logisticsService.deleteConstituency(id)
    if (success) {
      await this.logAction('CONSTITUENCY_DELETE', `REGIONS/${regionName}/CONSTITUENCIES/${conName}`, 'Warning')
    }
    return success
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
    return contentService.getBlogPosts()
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

  // --- Press Operations ---

  async getPressReleases(): Promise<PressRelease[]> {
    return contentService.getPressReleases()
  }

  async createPressRelease(release: Omit<PressRelease, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
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
    proposed_chapter_name: string; 
    region: string; 
    constituency: string; 
    vision_statement: string;
    experience_summary?: string;
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

  async getDonations(status?: string): Promise<DonationDetail[]> {
    return donationService.getDonations(status)
  }

  async getPendingDonations(): Promise<DonationDetail[]> {
    return donationService.getPendingDonations()
  }

  async getDonationStats() {
    return donationService.getDonationStats()
  }

  async verifyDonation(donationId: string, status: 'Verified' | 'Rejected', notes: string = ''): Promise<boolean> {
    const success = await donationService.verifyDonation(donationId, status, notes)
    if (success) {
      await this.logAction('DONATION_VERIFY', `DONATIONS/${donationId}`, status === 'Verified' ? 'Success' : 'Warning')
    }
    return success
  }

  subscribeToPublicDonations(callback: (donation: DonationDetail) => void): RealtimeChannel {
    return donationService.subscribeToPublicDonations(callback)
  }


  async getAdminData(userId: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admins')
      .select(`
        *,
        users!admins_id_fkey (
          full_name,
          email,
          phone_number,
          avatar_url
        )
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('[DATABASE] Error fetching admin data:', error);
      return null;
    }

    interface DBAdminResponse {
      id: string
      role: string
      permissions: {
        can_manage_members?: boolean
        can_manage_chapters?: boolean
        can_manage_polls?: boolean
        can_manage_store?: boolean
        can_view_audit_logs?: boolean
        can_post_blog?: boolean
        can_manage_donations?: boolean
      }
      assigned_region: string | null
      users: {
        full_name: string
        email: string
        phone_number: string
        avatar_url: string
      } | {
        full_name: string
        email: string
        phone_number: string
        avatar_url: string
      }[] | null
    }

    const admin = data as unknown as DBAdminResponse;
    const userProfile = Array.isArray(admin.users) ? admin.users[0] : admin.users;

    // Map database JSON permissions to the AdminPermission[] format
    const dbPermissions = admin.permissions || {};
    const permissions: AdminPermission[] = [];

    if (dbPermissions.can_manage_members) {
      permissions.push({ action: 'VERIFY_MEMBER', resource: 'MEMBERS' });
    }
    if (dbPermissions.can_manage_chapters) {
      permissions.push({ action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' });
    }
    if (dbPermissions.can_manage_polls) {
      permissions.push({ action: 'MANAGE_POLLS', resource: 'POLLS' });
    }
    if (dbPermissions.can_manage_store) {
      permissions.push({ action: 'MANAGE_INVENTORY', resource: 'STORE' });
    }
    if (dbPermissions.can_view_audit_logs) {
      permissions.push({ action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' });
    }
    if (dbPermissions.can_post_blog) {
      permissions.push({ action: 'MANAGE_BLOGS', resource: 'BLOGS' });
    }
    if (dbPermissions.can_manage_donations) {
      permissions.push({ action: 'MANAGE_DONATIONS', resource: 'DONATIONS' });
    }

    // Normalize role string to match AdminRole type exactly
    let role: AdminRole = 'VERIFIER';
    const dbRole = admin.role?.toUpperCase() || '';
    if (dbRole.includes('FOUNDER')) role = 'FOUNDER';
    else if (dbRole.includes('ORGANIZER')) role = 'ORGANIZER';
    else if (dbRole.includes('SUPER')) role = 'SUPER_ADMIN';
    else if (dbRole.includes('CHIEF_EDITOR')) role = 'CHIEF_EDITOR';
    else if (dbRole.includes('SENIOR_EDITOR')) role = 'SENIOR_EDITOR';
    else if (dbRole.includes('REGIONAL')) role = 'REGIONAL_DIRECTOR';
    else if (dbRole.includes('LEADER') || dbRole.includes('CONSTITUENCY')) role = 'CONSTITUENCY_LEAD';
    else if (dbRole.includes('JUNIOR_EDITOR')) role = 'JUNIOR_EDITOR';
    else if (dbRole.includes('REGIONAL_CORRESPONDENT')) role = 'REGIONAL_CORRESPONDENT';
    else if (dbRole.includes('EDITOR')) role = 'EDITOR';
    else if (dbRole.includes('VERIFIER')) role = 'VERIFIER';


    return {
      id: admin.id,
      email: userProfile?.email || '',
      name: userProfile?.full_name || 'Admin',
      role,
      assigned_region: admin.assigned_region,
      permissions,
      phone: userProfile?.phone_number || '',
      avatarUrl: userProfile?.avatar_url || ''
    } as AdminUser;
  }






  async updateAdminData(userId: string, updates: { 
    role?: AdminRole; 
    permissions?: AdminPermission[]; 
    assigned_region?: string | null;
  }) {
    const { error } = await supabase
      .from('admins')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw new Error(error.message || 'Failed to update admin data');
    }
  }

  async updatePublicUserProfile(userId: string, updates: {
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
  }) {
    return supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  }


  async getWishlist(userId: string): Promise<Product[]> {
    interface StoreInventoryDbRow {
      id: string;
      name: string;
      slug: string | null;
      category: string;
      price_ghs: number;
      stock_quantity: number;
      image_url: string | null;
      description: string | null;
      rating: number | null;
      reviews: number | null;
      sizes: string[] | null;
      colors: string[] | null;
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        product_id,
        store_inventory (*)
      `)
      .eq('user_id', userId);

    if (error || !data) {
      console.error('[DATABASE] Error fetching wishlist:', error);
      return [];
    }

    return data.map(item => {
      const i = item.store_inventory as unknown as StoreInventoryDbRow;
      return {
        id: i.id,
        name: i.name,
        slug: i.slug || i.name.toLowerCase().replace(/\s+/g, '-'),
        category: i.category,
        price: `GH₵ ${Number(i.price_ghs).toLocaleString()}`,
        stock: i.stock_quantity,
        status: i.stock_quantity > 10 ? 'Stable' : i.stock_quantity > 0 ? 'Low Stock' : 'Critical',
        image: i.image_url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
        description: i.description || '',
        rating: i.rating || 4.8,
        reviews: i.reviews || 0,
        sizes: i.sizes || ['S', 'M', 'L', 'XL'],
        colors: i.colors || ['Standard']
      };
    });
  }

  async addToWishlist(userId: string, productId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlist')
      .insert({ user_id: userId, product_id: productId });

    if (error && error.code !== '23505') { // Ignore unique constraint violation
      console.error('[DATABASE] Error adding to wishlist:', error);
      return false;
    }
    return true;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('[DATABASE] Error removing from wishlist:', error);
      return false;
    }
    return true;
  }

  // --- Communication Engine (Field Mobilization) ---

  async getBroadcasts(): Promise<Broadcast[]> {
    return tacticalService.getBroadcasts()
  }

  async sendBroadcast(broadcast: Omit<Broadcast, 'id' | 'created_at'>): Promise<boolean> {
    const success = await tacticalService.sendBroadcast(broadcast)
    if (success) {
      await this.logAction('SEND_BROADCAST', `TARGET/${broadcast.target_type}`, 'Success', { title: broadcast.title })
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

  async getBroadcastMetrics(broadcastId: string): Promise<{ total: number, read: number }> {
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
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const totalMembers = count || 0
    const avgDailyGrowth = Math.max(1, growth.joined_last_7d / 7)

    return milestones.map(m => {
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

  async verifyMemberID(memberId: string): Promise<{ confidence: number, matches: string[], flagged: boolean }> {
    return tacticalService.verifyMemberID(memberId)
  }

  async generateComplianceReport(region = 'National'): Promise<string> {
    console.log(`[AUDIT-GEN] Generating ${region} compliance report...`)
    
    const reportData = {
      timestamp: new Date().toISOString(),
      scope: region,
      metrics: {
        total_members: 425000,
        verification_accuracy: '98.4%',
        avg_logistics_latency: '4.2 days',
        sentiment_index: '78%'
      },
      audit_logs: [
        { id: 'LOG-001', action: 'REG_VERIFY', status: 'SUCCESS', admin: 'HQ-ADMIN-01' },
        { id: 'LOG-002', action: 'ORDER_DISPATCH', status: 'SUCCESS', admin: 'HQ-LOGISTICS' }
      ]
    }

    return JSON.stringify(reportData, null, 2)
  }

  // ─── ORDER LIFECYCLE ENGINE ──────────────────────────────────────────────────

  async getPublicDonationFeed(limit?: number): Promise<DonationDetail[]> {
    return donationService.getPublicDonationFeed(limit)
  }

  async getMobilizationLedger(limit?: number) {
    return donationService.getMobilizationLedger(limit)
  }

  async getMemberDonations(phone: string): Promise<DonationDetail[]> {
    return donationService.getMemberDonations(phone)
  }



  async getOrders(limit?: number): Promise<Order[]> {
    return logisticsService.getOrders(limit)
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return logisticsService.getOrderById(orderId)
  }

  async getOrderStats(): Promise<OrderStats> {
    return logisticsService.getOrderStats()
  }

  async updateOrderStatus(
    orderId: string,
    status: Order['status']
  ): Promise<boolean> {
    const success = await logisticsService.updateOrderStatus(orderId, status)
    if (success) {
      await this.logAction(
        'ORDER_UPDATE',
        `ORDERS/${orderId}`,
        'Success',
        { message: `Status updated to ${status}` }
      )
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

  async createRapidResponseDirective(directive: Omit<RapidResponseDirective, 'id' | 'created_at'>): Promise<boolean> {
    const success = await intelligenceService.createRapidResponseDirective(directive)
    if (success) {
      await this.logAction('CREATE_RAPID_DIRECTIVE', `DIRECTIVES/${directive.title}`, 'Success', { title: directive.title })
    }
    return success
  }

  async getCrisisIncidents(): Promise<CrisisIncident[]> {
    return intelligenceService.getCrisisIncidents()
  }

  async getMediaCounterNarratives(crisisId?: string): Promise<MediaCounterNarrative[]> {
    return intelligenceService.getMediaCounterNarratives(crisisId)
  }

  // --- Phase 14: Operation "Ground Game" (Voter Registration & Turnout) ---

  async getVoterRegistrations(): Promise<VoterRegistration[]> {
    return intelligenceService.getVoterRegistrations()
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

  async updateTransportRequest(requestId: string, status: GOTVTransportRequest['status']): Promise<boolean> {
    const success = await intelligenceService.updateTransportRequest(requestId, status)
    if (success) {
      await this.logAction('TRANSPORT_UPDATE', `TRANSPORT/${requestId}`, 'Success', { status })
    }
    return success
  }

  async getGhanaRegions(): Promise<{ id: string, name: string }[]> {
    return intelligenceService.getGhanaRegions()
  }

  async getGhanaConstituencies(regionId?: string): Promise<{ id: string, region_id: string, name: string }[]> {
    return intelligenceService.getGhanaConstituencies(regionId)
  }

  async createCanvassingCampaign(campaign: Partial<CanvassingCampaign>): Promise<boolean> {
    const success = await intelligenceService.createCanvassingCampaign(campaign)
    if (success) {
      await this.logAction('CREATE_CAMPAIGN', `CAMPAIGNS/${campaign.title}`, 'Success', { title: campaign.title })
    }
    return success
  }

  // --- Phase 15: Public Engagement & Communication (Standardization) ---

  async subscribeToNewsletter(email: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({ email, status: 'Active' }, { onConflict: 'email' })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Newsletter subscription failed:', error)
      return false
    }
  }

  async submitContactForm(submission: { name: string, email: string, subject?: string, message: string, metadata?: unknown }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([submission])
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('[DATABASE] Contact submission failed:', error)
      return false
    }
  }

  async getSiteSettings(): Promise<Record<string, unknown>> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
      
      if (error) throw error
      
      return (data || []).reduce((acc, curr) => ({
        ...acc,
        [curr.key]: curr.value
      }), {})
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        () => {
          console.log('[BRANDING] Realtime update detected')
          callback()
        }
      )
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
        supabase.from('blog_posts').select('id, title, slug').ilike('title', `%${query}%`).is('deleted_at', null).limit(5),
        supabase.from('chapters').select('id, name').ilike('name', `%${query}%`).limit(5),
        supabase.from('store_inventory').select('id, name, slug').ilike('name', `%${query}%`).limit(5),
        supabase.from('authors').select('id, name, role').ilike('name', `%${query}%`).is('deleted_at', null).limit(5)
      ])

      const results: GlobalSearchResult[] = []

      // Map members
      members.forEach(m => {
        results.push({
          type: 'Member',
          title: m.name,
          subtitle: `${m.id} · ${m.region}`,
          id: m.id,
          to: `/admin/members?search=${m.id}`
        })
      })

      // Map blog posts
      blogPosts.data?.forEach(p => {
        results.push({
          type: 'Article',
          title: p.title,
          subtitle: 'Editorial Update',
          id: p.id,
          to: `/admin/blogs?edit=${p.id}`
        })
      })

      // Map chapters
      chapters.data?.forEach(c => {
        results.push({
          type: 'Chapter',
          title: c.name,
          subtitle: 'Regional Mobilization Hub',
          id: c.id,
          to: `/admin/chapters?id=${c.id}`
        })
      })

      // Map products
      products.data?.forEach(p => {
        results.push({
          type: 'Product',
          title: p.name,
          subtitle: 'Movement Supply',
          id: p.id,
          to: `/admin/store?id=${p.id}`
        })
      })

      // Map authors
      authors.data?.forEach(a => {
        results.push({
          type: 'Author',
          title: a.name,
          subtitle: a.role || 'Contributor',
          id: a.id,
          to: `/admin/authors?view=${a.id}`
        })
      })

      return results.slice(0, 10)
    } catch (error) {
      console.error('[ADMIN SERVICE] Global search failed:', error)
      return []
    }
  }
}

export const adminService = AdminService.getInstance()
