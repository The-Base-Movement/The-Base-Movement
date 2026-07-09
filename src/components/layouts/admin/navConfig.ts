/**
 * NavConfig Module
 * -------------------------------------------------------------
 * Holds structural configuration configurations for the administrative sidebar.
 * Defines permission gates, role restrictions, and dynamically embeds real-time alerts counts.
 */

import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog'
import type { AdminPermission, AdminRole } from '@/types/admin'

const GLOBAL_ROLES: AdminRole[] = [
  'SUPER_ADMIN',
  'FOUNDER',
  'ICT_DIRECTOR',
  'IT_MANAGER',
  'SYSTEM_ADMINISTRATOR',
  'ADMIN',
]

/**
 * NavItem
 * -------------------------------------------------------------
 * Represents a single link item configuration in the admin navigation.
 */
export interface NavItem {
  to: string
  icon: string
  label: string
  pill?: string
  superAdminOnly?: boolean
  executiveOnly?: boolean
  /** When set, the item is visible only to these exact roles (overrides other gates). */
  allowedRoles?: string[]
  permission?: {
    action: AdminPermission['action']
    resource: AdminPermission['resource']
  }
  subItems?: NavItem[]
}

const DEPARTMENT_NAV_ITEMS: NavItem[] = DEPARTMENT_CATALOG.map((department) => ({
  to: `/admin/departments/${department.id}`,
  icon: department.icon,
  label: department.name,
  allowedRoles: department.access?.allowedRoles,
  permission: department.access?.permission,
}))

/**
 * getNavGroups
 * -------------------------------------------------------------
 * Dynamic builder yielding navigation groupings grouped under category labels.
 * Injects count badges for live notifications or queues.
 */
export const getNavGroups = (
  pendingVerificationsCount: number,
  pendingDonationsCount: number,
  unreadMessagesCount = 0
): { label: string; icon: string; items: NavItem[] }[] => [
  {
    label: 'Overview',
    icon: 'dashboard',
    items: [
      {
        to: '/admin/executive',
        icon: 'corporate_fare',
        label: 'Executive Dashboard',
        executiveOnly: true,
      },
      { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
      {
        to: '/admin/departments',
        icon: 'apartment',
        label: 'Departments',
        allowedRoles: ['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE'],
      },
      ...DEPARTMENT_NAV_ITEMS,
      { to: '/admin/war-room', icon: 'radio', label: 'War Room', pill: 'LIVE' },
      { to: '/admin/analytics', icon: 'bar_chart', label: 'Analytics' },
      { to: '/admin/logistics-intelligence', icon: 'inventory_2', label: 'Logistics' },
      { to: '/admin/mobilization-metrics', icon: 'my_location', label: 'Deployment metrics' },
      { to: '/admin/sentiment-intelligence', icon: 'psychology', label: 'Sentiment AI' },
      { to: '/admin/ml-intelligence', icon: 'auto_awesome', label: 'ML Intelligence' },
    ],
  },
  {
    label: 'Members',
    icon: 'group',
    items: [
      {
        to: '/admin/members',
        icon: 'group',
        label: 'Member directory',
        permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
      },
      {
        to: '/admin/verification',
        icon: 'verified_user',
        label: 'KYC queue',
        pill: pendingVerificationsCount > 0 ? pendingVerificationsCount.toString() : undefined,
        permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
      },
      {
        to: '/admin/leadership',
        icon: 'shield',
        label: 'Leadership hub',
        permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
      },
      {
        to: '/admin/referral-analytics',
        icon: 'share',
        label: 'Referral analytics',
        permission: { action: 'VIEW_MEMBER_DIRECTORY', resource: 'MEMBERS' },
      },
      {
        to: '/admin/jobs-analytics',
        icon: 'work',
        label: 'Jobs analytics',
        allowedRoles: [
          'ADMIN',
          'SUPER_ADMIN',
          'FOUNDER',
          'IT_MANAGER',
          'MOVEMENT_LEADER',
          'FINANCE_OFFICER',
        ],
      },
      {
        to: '/admin/job-taxonomy',
        icon: 'account_tree',
        label: 'Job taxonomy',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER'],
      },
      {
        to: '/admin/messages',
        icon: 'chat',
        label: 'Messages',
        pill: unreadMessagesCount > 0 ? unreadMessagesCount.toString() : undefined,
        permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
      },
    ],
  },
  {
    label: 'Finance',
    icon: 'account_balance_wallet',
    items: [
      {
        to: '/admin/finance-dashboard',
        icon: 'analytics',
        label: 'Finance dashboard',
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/donations',
        icon: 'payments',
        label: 'Donations',
        pill: pendingDonationsCount > 0 ? pendingDonationsCount.toString() : undefined,
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/spending-ledger',
        icon: 'receipt_long',
        label: 'Expenses',
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/finance-requests',
        icon: 'request_quote',
        label: 'Finance requests',
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/finance-requests/review-inbox',
        icon: 'inbox',
        label: 'Review inbox',
        permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
      },
      {
        to: '/admin/priorities',
        icon: 'shield',
        label: 'Strategic focus',
        allowedRoles: ['FINANCE_OFFICER', 'SUPER_ADMIN'],
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
    ],
  },
  {
    label: 'Logistics',
    icon: 'inventory_2',
    items: [
      {
        to: '/admin/store',
        icon: 'shopping_bag',
        label: 'Store inventory',
        permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
      },
      {
        to: '/admin/orders',
        icon: 'local_shipping',
        label: 'Member orders',
        permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
      },
      {
        to: '/admin/regions',
        icon: 'location_on',
        label: 'Jurisdictions',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
    ],
  },
  {
    label: 'Field',
    icon: 'location_on',
    items: [
      {
        to: '/admin/chapters',
        icon: 'location_on',
        label: 'Chapter management',
        permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
      },
      {
        to: '/admin/constituencies',
        icon: 'map',
        label: 'Constituency management',
        permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
      },
      {
        to: '/admin/chapter-ops',
        icon: 'hub',
        label: 'Chapter operations',
        permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
      },
      {
        to: '/admin/ground-game',
        icon: 'how_to_vote',
        label: 'Constituency Operations',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/polling-stations',
        icon: 'ballot',
        label: 'Polling stations',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/broadcasts',
        icon: 'campaign',
        label: 'Mass mobilization',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/newsletter',
        icon: 'mail',
        label: 'Newsletter',
        permission: { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' },
      },
      {
        to: '/admin/directives',
        icon: 'my_location',
        label: 'Tactical directives',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/deploy',
        icon: 'my_location',
        label: 'Deploy asset',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
    ],
  },
  {
    label: 'Content',
    icon: 'description',
    items: [
      {
        to: '/admin/blogs',
        icon: 'description',
        label: 'Blog posts',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/authors',
        icon: 'edit',
        label: 'Authors',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/media',
        icon: 'image',
        label: 'Media library',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/polls',
        icon: 'how_to_vote',
        label: 'Polls',
        permission: { action: 'MANAGE_POLLS', resource: 'POLLS' },
      },
      {
        to: '/admin/jobs',
        icon: 'work',
        label: 'Jobs Board',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/moderation',
        icon: 'shield_person',
        label: 'Moderation',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/plan-manager',
        icon: 'route',
        label: 'Mission plan',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/media-hub',
        icon: 'newsmode',
        label: 'Media Hub',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
        subItems: [
          { to: '/admin/media-hub', icon: 'dashboard', label: 'The Wall' },
          { to: '/admin/media-hub/assignments', icon: 'assignment', label: 'Assignments' },
        ],
      },
    ],
  },
  {
    label: 'System',
    icon: 'settings',
    items: [
      {
        to: '/admin/administrators',
        icon: 'shield',
        label: 'Administrators',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/roles',
        icon: 'manage_accounts',
        label: 'Roles manager',
        superAdminOnly: true,
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/it-department',
        icon: 'computer',
        // Visible to the same roles the route guard (ITDepartmentLayout) allows,
        // so an IT_MANAGER (incl. the break-glass recovery account) can actually
        // reach the IT pages — especially Leaders Auth to reset device slots.
        allowedRoles: GLOBAL_ROLES,
        label: 'IT Department',
        subItems: [
          { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
          { to: '/admin/it-department/brain', icon: 'neurology', label: 'Brain' },
          { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
          { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
          { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
          { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
          {
            to: '/admin/it-department/security-protocols',
            icon: 'security',
            label: 'Security Protocols',
          },
          { to: '/admin/it-department/system', icon: 'shield', label: 'System' },
          { to: '/admin/password-resets', icon: 'lock_reset', label: 'Password Resets' },
          { to: '/admin/it-department/licenses', icon: 'license', label: 'Licenses' },
          { to: '/admin/it-department/assets', icon: 'inventory_2', label: 'Assets' },
          { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
          {
            to: '/admin/it-department/organizational-structure',
            icon: 'schema',
            label: 'Org Road Map',
          },
          { to: '/admin/it-department/leaders-auth', icon: 'verified_user', label: 'Leaders Auth' },
        ],
      },
      {
        to: '/admin/party-officials',
        icon: 'badge',
        label: 'Party Officials',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/roadmap',
        icon: 'route',
        label: 'Mission roadmap',
        permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
      },
      {
        to: '/admin/settings',
        icon: 'settings',
        label: 'Settings',
      },
      {
        to: '/admin/redirects',
        icon: 'alt_route',
        label: 'Redirects',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
      {
        to: '/admin/trash',
        icon: 'delete',
        label: 'Audit trash',
        permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
      },
    ],
  },
]
