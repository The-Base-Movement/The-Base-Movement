import { describe, expect, it } from 'vitest'
import {
  ROLE_CATALOG,
  getDefaultRolePermissions,
  getRoleCatalogEntry,
  isProtectedRole,
  isRemovingOwnLastSuperAdmin,
  requiresRole2fa,
  userCan,
} from '@/lib/roleCatalog'
import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

const perm = (
  action: AdminPermission['action'],
  resource: AdminPermission['resource']
): AdminPermission => ({ action, resource })

const admin = (
  role: AdminRole,
  permissions: AdminPermission[],
  extras: Partial<AdminUser> & Record<string, unknown> = {}
) =>
  ({
    id: 'admin-1',
    email: 'admin@example.test',
    name: 'Admin User',
    role,
    permissions,
    ...extras,
  }) as AdminUser & Record<string, unknown>

describe('roleCatalog policy', () => {
  it('allows Super Admin full access when elevated 2FA is satisfied', () => {
    const user = admin('SUPER_ADMIN', [], { aal: 'aal2' })
    expect(userCan(user, perm('MANAGE_DONATIONS', 'DONATIONS'))).toBe(true)
  })

  it('keeps Board Chair in oversight access without system settings access', () => {
    const user = admin('BOARD_CHAIR', [perm('VIEW_ADMINS', 'ADMINS')], { mfaVerified: true })
    expect(userCan(user, perm('VIEW_ADMINS', 'ADMINS'))).toBe(true)
    expect(userCan(user, perm('VIEW_AUDIT_LOGS', 'SYSTEM'))).toBe(false)
  })

  it('lets ICT Director manage users, roles, permissions, and 2FA-gated access', () => {
    const user = admin(
      'ICT_DIRECTOR',
      [
        perm('VERIFY_MEMBER', 'MEMBERS'),
        perm('VIEW_ADMINS', 'ADMINS'),
        perm('VIEW_AUDIT_LOGS', 'SYSTEM'),
      ],
      { aal: 'aal2' }
    )
    expect(requiresRole2fa('ICT_DIRECTOR')).toBe(true)
    expect(userCan(user, perm('VERIFY_MEMBER', 'MEMBERS'))).toBe(true)
    expect(userCan(user, perm('VIEW_ADMINS', 'ADMINS'))).toBe(true)
    expect(userCan(user, perm('VIEW_AUDIT_LOGS', 'SYSTEM'))).toBe(true)
  })

  it('lets IT Manager view logs and technical settings', () => {
    const user = admin(
      'IT_MANAGER',
      [perm('VIEW_AUDIT_LOGS', 'SYSTEM'), perm('SUBMIT_IT_TICKET', 'IT_SUPPORT')],
      { aal: 'aal2' }
    )
    expect(userCan(user, perm('VIEW_AUDIT_LOGS', 'SYSTEM'))).toBe(true)
    expect(userCan(user, perm('SUBMIT_IT_TICKET', 'IT_SUPPORT'))).toBe(true)
  })

  it('keeps Intelligence Analyst read/report focused without operational writes', () => {
    const user = admin('INTELLIGENCE_ANALYST', [perm('VIEW_WAR_ROOM', 'OPERATIONS')])
    expect(userCan(user, perm('VIEW_WAR_ROOM', 'OPERATIONS'))).toBe(true)
    expect(userCan(user, perm('MANAGE_CHAPTER', 'CHAPTERS'))).toBe(false)
  })

  it('blocks a Regional Director from another region', () => {
    const user = admin('REGIONAL_DIRECTOR', [perm('VERIFY_MEMBER', 'MEMBERS')], {
      assigned_region: 'Ashanti',
      mfaVerified: true,
    })
    expect(userCan(user, perm('VERIFY_MEMBER', 'MEMBERS'), { region: 'Ashanti' })).toBe(true)
    expect(userCan(user, perm('VERIFY_MEMBER', 'MEMBERS'), { region: 'Volta' })).toBe(false)
  })

  it('blocks a Constituency Lead from another constituency', () => {
    const user = admin('CONSTITUENCY_LEAD', [perm('MANAGE_CHAPTER', 'CHAPTERS')], {
      assigned_constituency: 'Ablekuma West',
      mfaVerified: true,
    })
    expect(
      userCan(user, perm('MANAGE_CHAPTER', 'CHAPTERS'), { constituency: 'Ablekuma West' })
    ).toBe(true)
    expect(
      userCan(user, perm('MANAGE_CHAPTER', 'CHAPTERS'), { constituency: 'Ablekuma North' })
    ).toBe(false)
  })

  it('lets Field Agent verify members only inside assigned constituency', () => {
    const user = admin('FIELD_AGENT', [perm('VERIFY_MEMBER', 'MEMBERS')], {
      assigned_constituency: 'Ayawaso West',
    })
    expect(userCan(user, perm('VERIFY_MEMBER', 'MEMBERS'), { constituency: 'Ayawaso West' })).toBe(
      true
    )
    expect(userCan(user, perm('VERIFY_MEMBER', 'MEMBERS'), { constituency: 'Ayawaso East' })).toBe(
      false
    )
  })

  it('limits Polling Station Agent to the assigned station', () => {
    const user = admin('POLLING_STATION_AGENT', [perm('VIEW_POLLING_STATIONS', 'OPERATIONS')], {
      assigned_polling_station: 'ps-1',
    })
    expect(userCan(user, perm('VIEW_POLLING_STATIONS', 'OPERATIONS'), { id: 'ps-1' })).toBe(true)
    expect(userCan(user, perm('VIEW_POLLING_STATIONS', 'OPERATIONS'), { id: 'ps-2' })).toBe(false)
  })

  it('keeps Audit / Compliance Officer read-only', () => {
    const user = admin('AUDIT_COMPLIANCE_OFFICER', [perm('VIEW_AUDIT_LOGS', 'SYSTEM')], {
      aal: 'aal2',
    })
    expect(userCan(user, perm('VIEW_AUDIT_LOGS', 'SYSTEM'))).toBe(true)
    expect(userCan(user, perm('MANAGE_DONATIONS', 'DONATIONS'))).toBe(false)
  })

  it('requires 2FA for elevated roles when MFA state is supplied', () => {
    const user = admin('SECURITY_DIRECTOR', [perm('VIEW_AUDIT_LOGS', 'SYSTEM')], {
      mfaVerified: false,
    })
    expect(userCan(user, perm('VIEW_AUDIT_LOGS', 'SYSTEM'))).toBe(false)
  })

  it('marks protected roles as not deletable', () => {
    expect(isProtectedRole('SUPER_ADMIN')).toBe(true)
    expect(isProtectedRole('ICT_DIRECTOR')).toBe(true)
    expect(isProtectedRole('BOARD_SECRETARY')).toBe(false)
  })

  it('blocks removing the current user’s last Super Admin role', () => {
    expect(
      isRemovingOwnLastSuperAdmin({
        currentUserId: 'admin-1',
        targetUserId: 'admin-1',
        currentTargetRole: 'SUPER_ADMIN',
        nextRole: 'ADMIN',
        allAdminRoles: [{ id: 'admin-1', role: 'SUPER_ADMIN' }],
      })
    ).toBe(true)
  })

  it('groups roles by parent group and committee lane', () => {
    expect(getRoleCatalogEntry('CHIEF_EDITOR').parentGroup).toBe('NCC')
    expect(getRoleCatalogEntry('CHIEF_EDITOR').committeeLane).toBe('Media & Communications')
    expect(getRoleCatalogEntry('REGIONAL_FINANCE_OFFICER').committeeLane).toBe(
      'Finance & Fundraising'
    )
    expect(getRoleCatalogEntry('CONSTITUENCY_LEAD').parentGroup).toBe('CCC')
  })

  it('includes every approved missing-role name in the catalog', () => {
    const roleNames = new Set(ROLE_CATALOG.map((entry) => entry.role))
    const expectedRoles: AdminRole[] = [
      'BOARD_CHAIR',
      'BOARD_SECRETARY',
      'AUDIT_COMPLIANCE_OFFICER',
      'LEGAL_OFFICER',
      'BOARD_MEMBER',
      'BOARD_TREASURER',
      'BOARD_ADVISOR',
      'ICT_DIRECTOR',
      'DATABASE_MANAGER',
      'WEB_APP_MANAGER',
      'DATA_PROTECTION_OFFICER',
      'DEPUTY_SECURITY_DIRECTOR',
      'FIELD_INTELLIGENCE_OFFICER',
      'REGIONAL_LOGISTICS_OFFICER',
      'CONSTITUENCY_LOGISTICS_OFFICER',
      'POLLING_STATION_COORDINATOR',
      'POLLING_STATION_AGENT',
      'MEMBERSHIP_OFFICER',
    ]
    expectedRoles.forEach((role) => expect(roleNames.has(role)).toBe(true))
  })

  it('relocates existing roles that were in the wrong parent group', () => {
    expect(getRoleCatalogEntry('CHAPTER_LEAD').parentGroup).toBe('CCC')
    expect(getRoleCatalogEntry('CHAPTER_LEAD').committeeLane).toBe('Operations & Organising')
    expect(getRoleCatalogEntry('STORE_MANAGER').parentGroup).toBe('NCC')
    expect(getRoleCatalogEntry('STORE_MANAGER').committeeLane).toBe('Operations & Organising')
    expect(getRoleCatalogEntry('MOVEMENT_LEADER').parentGroup).toBe('BOARD')
  })

  it('provides default permissions for catalog-only roles', () => {
    expect(getDefaultRolePermissions('BOARD_CHAIR')).toContainEqual(perm('VIEW_ADMINS', 'ADMINS'))
    expect(getDefaultRolePermissions('NATIONAL_MEDIA_DIRECTOR')).toContainEqual(
      perm('MANAGE_BLOGS', 'BLOGS')
    )
    expect(getDefaultRolePermissions('REGIONAL_FINANCE_OFFICER')).toContainEqual(
      perm('VIEW_FINANCE', 'FINANCE')
    )
    expect(getDefaultRolePermissions('POLLING_STATION_AGENT')).toContainEqual(
      perm('VIEW_POLLING_STATIONS', 'OPERATIONS')
    )
  })
})
