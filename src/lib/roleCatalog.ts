import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

export type RoleParentGroup = 'BOARD' | 'NATIONAL ICT' | 'SECURITY / INTEL' | 'NCC' | 'RCC' | 'CCC'

export type CommitteeLane =
  | 'Operations & Organising'
  | 'Media & Communications'
  | 'Finance & Fundraising'
  | 'Research & Policy'
  | 'Appointment, Discipline & Welfare'

export type RoleScopeType = 'national' | 'region' | 'constituency' | 'polling_station'

export interface RoleCatalogEntry {
  role: AdminRole
  label: string
  parentGroup: RoleParentGroup
  committeeLane?: CommitteeLane
  scopeType: RoleScopeType
  protected: boolean
  requires2fa: boolean
}

export interface RoleResourceScope {
  region_id?: string | null
  region?: string | null
  assigned_region?: string | null
  constituency_id?: string | null
  constituency?: string | null
  assigned_constituency?: string | null
  polling_station_id?: string | null
  pollingStationId?: string | null
  id?: string | null
  scope_type?: RoleScopeType | string | null
  scope_id?: string | null
}

type UserCanInput = AdminUser & {
  isActive?: boolean
  is_active?: boolean
  mfaVerified?: boolean
  mfa_verified?: boolean
  aal?: string | null
  assigned_region?: string | null
  assigned_constituency?: string | null
  assigned_polling_station?: string | null
}

export const ROLE_ALIASES: Partial<Record<string, AdminRole>> = {
  CHAPTER_LEADER: 'CHAPTER_LEAD',
  EXECUTIVE_MEMBER: 'EXECUTIVE',
  NATIONAL_ORGANISER: 'ORGANIZER',
  NATIONAL_MEDIA_DIRECTOR: 'COMMUNICATIONS_OFFICER',
  NATIONAL_FINANCE_OFFICER: 'FINANCE_OFFICER',
}

const ops: CommitteeLane = 'Operations & Organising'
const media: CommitteeLane = 'Media & Communications'
const finance: CommitteeLane = 'Finance & Fundraising'
const policy: CommitteeLane = 'Research & Policy'
const welfare: CommitteeLane = 'Appointment, Discipline & Welfare'

const entries = [
  ['FOUNDER', 'Founder', 'BOARD', undefined, 'national', true, true],
  ['BOARD_CHAIR', 'Board Chair', 'BOARD', undefined, 'national', true, true],
  ['BOARD_SECRETARY', 'Board Secretary', 'BOARD', undefined, 'national', false, true],
  ['EXECUTIVE', 'Executive Member', 'BOARD', undefined, 'national', false, true],
  ['MOVEMENT_LEADER', 'Movement Leader', 'BOARD', undefined, 'national', false, true],
  [
    'AUDIT_COMPLIANCE_OFFICER',
    'Audit / Compliance Officer',
    'BOARD',
    undefined,
    'national',
    false,
    true,
  ],
  ['LEGAL_OFFICER', 'Legal Officer', 'BOARD', undefined, 'national', false, true],
  ['BOARD_MEMBER', 'Board Member', 'BOARD', undefined, 'national', false, true],
  ['BOARD_TREASURER', 'Board Treasurer', 'BOARD', undefined, 'national', false, true],
  ['BOARD_ADVISOR', 'Board Advisor', 'BOARD', undefined, 'national', false, true],

  ['ICT_DIRECTOR', 'ICT Director', 'NATIONAL ICT', undefined, 'national', true, true],
  ['SUPER_ADMIN', 'Super Admin', 'NATIONAL ICT', undefined, 'national', true, true],
  ['ADMIN', 'Admin', 'NATIONAL ICT', undefined, 'national', false, false],
  ['ADMIN_L2', 'Admin L2', 'NATIONAL ICT', undefined, 'national', false, false],
  ['IT_MANAGER', 'IT Manager', 'NATIONAL ICT', undefined, 'national', false, true],
  [
    'SYSTEM_ADMINISTRATOR',
    'System Administrator',
    'NATIONAL ICT',
    undefined,
    'national',
    false,
    true,
  ],
  [
    'CYBERSECURITY_OFFICER',
    'Cybersecurity Officer',
    'NATIONAL ICT',
    undefined,
    'national',
    false,
    true,
  ],
  [
    'TECHNICAL_SUPPORT_OFFICER',
    'Technical Support Officer',
    'NATIONAL ICT',
    undefined,
    'national',
    false,
    false,
  ],
  ['DATABASE_MANAGER', 'Database Manager', 'NATIONAL ICT', undefined, 'national', false, false],
  ['WEB_APP_MANAGER', 'Web / App Manager', 'NATIONAL ICT', undefined, 'national', false, false],
  [
    'DATA_PROTECTION_OFFICER',
    'Data Protection Officer',
    'NATIONAL ICT',
    undefined,
    'national',
    false,
    false,
  ],

  [
    'SECURITY_DIRECTOR',
    'Security Director',
    'SECURITY / INTEL',
    undefined,
    'national',
    false,
    true,
  ],
  [
    'DEPUTY_SECURITY_DIRECTOR',
    'Deputy Security Director',
    'SECURITY / INTEL',
    undefined,
    'national',
    false,
    false,
  ],
  [
    'INTELLIGENCE_ANALYST',
    'Intelligence Analyst',
    'SECURITY / INTEL',
    undefined,
    'national',
    false,
    false,
  ],
  [
    'FIELD_INTELLIGENCE_OFFICER',
    'Field Intelligence Officer',
    'SECURITY / INTEL',
    undefined,
    'constituency',
    false,
    false,
  ],
  [
    'INVESTIGATION_OFFICER',
    'Investigation Officer',
    'SECURITY / INTEL',
    undefined,
    'national',
    false,
    false,
  ],
  [
    'RISK_THREAT_ANALYST',
    'Risk / Threat Analyst',
    'SECURITY / INTEL',
    undefined,
    'national',
    false,
    false,
  ],
  [
    'REGIONAL_SECURITY_OFFICER',
    'Regional Security Officer',
    'SECURITY / INTEL',
    undefined,
    'region',
    false,
    false,
  ],
  [
    'CONSTITUENCY_SECURITY_OFFICER',
    'Constituency Security Officer',
    'SECURITY / INTEL',
    undefined,
    'constituency',
    false,
    false,
  ],

  [
    'NATIONAL_COORDINATOR',
    'National Coordinator / National Chairperson',
    'NCC',
    ops,
    'national',
    true,
    true,
  ],
  ['ORGANIZER', 'National Organiser', 'NCC', ops, 'national', false, false],
  ['NATIONAL_SECRETARY', 'National Secretary', 'NCC', ops, 'national', false, false],
  [
    'NATIONAL_LOGISTICS_OFFICER',
    'National Logistics Officer',
    'NCC',
    ops,
    'national',
    false,
    false,
  ],
  ['YOUTH_LEADER', 'Youth Leader', 'NCC', ops, 'national', false, false],
  ['COMMUNICATIONS_OFFICER', 'Communications Officer', 'NCC', media, 'national', false, false],
  ['CHIEF_EDITOR', 'Chief Editor', 'NCC', media, 'national', false, false],
  ['SENIOR_EDITOR', 'Senior Editor', 'NCC', media, 'national', false, false],
  ['EDITOR', 'Editor', 'NCC', media, 'national', false, false],
  ['JUNIOR_EDITOR', 'Junior Editor', 'NCC', media, 'national', false, false],
  ['FINANCE_OFFICER', 'National Finance Officer', 'NCC', finance, 'national', false, false],
  [
    'NATIONAL_FUNDRAISING_OFFICER',
    'National Fundraising Officer',
    'NCC',
    finance,
    'national',
    false,
    false,
  ],
  [
    'NATIONAL_RESEARCH_POLICY_DIRECTOR',
    'National Research & Policy Director',
    'NCC',
    policy,
    'national',
    false,
    false,
  ],
  [
    'NATIONAL_WELFARE_OFFICER',
    'National Welfare Officer',
    'NCC',
    welfare,
    'national',
    false,
    false,
  ],
  [
    'NATIONAL_DISCIPLINARY_OFFICER',
    'National Disciplinary Officer',
    'NCC',
    welfare,
    'national',
    false,
    false,
  ],
  [
    'NATIONAL_APPOINTMENT_OFFICER',
    'National Appointment Officer',
    'NCC',
    welfare,
    'national',
    false,
    false,
  ],

  ['REGIONAL_DIRECTOR', 'Regional Director', 'RCC', ops, 'region', false, true],
  ['REGIONAL_SECRETARY', 'Regional Secretary', 'RCC', ops, 'region', false, false],
  ['REGIONAL_ORGANISER', 'Regional Organiser', 'RCC', ops, 'region', false, false],
  ['REGIONAL_LOGISTICS_OFFICER', 'Regional Logistics Officer', 'RCC', ops, 'region', false, false],
  ['REGIONAL_YOUTH_ORGANISER', 'Regional Youth Organiser', 'RCC', ops, 'region', false, false],
  ['REGIONAL_MEDIA_OFFICER', 'Regional Media Officer', 'RCC', media, 'region', false, false],
  ['REGIONAL_CORRESPONDENT', 'Regional Correspondent', 'RCC', media, 'region', false, false],
  ['REGIONAL_ICT_OFFICER', 'Regional ICT Officer', 'RCC', media, 'region', false, false],
  ['REGIONAL_FINANCE_OFFICER', 'Regional Finance Officer', 'RCC', finance, 'region', false, false],
  [
    'REGIONAL_RESEARCH_POLICY_OFFICER',
    'Regional Research & Policy Officer',
    'RCC',
    policy,
    'region',
    false,
    false,
  ],
  [
    'REGIONAL_APPOINTMENT_OFFICER',
    'Regional Appointment Officer',
    'RCC',
    welfare,
    'region',
    false,
    false,
  ],
  [
    'REGIONAL_DISCIPLINARY_OFFICER',
    'Regional Disciplinary Officer',
    'RCC',
    welfare,
    'region',
    false,
    false,
  ],
  ['REGIONAL_WELFARE_OFFICER', 'Regional Welfare Officer', 'RCC', welfare, 'region', false, false],

  ['CONSTITUENCY_LEAD', 'Constituency Lead', 'CCC', ops, 'constituency', false, true],
  ['CONSTITUENCY_SECRETARY', 'Constituency Secretary', 'CCC', ops, 'constituency', false, false],
  ['CONSTITUENCY_ORGANISER', 'Constituency Organiser', 'CCC', ops, 'constituency', false, false],
  [
    'CONSTITUENCY_LOGISTICS_OFFICER',
    'Constituency Logistics Officer',
    'CCC',
    ops,
    'constituency',
    false,
    false,
  ],
  ['CHAPTER_LEAD', 'Chapter Leader', 'CCC', ops, 'constituency', false, false],
  ['CHAPTER_SECRETARY', 'Chapter Secretary', 'CCC', ops, 'constituency', false, false],
  ['FIELD_AGENT', 'Field Agent', 'CCC', ops, 'constituency', false, false],
  [
    'POLLING_STATION_COORDINATOR',
    'Polling Station Coordinator',
    'CCC',
    ops,
    'polling_station',
    false,
    false,
  ],
  ['POLLING_STATION_AGENT', 'Polling Station Agent', 'CCC', ops, 'polling_station', false, false],
  ['MEMBERSHIP_OFFICER', 'Membership Officer', 'CCC', ops, 'constituency', false, false],
  [
    'CONSTITUENCY_MEDIA_OFFICER',
    'Constituency Media Officer',
    'CCC',
    media,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_FINANCE_OFFICER',
    'Constituency Finance Officer',
    'CCC',
    finance,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_TREASURER',
    'Constituency Treasurer',
    'CCC',
    finance,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_RESEARCH_POLICY_OFFICER',
    'Constituency Research & Policy Officer',
    'CCC',
    policy,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_APPOINTMENT_OFFICER',
    'Constituency Appointment Officer',
    'CCC',
    welfare,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_DISCIPLINARY_OFFICER',
    'Constituency Disciplinary Officer',
    'CCC',
    welfare,
    'constituency',
    false,
    false,
  ],
  [
    'CONSTITUENCY_WELFARE_OFFICER',
    'Constituency Welfare Officer',
    'CCC',
    welfare,
    'constituency',
    false,
    false,
  ],
  ['CONSTITUENCY_DEPUTY', 'Constituency Deputy', 'CCC', ops, 'constituency', false, false],
  ['CHAPTER_TREASURER', 'Chapter Treasurer', 'CCC', finance, 'constituency', false, false],
  ['STORE_MANAGER', 'Store Manager', 'NCC', ops, 'national', false, false],
] as const

export const ROLE_CATALOG: RoleCatalogEntry[] = entries.map(
  ([role, label, parentGroup, committeeLane, scopeType, isProtected, requires2fa]) => ({
    role,
    label,
    parentGroup,
    committeeLane,
    scopeType,
    protected: isProtected,
    requires2fa,
  })
)

export const ROLE_PARENT_GROUPS: RoleParentGroup[] = [
  'BOARD',
  'NATIONAL ICT',
  'SECURITY / INTEL',
  'NCC',
  'RCC',
  'CCC',
]

export const COMMITTEE_LANES: CommitteeLane[] = [ops, media, finance, policy, welfare]

const catalogMap = new Map<AdminRole, RoleCatalogEntry>(
  ROLE_CATALOG.map((entry) => [entry.role, entry])
)

export function resolveRoleAlias(role: string): string {
  return ROLE_ALIASES[role as AdminRole] ?? role
}

const p = (
  action: AdminPermission['action'],
  resource: AdminPermission['resource']
): AdminPermission => ({ action, resource })

const viewOps = [
  p('VIEW_WAR_ROOM', 'OPERATIONS'),
  p('VIEW_DEPLOYMENT_METRICS', 'OPERATIONS'),
  p('VIEW_CONSTITUENCY_OPS', 'OPERATIONS'),
  p('VIEW_POLLING_STATIONS', 'OPERATIONS'),
]

const boardView = [
  p('VIEW_ADMINS', 'ADMINS'),
  p('VIEW_MEMBER_DIRECTORY', 'MEMBERS'),
  p('VIEW_FINANCE', 'FINANCE'),
  p('VIEW_STRATEGIC_FOCUS', 'STRATEGY'),
  p('VIEW_PARTY_OFFICIALS', 'PARTY'),
  ...viewOps,
]

const ictManage = [
  p('VIEW_ADMINS', 'ADMINS'),
  p('VIEW_AUDIT_LOGS', 'SYSTEM'),
  p('SUBMIT_IT_TICKET', 'IT_SUPPORT'),
  p('VERIFY_MEMBER', 'MEMBERS'),
]

const opsManage = [
  p('VIEW_MEMBER_DIRECTORY', 'MEMBERS'),
  p('VERIFY_MEMBER', 'MEMBERS'),
  p('MANAGE_CHAPTER', 'CHAPTERS'),
  p('APPOINT_LEAD', 'CHAPTERS'),
  ...viewOps,
]

const mediaManage = [p('MANAGE_BLOGS', 'BLOGS'), p('MANAGE_NEWSLETTERS', 'NEWSLETTERS')]
const financeManage = [p('MANAGE_DONATIONS', 'DONATIONS'), p('VIEW_FINANCE', 'FINANCE')]
const policyView = [
  p('VIEW_STRATEGIC_FOCUS', 'STRATEGY'),
  p('VIEW_MISSION_PLAN', 'STRATEGY'),
  p('VIEW_ROADMAP', 'STRATEGY'),
]
const welfareManage = [p('VIEW_MEMBER_DIRECTORY', 'MEMBERS'), p('APPOINT_LEAD', 'CHAPTERS')]
const securityView = [
  p('VIEW_AUDIT_LOGS', 'SYSTEM'),
  p('VIEW_WAR_ROOM', 'OPERATIONS'),
  p('VIEW_DEPLOYMENT_METRICS', 'OPERATIONS'),
  p('VIEW_MEMBER_DIRECTORY', 'MEMBERS'),
]

export function getDefaultRolePermissions(role: string): AdminPermission[] {
  const meta = getRoleCatalogEntry(role)

  if (role === 'SUPER_ADMIN') {
    return [
      ...ictManage,
      ...opsManage,
      ...mediaManage,
      ...financeManage,
      ...policyView,
      p('DELETE_MEMBER', 'MEMBERS'),
      p('MANAGE_POLLS', 'POLLS'),
      p('MANAGE_INVENTORY', 'STORE'),
      p('VIEW_POLLS', 'POLLS'),
      p('VIEW_MASS_MOBILIZATION', 'OPERATIONS'),
      p('VIEW_DIRECTIVES', 'OPERATIONS'),
      p('VIEW_DEPLOY_ASSET', 'OPERATIONS'),
      p('VIEW_PARTY_OFFICIALS', 'PARTY'),
    ]
  }

  if (meta.parentGroup === 'BOARD') {
    return role === 'AUDIT_COMPLIANCE_OFFICER'
      ? [p('VIEW_AUDIT_LOGS', 'SYSTEM'), p('VIEW_FINANCE', 'FINANCE'), p('VIEW_ADMINS', 'ADMINS')]
      : boardView
  }

  if (meta.parentGroup === 'NATIONAL ICT') return ictManage
  if (meta.parentGroup === 'SECURITY / INTEL') return securityView

  if (meta.committeeLane === media) return mediaManage
  if (meta.committeeLane === finance) return financeManage
  if (meta.committeeLane === policy) return policyView
  if (meta.committeeLane === welfare) return welfareManage

  return opsManage
}

export function formatRoleName(role: string): string {
  const entry = catalogMap.get(resolveRoleAlias(role) as AdminRole)
  if (entry) return entry.label

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function getRoleCatalogEntry(role: string): RoleCatalogEntry {
  const canonicalRole = resolveRoleAlias(role) as AdminRole
  return (
    catalogMap.get(canonicalRole) ?? {
      role: canonicalRole,
      label: formatRoleName(role),
      parentGroup: 'NATIONAL ICT',
      scopeType: 'national',
      protected: false,
      requires2fa: false,
    }
  )
}

export function isProtectedRole(role: string): boolean {
  return getRoleCatalogEntry(role).protected
}

export function requiresRole2fa(role: string): boolean {
  return getRoleCatalogEntry(role).requires2fa
}

export function hasPermission(
  permissions: AdminPermission[] | undefined,
  permission: AdminPermission
): boolean {
  return Boolean(
    permissions?.some(
      (granted) => granted.action === permission.action && granted.resource === permission.resource
    )
  )
}

function hasSatisfied2fa(user: UserCanInput): boolean {
  return user.mfaVerified === true || user.mfa_verified === true || user.aal === 'aal2'
}

function normalize(value: string | null | undefined): string | null {
  return value ? value.trim().toLowerCase() : null
}

function scopeMatches(
  user: UserCanInput,
  scopeType: RoleScopeType,
  resource?: RoleResourceScope | null
) {
  if (!resource || scopeType === 'national') return true

  if (resource.scope_type && resource.scope_id) {
    if (resource.scope_type === 'region')
      return normalize(user.assigned_region ?? user.region) === normalize(resource.scope_id)
    if (resource.scope_type === 'constituency') {
      return normalize(user.assigned_constituency ?? user.chapter) === normalize(resource.scope_id)
    }
    if (resource.scope_type === 'polling_station') {
      return normalize(user.assigned_polling_station) === normalize(resource.scope_id)
    }
  }

  if (scopeType === 'region') {
    return (
      normalize(user.assigned_region ?? user.region) ===
      normalize(resource.region_id ?? resource.region ?? resource.assigned_region)
    )
  }

  if (scopeType === 'constituency') {
    return (
      normalize(user.assigned_constituency ?? user.chapter) ===
      normalize(resource.constituency_id ?? resource.constituency ?? resource.assigned_constituency)
    )
  }

  return (
    normalize(user.assigned_polling_station) ===
    normalize(resource.polling_station_id ?? resource.pollingStationId ?? resource.id)
  )
}

export function userCan(
  user: UserCanInput | null | undefined,
  permission: AdminPermission,
  resource: RoleResourceScope | null = null
): boolean {
  if (!user) return false
  if (user.isActive === false || user.is_active === false) return false
  if (user.role === 'SUPER_ADMIN') return true

  const meta = getRoleCatalogEntry(user.role)
  if (meta.requires2fa && !hasSatisfied2fa(user)) return false

  if (!hasPermission(user.permissions, permission)) return false

  return scopeMatches(user, meta.scopeType, resource)
}

export function isRemovingOwnLastSuperAdmin(params: {
  currentUserId?: string | null
  targetUserId?: string | null
  currentTargetRole?: string | null
  nextRole?: string | null
  allAdminRoles: Array<{ id: string; role: string }>
}): boolean {
  const { currentUserId, targetUserId, currentTargetRole, nextRole, allAdminRoles } = params
  if (!currentUserId || !targetUserId || currentUserId !== targetUserId) return false
  if (currentTargetRole !== 'SUPER_ADMIN') return false
  if (nextRole === 'SUPER_ADMIN') return false

  return allAdminRoles.filter((admin) => admin.role === 'SUPER_ADMIN').length <= 1
}
