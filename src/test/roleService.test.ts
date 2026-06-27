import { describe, expect, it } from 'vitest'
import { resolveRolePermissions } from '@/services/roleService'
import { getDefaultRolePermissions } from '@/lib/roleCatalog'
import type { AdminPermission } from '@/types/admin'

const permission = (
  action: AdminPermission['action'],
  resource: AdminPermission['resource']
): AdminPermission => ({ action, resource })

describe('roleService permission resolution', () => {
  it('uses database permissions for existing catalog roles', () => {
    const dbPermissions = [permission('VIEW_ADMINS', 'ADMINS')]

    expect(resolveRolePermissions('ADMIN', dbPermissions)).toEqual(dbPermissions)
  })

  it('falls back to catalog defaults when a catalog role has no database permissions', () => {
    expect(resolveRolePermissions('ADMIN', [])).toEqual(getDefaultRolePermissions('ADMIN'))
  })

  it('keeps custom roles empty when no permissions are stored', () => {
    expect(resolveRolePermissions('CUSTOM_TEST_ROLE', [])).toEqual([])
  })
})
