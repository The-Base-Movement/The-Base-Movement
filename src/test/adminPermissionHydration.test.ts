import { describe, expect, it } from 'vitest'
import { resolveStoredAdminPermissions } from '@/lib/adminPermissionHydration'
import { getDefaultRolePermissions } from '@/lib/roleCatalog'
import type { AdminPermission } from '@/types/admin'

const permission = (
  action: AdminPermission['action'],
  resource: AdminPermission['resource']
): AdminPermission => ({ action, resource })

describe('admin permission hydration', () => {
  it('uses stored permission arrays for approved roles', () => {
    const stored = [permission('VIEW_AUDIT_LOGS', 'SYSTEM')]

    expect(resolveStoredAdminPermissions('SUPER_ADMIN', stored)).toEqual(stored)
  })

  it('keeps an empty stored array as an intentional override', () => {
    expect(resolveStoredAdminPermissions('SUPER_ADMIN', [])).toEqual([])
  })

  it('maps legacy permission flags when admins were provisioned by RPC', () => {
    expect(
      resolveStoredAdminPermissions('ADMIN', {
        can_manage_members: true,
        can_delete_members: false,
        can_view_audit_logs: true,
      })
    ).toEqual([permission('VERIFY_MEMBER', 'MEMBERS'), permission('VIEW_AUDIT_LOGS', 'SYSTEM')])
  })

  it('falls back to role defaults when no permissions are stored', () => {
    expect(resolveStoredAdminPermissions('ICT_DIRECTOR', null)).toEqual(
      getDefaultRolePermissions('ICT_DIRECTOR')
    )
  })
})
