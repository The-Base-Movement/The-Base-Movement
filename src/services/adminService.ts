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
import type { Product } from '@/types/product'
import type { 
  Member, 
  Region, 
  Chapter, 
  Poll, 
  InventoryItem,
  DonationCampaign,
  DonationRecord,
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
  SentimentTelemetry,
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
  AdminUser
} from '@/types/admin'











class AdminService {
  private static instance: AdminService
  private currentUser: AdminUser | null = null

  private constructor() {
    this.currentUser = {
      id: 'USR-001',
      email: 'admin@thebase.gh',
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
    return auditService.logAction(action, resource, status, details)
  }

  // --- Member Operations ---
  
  async getMembers(): Promise<Member[]> {
    return memberService.getMembers()
  }

  async getAdministrators(): Promise<AdminUser[]> {
    return memberService.getAdministrators()
  }

  async getMemberProfile(regNo: string): Promise<Member | null> {
    return memberService.getMemberProfile(regNo)
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

  async getCountries(): Promise<{ name: string; dialing_code: string; is_diaspora: boolean }[]> {
    return memberService.getCountries()
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

  async getDonationCampaigns(status: 'Active' | 'Closed' = 'Active'): Promise<DonationCampaign[]> {
    const { data, error } = await supabase
      .from('donation_campaigns')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

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

  async getMemberDonations(memberPhone: string): Promise<DonationRecord[]> {
    const { data, error } = await supabase
      .from('donations')
      .select('*, donation_campaigns(title)')
      .eq('phone', memberPhone)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[DATABASE] Failed to fetch donation history:', error);
      return [];
    }

    interface DBDonation {
      id: string
      created_at: string
      amount: number
      payment_method: string
      status: 'Pending' | 'Verified' | 'Rejected'
      donation_campaigns: { title: string }
    }

    return (data || []).map((d: DBDonation) => ({
      id: d.id.substring(0, 8).toUpperCase(),
      date: new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: `GHS ${Number(d.amount).toFixed(2)}`,
      method: d.payment_method || 'MoMo',
      status: d.status,
      reference: `#TB-${d.id.substring(0, 4).toUpperCase()}`,
      campaignTitle: d.donation_campaigns?.title
    }));
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

  async getLogisticsAudit(): Promise<LogisticsAuditEntry[]> {
    return logisticsService.getLogisticsAudit()
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

  async getPendingDonations(): Promise<DonationDetail[]> {
    return donationService.getPendingDonations()
  }

  async verifyDonation(donationId: string, status: 'Verified' | 'Rejected', notes: string = ''): Promise<boolean> {
    const success = await donationService.verifyDonation(donationId, status, notes)
    if (success) {
      await this.logAction('DONATION_VERIFY', `DONATIONS/${donationId}`, status === 'Verified' ? 'Success' : 'Warning')
    }
    return success
  }

  async getAdminData(userId: string) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[DATABASE] Error fetching admin data:', error);
      return null;
    }
    return data;
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

  async getRoadmapForecast(): Promise<Milestone[]> {
    const milestones = await tacticalService.getMilestones()
    const growth = await this.getGrowthStats()
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
    const totalMembers = count || 0
    const avgDailyGrowth = Math.max(1, growth.joined_last_7d / 7)

    return milestones.map(m => {
      if (m.status !== 'Completed' && m.target_members && m.target_members > totalMembers) {
        const remaining = m.target_members - totalMembers
        const daysToTarget = Math.ceil(remaining / avgDailyGrowth)
        const forecast = new Date()
        forecast.setDate(forecast.getDate() + daysToTarget)
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

  async getMobilizationLedger(chapterName?: string): Promise<MobilizationLedger[]> {
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

  async getSentimentTelemetry(): Promise<SentimentTelemetry[]> {
    return intelligenceService.getSentimentTelemetry()
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
}

export const adminService = AdminService.getInstance()
