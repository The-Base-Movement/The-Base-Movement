import { describe, expect, it } from 'vitest'
import {
  ADMIN_PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSIONS,
  hasAdminPermission,
} from '@/lib/adminPermissionCatalog'

describe('admin permission catalog', () => {
  it('exposes every grouped permission in the flat list', () => {
    const groupedCount = ADMIN_PERMISSION_GROUPS.reduce(
      (count, group) => count + group.items.length,
      0
    )

    expect(ALL_ADMIN_PERMISSIONS).toHaveLength(groupedCount)
  })

  it('checks permissions by action and resource together', () => {
    expect(
      hasAdminPermission(
        [{ action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' }],
        'VIEW_AUDIT_LOGS',
        'SYSTEM'
      )
    ).toBe(true)
    expect(
      hasAdminPermission(
        [{ action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' }],
        'VIEW_AUDIT_LOGS',
        'ADMINS'
      )
    ).toBe(false)
  })
})
