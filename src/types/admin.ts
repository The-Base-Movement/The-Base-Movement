export interface Member {
  id: string
  authId?: string
  name: string
  email: string
  phone: string
  region: string
  constituency: string
  status: 'Active' | 'Pending' | 'Suspended' | 'In Review' | 'Approved'
  joined: string
  platform: 'GHANA' | 'DIASPORA'
  type: 'Standard' | 'Premium'
  avatarUrl?: string
  gender?: string
  ageRange?: string
  chapter?: string
  country?: string
  profession?: string
  city?: string
  residentialAddress?: string
  jobIndustryId?: number | null
  jobSubCategoryId?: number | null
  jobRoleId?: number | null
  jobCustomTitle?: string | null
  emergencyName?: string
  emergencyRelationship?: string
  emergencyPhone?: string
  registrationSource?: 'digital' | 'scan' | 'admin'
  deletedAt?: string
}

export interface User {
  id: string
  full_name: string
  email: string | null
  registration_number: string
  platform: string
  country: string
  phone_number: string
  gender: string
  avatar_url: string | null
  age_range: string
  residential_address: string
  region: string
  constituency: string
  chapter: string
  profession: string
  education_level: string
  emergency_name: string
  emergency_relationship: string
  emergency_phone: string
  national_id?: string
  children_count?: number
  referred_by?: string
  joined_at: string
  status: string
  verification_status?: string
  city?: string
  registration_source?: string
}

export interface Region {
  id: number
  name: string
  constituencies: string[]
}

export interface ChapterLeader {
  id: string
  name: string
  role: string
  imageUrl?: string
}

export interface ChapterActivity {
  id: string
  title: string
  description?: string
  type: string
  activityDate: string
}

export interface Chapter {
  id: string
  name: string
  region?: string
  city_or_region: string
  country: string
  leader_name: string
  leader_id?: string
  member_count: number
  status: 'Active' | 'Pending' | 'Closed' | 'Member' | 'Join Chapter' | string
  image_url?: string
  flag_url?: string
  description?: string
  details_url?: string
  meeting_schedule?: string
  local_focus?: string
  email?: string
  phone_number?: string
  leader_avatar_url?: string
  leadership?: ChapterLeader[]
  activities?: ChapterActivity[]
  latitude?: number
  longitude?: number
}

export interface PollOption {
  id: string
  label: string
  votes: number
}

export interface Author {
  id: string
  name: string
  slug: string
  role?: string
  bio?: string
  imageUrl?: string
  memberId?: string | null
  createdAt: string
  deletedAt?: string | null
}

export interface MediaAsset {
  id: string
  filename: string
  url: string
  folder: string
  size_bytes: number
  mime_type: string
  created_at: string
  deleted_at?: string | null
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

export interface DBInventoryItem {
  id: string
  name: string
  category: string
  price_ghs: number
  stock_quantity: number
  status: 'Stable' | 'Low Stock' | 'Critical' | 'Processing'
  image_emoji: string
  brand_color: string
  image_url?: string
  description?: string
  long_description?: string
  product_images?: { url: string }[]
  deleted_at?: string | null
  sizes?: string[]
  colors?: string[]
  customization_allowed?: boolean
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  price: string
  stock: number
  status: 'Stable' | 'Low Stock' | 'Critical' | 'Processing'
  image: string
  images?: string[]
  color: string
  description?: string
  longDescription?: string
  deletedAt?: string | null
  sizes?: string[]
  colors?: string[]
  customization_allowed?: boolean
}

export interface DonationCampaign {
  id: string
  title: string
  description: string
  targetAmount: number
  raisedAmount: number
  endDate: string
  status: 'Active' | 'Closed'
  imageUrl?: string
}

export interface DonationRecord {
  id: string
  date: string
  amount: string
  method: string
  status: 'Pending' | 'Verified' | 'Rejected'
  reference: string
  campaignTitle?: string
}

export interface DonationDetail extends DonationRecord {
  fullName: string
  phone: string
  country: string
  receiptUrl?: string
  campaignId: string
  memberId?: string
  avatarUrl?: string
  verificationNotes?: string
}

export interface FieldEvent {
  id: string
  title: string
  date: string
  location: string
  chapter: string
  status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled'
  attendees_expected: number
  attendees_actual?: number
  budget_allocated: number
  budget_spent: number
  type: 'Rally' | 'Town Hall' | 'Recruitment' | 'Training'
}

export interface MobilizationLedger {
  id: string
  chapter: string
  transaction_type: 'Allocation' | 'Expenditure'
  amount: number
  description: string
  timestamp: string
  category: 'Logistics' | 'Media' | 'Venues' | 'Transport' | 'Other'
}

export interface RegionalStat {
  region: string
  memberCount: number
  chapters: number
  activePolls: number
  performance: 'High' | 'Medium' | 'Low'
  color: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  target_date: string
  status: 'Completed' | 'In Progress' | 'Upcoming'
  category: string
  importance_level: 'Normal' | 'High' | 'Critical'
  target_members?: number
  forecasted_date?: string
}

export interface FieldDirective {
  id: string
  title: string
  description: string
  target_type: 'Global' | 'Regional' | 'Chapter' | 'Individual'
  target_id?: string
  priority: 'Low' | 'Normal' | 'High' | 'Urgent'
  deadline?: string
  points_awarded: number
  status: 'Active' | 'Suspended' | 'Completed' | 'Expired'
}

export interface FieldReport {
  id: string
  directive_id: string
  member_id: string
  report_text?: string
  media_url?: string
  location_lat?: number
  location_lng?: number
  status: 'Pending' | 'Verified' | 'Rejected'
  points_applied: boolean
  created_at: string
  users?: { full_name: string; avatar_url: string | null } | null
}

export interface ChapterApplication {
  id: string
  applicant_id: string
  applicant_name?: string
  avatar_url?: string | null
  proposed_chapter_name: string
  region: string
  constituency: string
  experience_summary: string
  vision_statement: string
  status: 'Pending' | 'Approved' | 'Rejected'
  created_at: string
}

export interface Achievement {
  id: string
  name: string
  icon: string
  description: string
  points_awarded: number
  category: string
  points_required: number
}

export interface LogisticsVelocity {
  region: string
  total_orders: number
  avg_dispatch_hours: number
  avg_delivery_hours: number
  fulfillment_rate: number
}

export interface InventoryAlert {
  id: string
  name: string
  stock_quantity: number
  low_stock_threshold: number
  category: string
}

export interface MemberFeedback {
  id: string
  user_id: string
  feedback_text: string
  category: string
  sentiment_score: number
  sentiment_label: 'Positive' | 'Negative' | 'Neutral'
  region: string
  constituency: string
  created_at: string
}

export interface SentimentIntelligence {
  id: string
  region: string
  avg_sentiment: number
  positive_count: number
  negative_count: number
  neutral_count: number
  total_responses: number
  last_updated: string
}

export interface ImpactProjection {
  id: string
  region: string
  current_reach: number
  projected_reach_30d: number
  confidence_score: number
  mobilization_velocity: number
  potential_election_impact: number
  last_updated: string
}

export interface RapidResponseDirective {
  id: string
  title: string
  description: string
  priority: 'CRITICAL' | 'HIGH' | 'ELEVATED'
  target_region: string
  action_type: 'FLASH_RALLY' | 'DIGITAL_STRIKE' | 'SUPPLY_RUN' | 'FIELD_SURVEY'
  status: 'ACTIVE' | 'STANDBY' | 'RESOLVED'
  created_by: string
  expires_at: string | null
  created_at: string
}

export interface CrisisIncident {
  id: string
  incident_type: 'PR_ATTACK' | 'LOGISTICAL_FAILURE' | 'PROTEST'
  severity: 'LOW' | 'MODERATE' | 'SEVERE' | 'DEFCON1'
  region: string
  description: string
  status: 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED'
  assigned_commander: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export interface MediaCounterNarrative {
  id: string
  crisis_id: string
  target_platform: 'TWITTER' | 'FACEBOOK' | 'RADIO' | 'TV'
  approved_messaging: string
  hashtags: string | null
  dispatch_status: 'PENDING' | 'DEPLOYED'
  deployment_time: string | null
  created_at: string
}

export interface VoterRegistration {
  id: string
  user_id: string
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'
  polling_station_id: string | null
  verification_document_url: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
}

export interface CanvassingCampaign {
  id: string
  title: string
  description: string
  target_constituency: string
  target_wards: string[]
  start_date: string
  end_date: string
  goal_contacts: number
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  commander_id: string | null
  created_at: string
}

export interface CanvasserLog {
  id: string
  campaign_id: string
  canvasser_id: string
  location_lat: number | null
  location_lng: number | null
  address_notes: string | null
  contact_name: string | null
  interaction_result: 'STRONG_SUPPORT' | 'LEANING' | 'UNDECIDED' | 'HOSTILE' | 'NOT_HOME'
  key_issues: string[] | null
  needs_follow_up: boolean
  created_at: string
}

export interface GOTVTransportRequest {
  id: string
  requester_id: string
  pickup_address: string
  polling_station_id: string
  requested_time: string
  passengers: number
  status: 'PENDING' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  assigned_driver_id: string | null
  notes: string | null
  created_at: string
}

export interface FieldAction {
  id: string
  title: string
  description: string
  type: 'Rally' | 'Town Hall' | 'March' | 'Training'
  status: 'Upcoming' | 'Live' | 'Completed' | 'Cancelled'
  location_name: string
  location_lat?: number
  location_lng?: number
  geofence_radius_meters: number
  start_time: string
  end_time?: string
  target_attendance: number
  actual_attendance?: number
  region: string
  constituency: string
  created_at: string
}

export interface RallyAttendance {
  id: string
  action_id: string
  user_id: string
  user_name?: string
  check_in_time: string
  is_verified: boolean
  points_awarded: number
  check_in_lat?: number
  check_in_lng?: number
}

export interface ChapterLeaderboard {
  region: string
  chapter: string
  total_patriots: number
  total_mobilization_points: number
  achievements_unlocked: number
  regional_rank: number
}

export interface LeaderboardEntry {
  name: string
  points: number
  region: string
  rank: number
}

export interface RegionalPulse {
  name: string
  growth: number
  activity: number
  status: 'Ascending' | 'Stable' | 'Descending'
}

export interface MovementPulse {
  nationalGrowth: number
  activeChapters: number
  totalMobilizationPoints: number
  topPerformingRegion: string
  logisticsHealth: number
  regionalPulse: RegionalPulse[]
}

export interface GrowthTrend {
  date: string
  count: number
}

export interface PendingVerification {
  id: string
  name: string
  region: string
  constituency: string
  platform: string
  country: string
  phone: string
  gender: string
  ageRange: string
  profession: string
  educationLevel: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
  submitted: string
  status: 'In Review' | 'Processing' | 'Flagged' | 'Approved' | 'Rejected'
  photoUrl: string | null
  chapter?: string
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

export interface PollStats {
  totalEngagements: string
  activePolls: number
  avgResponseTime: string
  feedbackRate: string
  nationalSentimentScore: number
}

export interface LogisticsLatency {
  region: string
  avgDispatchToDeliveryDays: number
  totalDispatches: number
  efficiency: 'High' | 'Medium' | 'Low'
}

export interface LogisticsAuditEntry {
  id: string
  requestId?: string
  productId: string
  productName?: string
  action: 'DISPATCHED' | 'RETURNED' | 'REPLENISHED' | 'ADJUSTED' | 'RESTOCKED_CANCELLED'
  quantityChange: number
  sourceLocation: string
  destinationLocation?: string
  performedBy: string
  performerName?: string
  notes?: string
  timestamp: string
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

export type AdminRole =
  | 'FOUNDER'
  | 'ORGANIZER'
  | 'EXECUTIVE'
  | 'BOARD_CHAIR'
  | 'BOARD_SECRETARY'
  | 'EXECUTIVE_MEMBER'
  | 'AUDIT_COMPLIANCE_OFFICER'
  | 'LEGAL_OFFICER'
  | 'BOARD_MEMBER'
  | 'BOARD_TREASURER'
  | 'BOARD_ADVISOR'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'ADMIN_L2'
  | 'ICT_DIRECTOR'
  | 'IT_MANAGER'
  | 'SYSTEM_ADMINISTRATOR'
  | 'CYBERSECURITY_OFFICER'
  | 'TECHNICAL_SUPPORT_OFFICER'
  | 'DATABASE_MANAGER'
  | 'WEB_APP_MANAGER'
  | 'DATA_PROTECTION_OFFICER'
  | 'FINANCE_OFFICER'
  | 'SECURITY_DIRECTOR'
  | 'DEPUTY_SECURITY_DIRECTOR'
  | 'INVESTIGATION_OFFICER'
  | 'RISK_THREAT_ANALYST'
  | 'REGIONAL_SECURITY_OFFICER'
  | 'CONSTITUENCY_SECURITY_OFFICER'
  | 'FIELD_INTELLIGENCE_OFFICER'
  | 'NATIONAL_COORDINATOR'
  | 'NATIONAL_SECRETARY'
  | 'NATIONAL_ORGANISER'
  | 'NATIONAL_MEDIA_DIRECTOR'
  | 'NATIONAL_FINANCE_OFFICER'
  | 'NATIONAL_FUNDRAISING_OFFICER'
  | 'NATIONAL_RESEARCH_POLICY_DIRECTOR'
  | 'NATIONAL_WELFARE_OFFICER'
  | 'NATIONAL_DISCIPLINARY_OFFICER'
  | 'NATIONAL_APPOINTMENT_OFFICER'
  | 'NATIONAL_LOGISTICS_OFFICER'
  | 'REGIONAL_DIRECTOR'
  | 'REGIONAL_SECRETARY'
  | 'REGIONAL_ORGANISER'
  | 'REGIONAL_MEDIA_OFFICER'
  | 'REGIONAL_FINANCE_OFFICER'
  | 'REGIONAL_RESEARCH_POLICY_OFFICER'
  | 'REGIONAL_WELFARE_OFFICER'
  | 'REGIONAL_DISCIPLINARY_OFFICER'
  | 'REGIONAL_APPOINTMENT_OFFICER'
  | 'REGIONAL_LOGISTICS_OFFICER'
  | 'REGIONAL_YOUTH_ORGANISER'
  | 'REGIONAL_ICT_OFFICER'
  | 'CONSTITUENCY_LEAD'
  | 'CONSTITUENCY_SECRETARY'
  | 'CONSTITUENCY_DEPUTY'
  | 'CONSTITUENCY_TREASURER'
  | 'CONSTITUENCY_ORGANISER'
  | 'CONSTITUENCY_MEDIA_OFFICER'
  | 'CONSTITUENCY_FINANCE_OFFICER'
  | 'CONSTITUENCY_RESEARCH_POLICY_OFFICER'
  | 'CONSTITUENCY_WELFARE_OFFICER'
  | 'CONSTITUENCY_DISCIPLINARY_OFFICER'
  | 'CONSTITUENCY_APPOINTMENT_OFFICER'
  | 'CONSTITUENCY_LOGISTICS_OFFICER'
  | 'CHIEF_EDITOR'
  | 'SENIOR_EDITOR'
  | 'EDITOR'
  | 'JUNIOR_EDITOR'
  | 'REGIONAL_CORRESPONDENT'
  | 'CHAPTER_LEAD'
  | 'CHAPTER_SECRETARY'
  | 'CHAPTER_TREASURER'
  | 'FIELD_AGENT'
  | 'POLLING_STATION_COORDINATOR'
  | 'POLLING_STATION_AGENT'
  | 'MEMBERSHIP_OFFICER'
  | 'COMMUNICATIONS_OFFICER'
  | 'INTELLIGENCE_ANALYST'
  | 'STORE_MANAGER'
  | 'YOUTH_LEADER'
  | 'MOVEMENT_LEADER'

export interface AdminPermission {
  action:
    | 'VERIFY_MEMBER'
    | 'DELETE_MEMBER'
    | 'MANAGE_CHAPTER'
    | 'MANAGE_POLLS'
    | 'MANAGE_INVENTORY'
    | 'VIEW_AUDIT_LOGS'
    | 'APPOINT_LEAD'
    | 'MANAGE_BLOGS'
    | 'MANAGE_NEWSLETTERS'
    | 'MANAGE_DONATIONS'
    | 'VIEW_FINANCE'
    | 'VIEW_WAR_ROOM'
    | 'VIEW_DEPLOYMENT_METRICS'
    | 'VIEW_CONSTITUENCY_OPS'
    | 'VIEW_POLLING_STATIONS'
    | 'VIEW_MASS_MOBILIZATION'
    | 'VIEW_DIRECTIVES'
    | 'VIEW_DEPLOY_ASSET'
    | 'VIEW_STRATEGIC_FOCUS'
    | 'VIEW_POLLS'
    | 'VIEW_MISSION_PLAN'
    | 'VIEW_ROADMAP'
    | 'VIEW_PARTY_OFFICIALS'
    | 'VIEW_ADMINS'
    | 'VIEW_MEMBER_DIRECTORY'
    | 'SUBMIT_IT_TICKET'
  resource:
    | 'MEMBERS'
    | 'CHAPTERS'
    | 'POLLS'
    | 'STORE'
    | 'SYSTEM'
    | 'BLOGS'
    | 'NEWSLETTERS'
    | 'DONATIONS'
    | 'FINANCE'
    | 'OPERATIONS'
    | 'STRATEGY'
    | 'PARTY'
    | 'ADMINS'
    | 'IT_SUPPORT'
}

export interface AdminPreferences {
  interfaceDensity: 'Comfortable' | 'Compact' | 'High Density'
  darkMode: boolean
  notifications: {
    newRegistrations: boolean
    securityAlerts: boolean
    auditEvents: boolean
    financeRequests: boolean
  }
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  region?: string
  chapter?: string
  permissions: AdminPermission[]
  phone?: string
  avatarUrl?: string
  preferences?: AdminPreferences
}

export interface Broadcast {
  id: string
  sender_id: string
  sender_name?: string
  title: string
  content: string
  channel: 'SMS' | 'Email' | 'Push' | 'In-app'
  target_type: 'ALL' | 'REGION' | 'CONSTITUENCY' | 'DIASPORA'
  target_value?: string
  priority: 'Normal' | 'High' | 'Urgent'
  status: 'Draft' | 'Sent' | 'Cancelled'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  broadcast_id?: string
  title: string
  message: string
  type: 'Info' | 'Alert' | 'Action' | 'Direct Message'
  is_read: boolean
  created_at: string
}

export interface Country {
  id: string | number
  name: string
  dialing_code: string
  is_diaspora: boolean
  flag_url?: string | null
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  authorId: string
  authorName?: string
  authorRole?: string
  authorImage?: string
  authorBio?: string
  category: string
  imageUrl?: string
  readTime: string
  isFeatured: boolean
  publishedAt: string
  status: 'Draft' | 'Pending Verification' | 'Published'
  tags: string[]
  seoTitle?: string
  metaDescription?: string
  deletedAt?: string | null
}

export interface PressRelease {
  id: string
  title: string
  slug: string
  category: string
  excerpt?: string
  content: string
  publishedAt: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  authorId?: string
  imageUrl?: string
  isOfficial: boolean
}

export interface MediaKitAsset {
  id: string
  title: string
  description?: string
  fileUrl: string
  fileType: 'LOGO' | 'GUIDELINE' | 'PHOTO'
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface GlobalSearchResult {
  type: 'Member' | 'Article' | 'Chapter' | 'Broadcast' | 'Product' | 'Author'
  title: string
  subtitle?: string
  id: string
  to: string
}

export interface Order {
  id: string
  user_id: string
  member_id?: string
  full_name: string
  email: string
  phone: string
  address: string
  shipping_address?: string
  city?: string
  region_or_state?: string
  country?: string
  region: string
  constituency: string
  subtotal?: number
  shipping_fee?: number
  total_amount: number
  status: 'Pending' | 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled'
  payment_method: string
  payment_status: 'Unpaid' | 'Paid' | 'Failed' | 'Refunded'
  created_at: string
  updated_at?: string
  dispatched_at?: string
  delivered_at?: string
  cancelled_at?: string
  tracking_number?: string
  notes?: string
  items: OrderItem[]
}

export interface OrderStats {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  dispatchedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  totalRevenue: number
  revenueToday: number
  avgDeliveryDays?: number
}

// Consolidated types managed in primary blocks above
export interface SentimentStat {
  topic: string
  score: number
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  trend: 'Up' | 'Down' | 'Stable'
  color: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name?: string
  quantity: number
  price_at_purchase: number
  created_at: string
}

export interface ResourceRequestItem {
  id: string
  productId: string
  productName?: string
  quantity: number
}

export interface ResourceRequest {
  id: string
  requesterId: string
  requesterName?: string
  region: string
  constituency?: string
  status: 'Pending' | 'Approved' | 'Dispatched' | 'Delivered' | 'Rejected'
  priority: 'Normal' | 'High' | 'Urgent'
  notes?: string
  createdAt: string
  items: ResourceRequestItem[]
}

export interface MemberDonation {
  id: string
  amount: number
  method: string
  ref: string
  date: string
  cleared: boolean
  label: string
}

export interface MemberPollVote {
  id: string
  pollTitle: string
  pollNumber: number
  choice: string
  date: string
}

export interface MemberSession {
  id: string
  device: string
  location: string
  ip: string
  date: string
  current: boolean
}

export interface MemberNote {
  id: string
  author: string
  role: string
  content: string
  date: string
  isSystem: boolean
}

export interface ConstituencyLeader {
  id: string
  constituencyId: number
  memberId?: string
  name: string
  role: 'Secretary' | 'Deputy Secretary' | 'Treasurer'
  imageUrl?: string
  createdAt: string
}

export interface Constituency {
  id: number
  name: string
  regionId: number
  regionName: string
  memberCount: number
  leaderId?: string
  leaderName?: string
  leaderAvatarUrl?: string
  description?: string
  status: string
  meetingSchedule?: string
  localFocus?: string
  email?: string
  phoneNumber?: string
  activities?: ConstituencyActivity[]
  committee?: ConstituencyLeader[]
}

export interface ConstituencyActivity {
  id: string
  title: string
  description?: string
  type: string
  activityDate: string
}

// ─── Leader Messaging ────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  member_id: string | null
  leader_id: string
  scope_type:
    | 'region'
    | 'constituency'
    | 'chapter'
    | 'department'
    | 'group_constituency'
    | 'group_chapter'
  scope_value: string
  status: 'open' | 'closed'
  group_type?: 'constituency' | 'chapter' | null
  group_id?: string | null
  created_at: string
  last_message_at: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_type: 'member' | 'leader'
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export interface ConversationSummary extends Conversation {
  unread_count: number
  last_message_content: string
  member: {
    id: string
    full_name: string
    registration_number: string
    avatar_url: string | null
  } | null
}

export interface ConversationLeaderInfo {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
}
