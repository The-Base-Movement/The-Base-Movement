import type { AdminPermission, AdminRole } from '@/types/admin'

export type DepartmentId =
  | 'board-governance'
  | 'national-ict'
  | 'security-intel'
  | 'operations-organising'
  | 'media-communications'
  | 'finance-fundraising'
  | 'research-policy'
  | 'appointment-welfare'

export interface DepartmentCatalogEntry {
  id: DepartmentId
  name: string
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

const elevated: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER']

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

function withElevated(roles: AdminRole[]) {
  return Array.from(new Set([...elevated, ...roles]))
}

export const DEPARTMENT_CATALOG: DepartmentCatalogEntry[] = [
  {
    id: 'board-governance',
    name: 'Board / Governance',
    icon: 'corporate_fare',
    sortOrder: 1,
    handlerRoles: withElevated(boardRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(boardRoles) },
  },
  {
    id: 'national-ict',
    name: 'National ICT',
    icon: 'computer',
    sortOrder: 2,
    handlerRoles: withElevated(ictRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(ictRoles) },
  },
  {
    id: 'security-intel',
    name: 'Security / Intel',
    icon: 'shield',
    sortOrder: 3,
    handlerRoles: withElevated(securityRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(securityRoles) },
  },
  {
    id: 'operations-organising',
    name: 'Operations & Organising',
    icon: 'hub',
    sortOrder: 4,
    handlerRoles: withElevated(operationsRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(operationsRoles) },
  },
  {
    id: 'media-communications',
    name: 'Media & Communications',
    icon: 'campaign',
    sortOrder: 5,
    handlerRoles: withElevated(mediaRoles),
    restrictedSubmitterRoles: null,
    access: { permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' } },
  },
  {
    id: 'finance-fundraising',
    name: 'Finance & Fundraising',
    icon: 'account_balance',
    sortOrder: 6,
    handlerRoles: withElevated(financeRoles),
    restrictedSubmitterRoles: null,
    access: { permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' } },
  },
  {
    id: 'research-policy',
    name: 'Research & Policy',
    icon: 'query_stats',
    sortOrder: 7,
    handlerRoles: withElevated(policyRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(policyRoles) },
  },
  {
    id: 'appointment-welfare',
    name: 'Appointment, Discipline & Welfare',
    icon: 'groups_2',
    sortOrder: 8,
    handlerRoles: withElevated(welfareRoles),
    restrictedSubmitterRoles: null,
    access: { allowedRoles: withElevated(welfareRoles) },
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
