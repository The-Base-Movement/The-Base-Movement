import { getNavGroups, type NavItem } from '@/components/layouts/admin/navConfig'
import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

type RouteAccessSpec = {
  allowedRoles?: AdminRole[]
  permission?: {
    action: AdminPermission['action']
    resource: AdminPermission['resource']
  }
  superAdminOnly?: boolean
  executiveOnly?: boolean
}

type RouteRule = RouteAccessSpec & {
  source: string
  to: string
  match: 'exact_or_descendant' | 'descendant_only'
}

type AccessDecision = {
  allowed: boolean
  reason: string | null
  rule: RouteRule | null
}

const MANUAL_ROUTE_RULES: RouteRule[] = [
  {
    to: '/admin/notifications',
    match: 'exact_or_descendant',
    source: 'personal-admin-notifications',
  },
  {
    to: '/admin/departments',
    match: 'exact_or_descendant',
    allowedRoles: ['SUPER_ADMIN', 'FOUNDER'],
    source: 'department-dashboard-lead-management',
  },
  {
    to: '/admin/departments',
    match: 'descendant_only',
    allowedRoles: ['SUPER_ADMIN', 'FOUNDER'],
    source: 'department-dashboard-lead-management',
  },
  {
    to: '/admin/rally-command',
    match: 'exact_or_descendant',
    permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
    source: 'field-operations-rally-command',
  },
]

const PRIVILEGED_ROLES: AdminRole[] = ['SUPER_ADMIN', 'FOUNDER', 'EXECUTIVE']

const NAV_ROUTE_RULES = buildNavRouteRules()

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
        match: 'exact_or_descendant',
      })

      if (item.subItems?.length) {
        visitItems(item.subItems, spec)
      }
    })
  }

  groups.forEach((group) => visitItems(group.items))

  return rules
}

function matchesRule(rule: RouteRule, pathname: string): boolean {
  if (rule.match === 'descendant_only') {
    return pathname.startsWith(`${rule.to}/`)
  }

  return pathname === rule.to || pathname.startsWith(`${rule.to}/`)
}

function formatRoles(roles: AdminRole[]): string {
  return roles.join(', ')
}

function hasPermission(
  user: AdminUser,
  permission: NonNullable<RouteAccessSpec['permission']>
): boolean {
  if (PRIVILEGED_ROLES.includes(user.role)) return true

  return user.permissions.some(
    (granted) => granted.action === permission.action && granted.resource === permission.resource
  )
}

export function getAdminRouteRule(pathname: string): RouteRule | null {
  const matches = [...MANUAL_ROUTE_RULES, ...NAV_ROUTE_RULES]
    .filter((rule) => matchesRule(rule, pathname))
    .sort((left, right) => right.to.length - left.to.length)

  return matches[0] ?? null
}

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
    const allowed = hasPermission(user, rule.permission)
    return {
      allowed,
      reason: allowed ? null : `Requires ${rule.permission.action} on ${rule.permission.resource}.`,
      rule,
    }
  }

  return { allowed: true, reason: null, rule }
}
