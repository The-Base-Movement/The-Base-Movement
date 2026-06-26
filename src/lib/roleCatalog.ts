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

const ops: CommitteeLane = 'Operations & Organising'
const media: CommitteeLane = 'Media & Communications'
const finance: CommitteeLane = 'Finance & Fundraising'
const policy: CommitteeLane = 'Research & Policy'
const welfare: CommitteeLane = 'Appointment, Discipline & Welfare'

const entries = [
  ['FOUNDER', 'Founder / Platform Owner', 'BOARD', undefined, 'national', true, true],
  ['BOARD_CHAIR', 'Board Chair', 'BOARD', undefined, 'national', true, true],
  ['BOARD_SECRETARY', 'Board Secretary', 'BOARD', undefined, 'national', false, false],
  ['EXECUTIVE', 'Executive Member', 'BOARD', undefined, 'national', false, false],
  ['EXECUTIVE_MEMBER', 'Executive Member', 'BOARD', undefined, 'national', false, false],
  [
    'AUDIT_COMPLIANCE_OFFICER',
    'Audit / Compliance Officer',
    'BOARD',
    undefined,
    'national',
    false,
    true,
  ],
  ['LEGAL_OFFICER', 'Legal Officer', 'BOARD', undefined, 'national', false, false],

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
    'INTELLIGENCE_ANALYST',
    'Intelligence Analyst',
    'SECURITY / INTEL',
    undefined,
    'national',
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
  ['NATIONAL_ORGANISER', 'National Organiser', 'NCC', ops, 'national', false, false],
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
  [
    'NATIONAL_MEDIA_DIRECTOR',
    'National Media Director / Communications Officer',
    'NCC',
    media,
    'national',
    false,
    false,
  ],
  ['COMMUNICATIONS_OFFICER', 'Communications Officer', 'NCC', media, 'national', false, false],
  ['CHIEF_EDITOR', 'Chief Editor', 'NCC', media, 'national', false, false],
  ['SENIOR_EDITOR', 'Senior Editor', 'NCC', media, 'national', false, false],
  ['EDITOR', 'Editor', 'NCC', media, 'national', false, false],
  ['JUNIOR_EDITOR', 'Junior Editor', 'NCC', media, 'national', false, false],
  ['FINANCE_OFFICER', 'National Finance Officer', 'NCC', finance, 'national', false, false],
  [
    'NATIONAL_FINANCE_OFFICER',
    'National Finance Officer',
    'NCC',
    finance,
    'national',
    false,
    false,
  ],
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
  ['STORE_MANAGER', 'Store Manager', 'NATIONAL ICT', undefined, 'national', false, false],
  ['MOVEMENT_LEADER', 'Movement Leader', 'NCC', ops, 'national', false, false],
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

export function formatRoleName(role: string): string {
  const entry = catalogMap.get(role as AdminRole)
  if (entry) return entry.label

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function getRoleCatalogEntry(role: string): RoleCatalogEntry {
  return (
    catalogMap.get(role as AdminRole) ?? {
      role: role as AdminRole,
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
  if (user.mfaVerified == null && user.mfa_verified == null && user.aal == null) return true
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

  const meta = getRoleCatalogEntry(user.role)
  if (meta.requires2fa && !hasSatisfied2fa(user)) return false

  if (user.role === 'SUPER_ADMIN') return true
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
