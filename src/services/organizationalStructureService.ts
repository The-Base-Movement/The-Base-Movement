import { ROLE_PARENT_GROUPS, COMMITTEE_LANES, resolveRoleAlias } from '@/lib/roleCatalog'
import type { CommitteeLane, RoleParentGroup, RoleScopeType } from '@/lib/roleCatalog'
import { supabase } from '@/lib/supabase'
import { roleService, type AdminRoleRecord } from '@/services/roleService'

export type OrgParentGroup = RoleParentGroup | 'Polling Stations'

export interface OrganizationalCounts {
  parentGroups: number
  roles: number
  committeeLanes: number
  protectedRoles: number
  twoFactorRoles: number
  permissions: number
  regions: number | null
  constituencies: number | null
  pollingStations: number | null
}

export interface RoleNode extends AdminRoleRecord {
  assignedUsersCount: number | null
}

export interface CommitteeLaneNode {
  lane: CommitteeLane
  roles: RoleNode[]
}

export interface ParentGroupNode {
  group: OrgParentGroup
  roles: RoleNode[]
  lanes: CommitteeLaneNode[]
}

export interface RoadmapNode {
  group: OrgParentGroup
  items: string[]
}

export interface OrganizationalStructureData {
  counts: OrganizationalCounts
  groups: ParentGroupNode[]
  roadmap: RoadmapNode[]
}

const POLLING_STATION_ROLES = new Set([
  'POLLING_STATION_COORDINATOR',
  'POLLING_STATION_AGENT',
  'FIELD_AGENT',
  'MEMBERSHIP_OFFICER',
])

export const ORG_ROADMAP: RoadmapNode[] = [
  {
    group: 'BOARD',
    items: ['Governance', 'Strategy', 'Oversight', 'Final approval'],
  },
  {
    group: 'NATIONAL ICT',
    items: ['Platform control', 'Roles and permissions', '2FA', 'Logs', 'System security'],
  },
  {
    group: 'SECURITY / INTEL',
    items: ['Risk reports', 'Intelligence', 'Incident tracking', 'Security cases'],
  },
  {
    group: 'NCC',
    items: [
      'National coordination',
      'National operations',
      'Media',
      'Finance',
      'Research/policy',
      'Appointment/discipline/welfare',
    ],
  },
  {
    group: 'RCC',
    items: [
      'Regional coordination',
      'Regional supervision',
      'Regional reporting',
      'Regional mobilization',
    ],
  },
  {
    group: 'CCC',
    items: [
      'Constituency coordination',
      'Member verification',
      'Local operations',
      'Polling station coordination',
    ],
  },
  {
    group: 'Polling Stations',
    items: ['Grassroots reports', 'Field verification', 'Community/voter engagement'],
  },
]

function permissionKey(permission: RoleNode['permissions'][number]) {
  return `${permission.action}:${permission.resource}`
}

async function getCount(table: string): Promise<number | null> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    console.warn(`[OrganizationalStructure] ${table} count unavailable:`, error.message)
    return null
  }
  return count ?? 0
}

async function getAssignedUserCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('admins').select('role')
  if (error) {
    console.warn('[OrganizationalStructure] assigned admin counts unavailable:', error.message)
    return new Map()
  }

  const counts = new Map<string, number>()
  ;(data || []).forEach((row: { role: string | null }) => {
    if (!row.role) return
    const role = resolveRoleAlias(row.role)
    counts.set(role, (counts.get(role) ?? 0) + 1)
  })
  return counts
}

export function buildOrganizationalStructureData(
  roles: AdminRoleRecord[],
  assignedCounts: Map<string, number> = new Map(),
  operationalCounts: Pick<
    OrganizationalCounts,
    'regions' | 'constituencies' | 'pollingStations'
  > = {
    regions: null,
    constituencies: null,
    pollingStations: null,
  }
): OrganizationalStructureData {
  const nodes: RoleNode[] = roles.map((role) => ({
    ...role,
    assignedUsersCount: assignedCounts.get(role.name) ?? 0,
  }))

  const groups: ParentGroupNode[] = ROLE_PARENT_GROUPS.map((group) => {
    const groupRoles = nodes.filter((role) => role.parentGroup === group)
    const lanes =
      group === 'NCC' || group === 'RCC' || group === 'CCC'
        ? COMMITTEE_LANES.map((lane) => ({
            lane,
            roles: groupRoles.filter((role) => role.committeeLane === lane),
          })).filter((lane) => lane.roles.length > 0)
        : []

    return { group, roles: groupRoles, lanes }
  })

  groups.push({
    group: 'Polling Stations',
    roles: nodes.filter((role) => POLLING_STATION_ROLES.has(role.name)),
    lanes: [],
  })

  const permissionCount = new Set(nodes.flatMap((role) => role.permissions.map(permissionKey))).size

  return {
    counts: {
      parentGroups: groups.length,
      roles: nodes.length,
      committeeLanes: COMMITTEE_LANES.length,
      protectedRoles: nodes.filter((role) => role.protected).length,
      twoFactorRoles: nodes.filter((role) => role.requires2fa).length,
      permissions: permissionCount,
      regions: operationalCounts.regions,
      constituencies: operationalCounts.constituencies,
      pollingStations: operationalCounts.pollingStations,
    },
    groups,
    roadmap: ORG_ROADMAP,
  }
}

export function roleMatchesStructureFilters(
  role: RoleNode,
  filters: {
    search: string
    parent: OrgParentGroup | 'all'
    lane: CommitteeLane | 'all'
    scope: RoleScopeType | 'all'
    protectedOnly: boolean
    twoFactorOnly: boolean
  }
) {
  const query = filters.search.trim().toLowerCase()
  const matchesSearch =
    query.length === 0 ||
    role.label.toLowerCase().includes(query) ||
    role.name.toLowerCase().includes(query) ||
    (role.description ?? '').toLowerCase().includes(query)
  const matchesParent =
    filters.parent === 'all' ||
    role.parentGroup === filters.parent ||
    (filters.parent === 'Polling Stations' && POLLING_STATION_ROLES.has(role.name))
  const matchesLane = filters.lane === 'all' || role.committeeLane === filters.lane
  const matchesScope = filters.scope === 'all' || role.scopeType === filters.scope
  const matchesProtected = !filters.protectedOnly || role.protected
  const matches2fa = !filters.twoFactorOnly || role.requires2fa

  return (
    matchesSearch && matchesParent && matchesLane && matchesScope && matchesProtected && matches2fa
  )
}

export const organizationalStructureService = {
  async getDashboardData(): Promise<OrganizationalStructureData> {
    const [roles, assignedCounts, regions, constituencies, pollingStations] = await Promise.all([
      roleService.getRoles(),
      getAssignedUserCounts(),
      getCount('ghana_regions'),
      getCount('ghana_constituencies'),
      getCount('polling_stations'),
    ])

    return buildOrganizationalStructureData(roles, assignedCounts, {
      regions,
      constituencies,
      pollingStations,
    })
  },
}
