/**
 * @file adminRouteAccess.ts
 * @description Implements route access permission checks for administrative pages.
 * Validates active administrator user roles and explicitly mapped permission scopes.
 */

import { getNavGroups, type NavItem } from '@/components/layouts/admin/navConfig'
import { DEPARTMENT_CATALOG } from '@/lib/departmentCatalog'
import { userCan } from '@/lib/roleCatalog'
import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

/**
 * Access specifications defined for a particular route
 */
type RouteAccessSpec = {
  /** Optional array of AdminRoles allowed to access the route */
  allowedRoles?: AdminRole[]
  /** Optional action and resource permission scope required for route access */
  permission?: {
    action: AdminPermission['action']
    resource: AdminPermission['resource']
  }
  /** Flag showing if route is only accessible by SUPER_ADMIN or FOUNDER roles */
  superAdminOnly?: boolean
  /** Flag showing if route is only accessible by leadership roles (EXECUTIVE/SUPER_ADMIN/FOUNDER) */
  executiveOnly?: boolean
}

/**
 * Route matching rule mapping path spec to access specifications
 */
type RouteRule = RouteAccessSpec & {
  /** Source origin defining the rule (e.g. nav-config) */
  source: string
  /** URL path target */
  to: string
  /** Matching strategy for matching pathnames */
  match: 'exact' | 'exact_or_descendant' | 'descendant_only'
}

/**
 * Outcome decision object returned by route validation checks
 */
type AccessDecision = {
  /** Indicates if route access is allowed for the user */
  allowed: boolean
  /** Error description explaining access denial, if applicable */
  reason: string | null
  /** The matching routing rule applied to compute this decision, if any */
  rule: RouteRule | null
}

const GLOBAL_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']
const DIASPORA_AFFAIRS_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'DIASPORA_AFFAIRS_OFFICER']

const DEPARTMENT_ROUTE_RULES: RouteRule[] = DEPARTMENT_CATALOG.map((department) => ({
  to: `/admin/departments/${department.id}`,
  match: 'exact_or_descendant',
  allowedRoles: department.access?.allowedRoles,
  permission: department.access?.permission,
  source: `department-${department.id}`,
}))

const MANUAL_ROUTE_RULES: RouteRule[] = [
  // ── Permission-based routes (respect database role config) ──
  {
    to: '/admin/media-hub',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    source: 'media-hub',
  },
  {
    to: '/admin/media',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    source: 'media-library',
  },
  {
    to: '/admin/authors',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    source: 'content-authors',
  },
  {
    to: '/admin/redirects',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    source: 'content-redirects',
  },
  {
    to: '/admin/trash',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    source: 'audit-trash',
  },
  {
    to: '/admin/store',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
    source: 'store-inventory',
  },
  {
    to: '/admin/orders',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
    source: 'store-orders',
  },
  {
    to: '/admin/rally-command',
    match: 'exact_or_descendant',
    permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
    source: 'field-operations-rally-command',
  },
  {
    to: '/admin/priorities',
    match: 'exact_or_descendant',
    permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
    source: 'strategic-priorities',
  },
  // ── Role-gated routes (no matching permission exists) ──
  {
    to: '/admin/diaspora-affairs',
    match: 'exact_or_descendant',
    allowedRoles: DIASPORA_AFFAIRS_ROLES,
    source: 'diaspora-affairs',
  },
  {
    to: '/admin/it-department',
    match: 'exact_or_descendant',
    allowedRoles: GLOBAL_ROLES,
    source: 'it-department',
  },
  {
    to: '/admin/notifications',
    match: 'exact_or_descendant',
    source: 'personal-admin-notifications',
  },
  // ── Department dashboards (canonical hierarchy departments only) ──
  ...DEPARTMENT_ROUTE_RULES,
  {
    to: '/admin/departments',
    match: 'exact',
    allowedRoles: ['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE'],
    source: 'department-index',
  },
]

const NAV_ROUTE_RULES = buildNavRouteRules()

/**
 * Recursively parses dynamic admin layout configurations to generate list of route access rules.
 *
 * @returns Array of parsed RouteRules.
 */
function buildNavRouteRules(): RouteRule[] {
  const groups = getNavGroups(0, 0, 0)
  const rules: RouteRule[] = []

  const visitItems = (items: NavItem[], inherited?: RouteAccessSpec) => {
    items.forEach((item) => {
      const spec: RouteAccessSpec = {
        allowedRoles: (item.allowedRoles as AdminRole[] | undefined) ?? inherited?.allowedRoles,
        permission: item.permission ?? inherited?.permission,
        superAdminOnly: item.superAdminOnly ?? inherited?.superAdminOnly,
        executiveOnly: item.executiveOnly ?? inherited?.executiveOnly,
      }

      rules.push({
        ...spec,
        source: 'nav-config',
        to: item.to,
        match: item.to === '/admin/departments' ? 'exact' : 'exact_or_descendant',
      })

      if (item.subItems?.length) {
        visitItems(item.subItems, spec)
      }
    })
  }

  groups.forEach((group) => visitItems(group.items))

  return rules
}

/**
 * Validates if the target path matches the rule specification path.
 */
function matchesRule(rule: RouteRule, pathname: string): boolean {
  if (rule.match === 'exact') {
    return pathname === rule.to
  }

  if (rule.match === 'descendant_only') {
    return pathname.startsWith(`${rule.to}/`)
  }

  return pathname === rule.to || pathname.startsWith(`${rule.to}/`)
}

/**
 * Formats roles array into readable string representation.
 */
function formatRoles(roles: AdminRole[]): string {
  return roles.join(', ')
}

/**
 * Selects the route rule mapping containing the most specific pathname match.
 *
 * @param pathname - Current URL path.
 * @returns Matching RouteRule object, or null if unmapped.
 */
export function getAdminRouteRule(pathname: string): RouteRule | null {
  const matches = [...MANUAL_ROUTE_RULES, ...NAV_ROUTE_RULES]
    .filter((rule) => matchesRule(rule, pathname))
    .sort((left, right) => right.to.length - left.to.length)

  return matches[0] ?? null
}

/**
 * Computes access permission status for an admin user navigating to a target URL pathname.
 *
 * @param user - Current authenticated AdminUser data object, or null.
 * @param pathname - Destination admin site pathname.
 * @returns AccessDecision object containing resolution status.
 */
export function getAdminRouteAccessDecision(
  user: AdminUser | null,
  pathname: string
): AccessDecision {
  if (!user) {
    return { allowed: false, reason: 'Admin session required.', rule: null }
  }

  const rule = getAdminRouteRule(pathname)
  if (!rule) {
    return {
      allowed: false,
      reason: 'This admin route is not mapped to an explicit access policy.',
      rule: null,
    }
  }

  if (rule.allowedRoles?.length) {
    const allowed = rule.allowedRoles.includes(user.role)
    return {
      allowed,
      reason: allowed ? null : `Allowed roles: ${formatRoles(rule.allowedRoles)}.`,
      rule,
    }
  }

  if (rule.superAdminOnly) {
    const allowed = user.role === 'SUPER_ADMIN' || user.role === 'FOUNDER'
    return {
      allowed,
      reason: allowed ? null : 'Restricted to Super Admin and Founder roles.',
      rule,
    }
  }

  if (rule.executiveOnly) {
    const allowed =
      user.role === 'EXECUTIVE' || user.role === 'SUPER_ADMIN' || user.role === 'FOUNDER'
    return {
      allowed,
      reason: allowed ? null : 'Restricted to executive leadership roles.',
      rule,
    }
  }

  if (rule.permission) {
    const allowed = userCan(user, rule.permission)
    return {
      allowed,
      reason: allowed ? null : `Requires ${rule.permission.action} on ${rule.permission.resource}.`,
      rule,
    }
  }

  return { allowed: true, reason: null, rule }
}
