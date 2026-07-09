import type { AdminPermission, AdminRole } from '@/types/admin'

export type DepartmentId = 'board-governance' | 'ncc' | 'rcc' | 'ccc' | 'polling-stations'
export interface DepartmentCatalogEntry {
  id: DepartmentId
  name: string
  levelLabel: string
  icon: string
  sortOrder: number
  handlerRoles: AdminRole[]
  restrictedSubmitterRoles: AdminRole[] | null
  access?: {
    allowedRoles?: AdminRole[]
    permission?: {
      action: AdminPermission['action']
      resource: AdminPermission['resource']
    }
  }
}

export interface DepartmentCatalogRow {
  id: DepartmentId
  name: string
  handler_roles: AdminRole[]
  restricted_submitter_roles: AdminRole[] | null
  icon: string
  sort_order: number
  active: boolean
  lead_id: string | null
}

export interface DepartmentSubCommittee {
  id: string
  name: string
  icon: string
}

const elevated: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER']

export const DEPARTMENT_SUB_COMMITTEES: DepartmentSubCommittee[] = [
  { id: 'operations-organising', name: 'Operations & Organising', icon: 'hub' },
  { id: 'media-communications', name: 'Media & Communications', icon: 'campaign' },
  { id: 'finance-fundraising', name: 'Finance & Fundraising', icon: 'account_balance' },
  { id: 'research-policy', name: 'Research & Policy', icon: 'query_stats' },
  {
    id: 'appointment-discipline-welfare',
    name: 'Appointment, Discipline & Welfare',
    icon: 'groups_2',
  },
]

export const DEPARTMENT_REPORTING_CHAIN: DepartmentId[] = [
  'board-governance',
  'ncc',
  'rcc',
  'ccc',
  'polling-stations',
]

const boardRoles: AdminRole[] = [
  'FOUNDER',
  'BOARD_CHAIR',
  'BOARD_SECRETARY',
  'EXECUTIVE',
  'MOVEMENT_LEADER',
  'AUDIT_COMPLIANCE_OFFICER',
  'LEGAL_OFFICER',
  'BOARD_MEMBER',
  'BOARD_TREASURER',
  'BOARD_ADVISOR',
]

const ictRoles: AdminRole[] = [
  'ICT_DIRECTOR',
  'SUPER_ADMIN',
  'ADMIN',
  'ADMIN_L2',
  'IT_MANAGER',
  'SYSTEM_ADMINISTRATOR',
  'CYBERSECURITY_OFFICER',
  'TECHNICAL_SUPPORT_OFFICER',
  'DATABASE_MANAGER',
  'WEB_APP_MANAGER',
  'DATA_PROTECTION_OFFICER',
]

const securityRoles: AdminRole[] = [
  'SECURITY_DIRECTOR',
  'DEPUTY_SECURITY_DIRECTOR',
  'INTELLIGENCE_ANALYST',
  'FIELD_INTELLIGENCE_OFFICER',
  'INVESTIGATION_OFFICER',
  'RISK_THREAT_ANALYST',
  'REGIONAL_SECURITY_OFFICER',
  'CONSTITUENCY_SECURITY_OFFICER',
]

const operationsRoles: AdminRole[] = [
  'NATIONAL_COORDINATOR',
  'ORGANIZER',
  'NATIONAL_SECRETARY',
  'NATIONAL_LOGISTICS_OFFICER',
  'YOUTH_LEADER',
  'STORE_MANAGER',
  'REGIONAL_DIRECTOR',
  'REGIONAL_SECRETARY',
  'REGIONAL_ORGANISER',
  'REGIONAL_LOGISTICS_OFFICER',
  'REGIONAL_YOUTH_ORGANISER',
  'CONSTITUENCY_LEAD',
  'CONSTITUENCY_SECRETARY',
  'CONSTITUENCY_ORGANISER',
  'CONSTITUENCY_LOGISTICS_OFFICER',
  'CONSTITUENCY_DEPUTY',
  'CHAPTER_LEAD',
  'CHAPTER_SECRETARY',
  'FIELD_AGENT',
  'POLLING_STATION_COORDINATOR',
  'POLLING_STATION_AGENT',
  'MEMBERSHIP_OFFICER',
]

const mediaRoles: AdminRole[] = [
  'COMMUNICATIONS_OFFICER',
  'CHIEF_EDITOR',
  'SENIOR_EDITOR',
  'EDITOR',
  'JUNIOR_EDITOR',
  'REGIONAL_MEDIA_OFFICER',
  'REGIONAL_CORRESPONDENT',
  'REGIONAL_ICT_OFFICER',
  'CONSTITUENCY_MEDIA_OFFICER',
]

const financeRoles: AdminRole[] = [
  'FINANCE_OFFICER',
  'NATIONAL_FUNDRAISING_OFFICER',
  'REGIONAL_FINANCE_OFFICER',
  'CONSTITUENCY_FINANCE_OFFICER',
  'CONSTITUENCY_TREASURER',
  'CHAPTER_TREASURER',
]

const policyRoles: AdminRole[] = [
  'NATIONAL_RESEARCH_POLICY_DIRECTOR',
  'REGIONAL_RESEARCH_POLICY_OFFICER',
  'CONSTITUENCY_RESEARCH_POLICY_OFFICER',
]

const welfareRoles: AdminRole[] = [
  'NATIONAL_WELFARE_OFFICER',
  'NATIONAL_DISCIPLINARY_OFFICER',
  'NATIONAL_APPOINTMENT_OFFICER',
  'REGIONAL_WELFARE_OFFICER',
  'REGIONAL_DISCIPLINARY_OFFICER',
  'REGIONAL_APPOINTMENT_OFFICER',
  'CONSTITUENCY_WELFARE_OFFICER',
  'CONSTITUENCY_DISCIPLINARY_OFFICER',
  'CONSTITUENCY_APPOINTMENT_OFFICER',
]

const nccRoles: AdminRole[] = [
  ...ictRoles,
  ...securityRoles.filter((role) =>
    [
      'SECURITY_DIRECTOR',
      'DEPUTY_SECURITY_DIRECTOR',
      'INTELLIGENCE_ANALYST',
      'FIELD_INTELLIGENCE_OFFICER',
      'INVESTIGATION_OFFICER',
      'RISK_THREAT_ANALYST',
    ].includes(role)
  ),
  ...operationsRoles.filter((role) =>
    [
      'NATIONAL_COORDINATOR',
      'ORGANIZER',
      'NATIONAL_SECRETARY',
      'NATIONAL_LOGISTICS_OFFICER',
      'YOUTH_LEADER',
      'STORE_MANAGER',
    ].includes(role)
  ),
  ...mediaRoles.filter((role) =>
    ['COMMUNICATIONS_OFFICER', 'CHIEF_EDITOR', 'SENIOR_EDITOR', 'EDITOR', 'JUNIOR_EDITOR'].includes(
      role
    )
  ),
  ...financeRoles.filter((role) =>
    ['FINANCE_OFFICER', 'NATIONAL_FUNDRAISING_OFFICER'].includes(role)
  ),
  ...policyRoles.filter((role) => role === 'NATIONAL_RESEARCH_POLICY_DIRECTOR'),
  ...welfareRoles.filter((role) => role.startsWith('NATIONAL_')),
]

const rccRoles: AdminRole[] = [
  ...operationsRoles.filter((role) => role.startsWith('REGIONAL_')),
  ...mediaRoles.filter((role) => role.startsWith('REGIONAL_')),
  ...financeRoles.filter((role) => role.startsWith('REGIONAL_')),
  ...policyRoles.filter((role) => role.startsWith('REGIONAL_')),
  ...welfareRoles.filter((role) => role.startsWith('REGIONAL_')),
  ...securityRoles.filter((role) => role.startsWith('REGIONAL_')),
]

const cccRoles: AdminRole[] = [
  ...operationsRoles.filter(
    (role) =>
      role.startsWith('CONSTITUENCY_') ||
      role.startsWith('CHAPTER_') ||
      role === 'FIELD_AGENT' ||
      role === 'MEMBERSHIP_OFFICER'
  ),
  ...mediaRoles.filter((role) => role.startsWith('CONSTITUENCY_')),
  ...financeRoles.filter((role) => role.startsWith('CONSTITUENCY_') || role.startsWith('CHAPTER_')),
  ...policyRoles.filter((role) => role.startsWith('CONSTITUENCY_')),
  ...welfareRoles.filter((role) => role.startsWith('CONSTITUENCY_')),
  ...securityRoles.filter((role) => role.startsWith('CONSTITUENCY_')),
]

const pollingStationRoles: AdminRole[] = ['POLLING_STATION_COORDINATOR', 'POLLING_STATION_AGENT']
function withElevated(roles: AdminRole[]) {
  return Array.from(new Set([...elevated, ...roles]))
}

export const DEPARTMENT_CATALOG: DepartmentCatalogEntry[] = [
  {
    id: 'board-governance',
    name: 'Board / Governance',
    levelLabel: 'National accountability board',
    icon: 'corporate_fare',
    sortOrder: 1,
    handlerRoles: withElevated(boardRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(boardRoles) },
  },
  {
    id: 'ncc',
    name: 'NCC / National Level',
    levelLabel: 'National command level',
    icon: 'verified_user',
    sortOrder: 2,
    handlerRoles: withElevated(nccRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(nccRoles) },
  },
  {
    id: 'rcc',
    name: 'RCC / Regional Level',
    levelLabel: 'Regional command level',
    icon: 'travel_explore',
    sortOrder: 3,
    handlerRoles: withElevated(rccRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(rccRoles) },
  },
  {
    id: 'ccc',
    name: 'CCC / Constituency Level',
    levelLabel: 'Constituency command level',
    icon: 'groups',
    sortOrder: 4,
    handlerRoles: withElevated(cccRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(cccRoles) },
  },
  {
    id: 'polling-stations',
    name: 'Polling Stations / Grassroots Level',
    levelLabel: 'Grassroots reporting level',
    icon: 'ballot',
    sortOrder: 5,
    handlerRoles: withElevated(pollingStationRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated([...cccRoles, ...pollingStationRoles]) },
  },
]
export const CANONICAL_DEPARTMENT_IDS = new Set<string>(
  DEPARTMENT_CATALOG.map((department) => department.id)
)

export function getDepartmentCatalogEntry(id: string | undefined) {
  return DEPARTMENT_CATALOG.find((department) => department.id === id) ?? null
}

export function getDepartmentCatalogRow(id: string | undefined): DepartmentCatalogRow | null {
  const department = getDepartmentCatalogEntry(id)
  if (!department) return null

  return {
    id: department.id,
    name: department.name,
    handler_roles: department.handlerRoles,
    restricted_submitter_roles: department.restrictedSubmitterRoles,
    icon: department.icon,
    sort_order: department.sortOrder,
    active: true,
    lead_id: null,
  }
}

export function getDepartmentCatalogRows(): DepartmentCatalogRow[] {
  return DEPARTMENT_CATALOG.map((department) => ({
    id: department.id,
    name: department.name,
    handler_roles: department.handlerRoles,
    restricted_submitter_roles: department.restrictedSubmitterRoles,
    icon: department.icon,
    sort_order: department.sortOrder,
    active: true,
    lead_id: null,
  }))
}
