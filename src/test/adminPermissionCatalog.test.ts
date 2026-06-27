import { describe, expect, it } from 'vitest'
import {
  ADMIN_PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSIONS,
  getAdminPermissionLabel,
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

  it('returns display labels for stored row permissions', () => {
    expect(getAdminPermissionLabel({ action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' })).toBe(
      'View audit logs & system data'
    )
    expect(getAdminPermissionLabel({ action: 'VIEW_POLLS', resource: 'POLLS' })).toBe(
      'View polls (read-only)'
    )
  })
})
