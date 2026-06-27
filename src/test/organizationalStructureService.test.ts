import { describe, expect, it } from 'vitest'
import { getRoleCatalogEntry, getDefaultRolePermissions } from '@/lib/roleCatalog'
import {
  buildOrganizationalStructureData,
  roleMatchesStructureFilters,
  type RoleNode,
} from '@/services/organizationalStructureService'
import type { AdminRoleRecord } from '@/services/roleService'
import type { AdminRole } from '@/types/admin'

function roleRecord(role: AdminRole): AdminRoleRecord {
  const meta = getRoleCatalogEntry(role)
  return {
    id: `catalog:${role}`,
    name: role,
    description: meta.label,
    is_system: true,
    created_at: '',
    permissions: getDefaultRolePermissions(role),
    label: meta.label,
    parentGroup: meta.parentGroup,
    committeeLane: meta.committeeLane,
    scopeType: meta.scopeType,
    protected: meta.protected,
    requires2fa: meta.requires2fa,
  }
}

describe('organizationalStructureService helpers', () => {
  it('groups NCC, RCC, and CCC roles by committee lane', () => {
    const data = buildOrganizationalStructureData([
      roleRecord('CHIEF_EDITOR'),
      roleRecord('REGIONAL_FINANCE_OFFICER'),
      roleRecord('CHAPTER_LEAD'),
    ])

    const ncc = data.groups.find((group) => group.group === 'NCC')
    const rcc = data.groups.find((group) => group.group === 'RCC')
    const ccc = data.groups.find((group) => group.group === 'CCC')

    expect(ncc?.lanes.find((lane) => lane.lane === 'Media & Communications')?.roles[0].name).toBe(
      'CHIEF_EDITOR'
    )
    expect(rcc?.lanes.find((lane) => lane.lane === 'Finance & Fundraising')?.roles[0].name).toBe(
      'REGIONAL_FINANCE_OFFICER'
    )
    expect(ccc?.lanes.find((lane) => lane.lane === 'Operations & Organising')?.roles[0].name).toBe(
      'CHAPTER_LEAD'
    )
  })

  it('adds a polling station structure group without inventing operational counts', () => {
    const data = buildOrganizationalStructureData([roleRecord('POLLING_STATION_AGENT')])

    expect(data.groups.find((group) => group.group === 'Polling Stations')?.roles[0].name).toBe(
      'POLLING_STATION_AGENT'
    )
    expect(data.counts.regions).toBeNull()
    expect(data.counts.constituencies).toBeNull()
    expect(data.counts.pollingStations).toBeNull()
  })

  it('preserves real operational counts when available', () => {
    const data = buildOrganizationalStructureData(
      [roleRecord('FOUNDER'), roleRecord('IT_MANAGER')],
      new Map([['FOUNDER', 1]]),
      { regions: 16, constituencies: 275, pollingStations: 45000 }
    )

    expect(data.counts.parentGroups).toBe(7)
    expect(data.counts.regions).toBe(16)
    expect(data.counts.constituencies).toBe(275)
    expect(data.counts.pollingStations).toBe(45000)
    expect(data.groups.find((group) => group.group === 'BOARD')?.roles[0].assignedUsersCount).toBe(
      1
    )
  })

  it('filters roles by search, parent, lane, scope, protected and 2FA requirements', () => {
    const founder = {
      ...roleRecord('FOUNDER'),
      assignedUsersCount: 1,
    } satisfies RoleNode
    const editor = {
      ...roleRecord('EDITOR'),
      assignedUsersCount: 0,
    } satisfies RoleNode

    expect(
      roleMatchesStructureFilters(founder, {
        search: 'founder',
        parent: 'BOARD',
        lane: 'all',
        scope: 'national',
        protectedOnly: true,
        twoFactorOnly: true,
      })
    ).toBe(true)
    expect(
      roleMatchesStructureFilters(editor, {
        search: '',
        parent: 'BOARD',
        lane: 'all',
        scope: 'all',
        protectedOnly: false,
        twoFactorOnly: false,
      })
    ).toBe(false)
  })
})
