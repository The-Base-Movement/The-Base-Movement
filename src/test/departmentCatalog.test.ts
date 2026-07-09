import { describe, expect, it } from 'vitest'
import {
  CANONICAL_DEPARTMENT_IDS,
  DEPARTMENT_CATALOG,
  getDepartmentCatalogRow,
  getDepartmentCatalogRows,
} from '@/lib/departmentCatalog'
import { getAdminRouteAccessDecision, getAdminRouteRule } from '@/lib/adminRouteAccess'
import type { AdminUser } from '@/types/admin'

const superAdmin = {
  id: 'admin-1',
  email: 'admin@example.test',
  name: 'Admin User',
  role: 'SUPER_ADMIN',
  permissions: [],
} as AdminUser

describe('departmentCatalog', () => {
  it('defines the approved organizational level departments', () => {
    expect(DEPARTMENT_CATALOG.map((department) => department.id)).toEqual([
      'board-governance',
      'ncc',
      'rcc',
      'ccc',
      'polling-stations',
    ])
  })

  it('does not treat legacy department slugs as canonical URLs', () => {
    ;[
      'finance',
      'national-ict',
      'security-intel',
      'operations-organising',
      'media-communications',
      'finance-fundraising',
      'research-policy',
      'appointment-welfare',
      'media',
      'store',
      'it',
      'membership',
      'field',
      'intelligence',
      'chapter',
      'constituency',
      'youth',
      'founder',
      'organizer',
      'executive',
      'movement_leader',
    ].forEach((slug) => {
      expect(CANONICAL_DEPARTMENT_IDS.has(slug)).toBe(false)
      expect(getAdminRouteRule(`/admin/departments/${slug}`)).toBeNull()
    })
  })

  it('lets Super Admin access every canonical department route', () => {
    DEPARTMENT_CATALOG.forEach((department) => {
      expect(
        getAdminRouteAccessDecision(superAdmin, `/admin/departments/${department.id}`).allowed
      ).toBe(true)
    })
  })

  it('can provide helpdesk-shaped fallback rows for every canonical department', () => {
    expect(getDepartmentCatalogRows()).toHaveLength(DEPARTMENT_CATALOG.length)
    expect(getDepartmentCatalogRow('board-governance')).toMatchObject({
      id: 'board-governance',
      name: 'Board / Governance',
      icon: 'corporate_fare',
      sort_order: 1,
      active: true,
      lead_id: null,
    })
    expect(getDepartmentCatalogRow('media')).toBeNull()
  })
})
