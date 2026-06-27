import type { AdminPermission } from '@/types/admin'

export const ADMIN_PERMISSION_GROUPS: {
  label: string
  resource: AdminPermission['resource']
  items: { action: AdminPermission['action']; label: string }[]
}[] = [
  {
    label: 'Members',
    resource: 'MEMBERS',
    items: [
      { action: 'VIEW_MEMBER_DIRECTORY', label: 'View member directory (read-only)' },
      { action: 'VERIFY_MEMBER', label: 'Verify / approve members' },
      { action: 'DELETE_MEMBER', label: 'Delete members' },
    ],
  },
  {
    label: 'Chapters',
    resource: 'CHAPTERS',
    items: [
      { action: 'MANAGE_CHAPTER', label: 'Create & manage chapters' },
      { action: 'APPOINT_LEAD', label: 'Appoint chapter leads' },
    ],
  },
  {
    label: 'Polls',
    resource: 'POLLS',
    items: [
      { action: 'VIEW_POLLS', label: 'View polls (read-only)' },
      { action: 'MANAGE_POLLS', label: 'Create & manage polls' },
    ],
  },
  {
    label: 'Store',
    resource: 'STORE',
    items: [{ action: 'MANAGE_INVENTORY', label: 'Manage store inventory' }],
  },
  {
    label: 'Content',
    resource: 'BLOGS',
    items: [
      { action: 'MANAGE_BLOGS', label: 'Write & publish blog posts' },
      { action: 'MANAGE_NEWSLETTERS', label: 'Compose & send newsletters' },
    ],
  },
  {
    label: 'Donations',
    resource: 'DONATIONS',
    items: [{ action: 'MANAGE_DONATIONS', label: 'Review & verify donations' }],
  },
  {
    label: 'System',
    resource: 'SYSTEM',
    items: [{ action: 'VIEW_AUDIT_LOGS', label: 'View audit logs & system data' }],
  },
  {
    label: 'Finance',
    resource: 'FINANCE',
    items: [{ action: 'VIEW_FINANCE', label: 'View all finance pages' }],
  },
  {
    label: 'Operations',
    resource: 'OPERATIONS',
    items: [
      { action: 'VIEW_WAR_ROOM', label: 'View War Room' },
      { action: 'VIEW_DEPLOYMENT_METRICS', label: 'View Deployment Metrics' },
      { action: 'VIEW_CONSTITUENCY_OPS', label: 'View Constituency Operations' },
      { action: 'VIEW_POLLING_STATIONS', label: 'View Polling Stations' },
      { action: 'VIEW_MASS_MOBILIZATION', label: 'View Mass Mobilization' },
      { action: 'VIEW_DIRECTIVES', label: 'View Tactical Directives' },
      { action: 'VIEW_DEPLOY_ASSET', label: 'View Deploy Asset' },
    ],
  },
  {
    label: 'Strategy',
    resource: 'STRATEGY',
    items: [
      { action: 'VIEW_STRATEGIC_FOCUS', label: 'View Strategic Focus' },
      { action: 'VIEW_MISSION_PLAN', label: 'View Mission Plan' },
      { action: 'VIEW_ROADMAP', label: 'View Mission Roadmap' },
    ],
  },
  {
    label: 'Party & Administration',
    resource: 'PARTY',
    items: [{ action: 'VIEW_PARTY_OFFICIALS', label: 'View Party Officials' }],
  },
  {
    label: 'Admins (Read-Only)',
    resource: 'ADMINS',
    items: [{ action: 'VIEW_ADMINS', label: 'View administrator list (read-only)' }],
  },
  {
    label: 'IT Support',
    resource: 'IT_SUPPORT',
    items: [{ action: 'SUBMIT_IT_TICKET', label: 'Submit IT support tickets' }],
  },
]

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = ADMIN_PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => ({ action: item.action, resource: group.resource }))
)

export function hasAdminPermission(
  permissions: AdminPermission[],
  action: string,
  resource: string
) {
  return permissions.some(
    (permission) => permission.action === action && permission.resource === resource
  )
}
