import { describe, expect, it } from 'vitest'
import { getAdminRouteAccessDecision } from '@/lib/adminRouteAccess'
import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

const admin = (role: AdminRole, permissions: AdminPermission[]): AdminUser =>
  ({
    id: 'admin-1',
    email: 'admin@example.test',
    name: 'Admin User',
    role,
    permissions,
    aal: 'aal2',
  }) as AdminUser

const cases: Array<{
  path: string
  permission: AdminPermission
}> = [
  {
    path: '/admin/members/member-1',
    permission: { action: 'VIEW_MEMBER_DIRECTORY', resource: 'MEMBERS' },
  },
  {
    path: '/admin/donations',
    permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
  },
  {
    path: '/admin/priorities',
    permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
  },
  {
    path: '/admin/newsletter/analytics',
    permission: { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' },
  },
  {
    path: '/admin/store',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
  },
  {
    path: '/admin/orders',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
  },
  {
    path: '/admin/administrators',
    permission: { action: 'VIEW_ADMINS', resource: 'ADMINS' },
  },
]

describe('sensitive admin route access', () => {
  it.each(cases)('requires $permission.action on $path', ({ path, permission }) => {
    expect(getAdminRouteAccessDecision(admin('ADMIN', []), path).allowed).toBe(false)
    expect(getAdminRouteAccessDecision(admin('ADMIN', [permission]), path).allowed).toBe(true)
  })

  it('fails closed for an unmapped admin route', () => {
    expect(getAdminRouteAccessDecision(admin('SUPER_ADMIN', []), '/admin/unmapped').allowed).toBe(
      false
    )
  })
})
