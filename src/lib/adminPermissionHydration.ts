import { getDefaultRolePermissions } from '@/lib/roleCatalog'
import type { AdminPermission, AdminRole } from '@/types/admin'

type LegacyPermissionFlags = Partial<
  Record<
    | 'can_manage_members'
    | 'can_delete_members'
    | 'can_manage_chapters'
    | 'can_appoint_lead'
    | 'can_manage_polls'
    | 'can_manage_store'
    | 'can_view_audit_logs'
    | 'can_post_blog'
    | 'can_manage_newsletters'
    | 'can_manage_donations',
    boolean
  >
>

const legacyPermissionMap: Record<keyof LegacyPermissionFlags, AdminPermission> = {
  can_manage_members: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
  can_delete_members: { action: 'DELETE_MEMBER', resource: 'MEMBERS' },
  can_manage_chapters: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
  can_appoint_lead: { action: 'APPOINT_LEAD', resource: 'CHAPTERS' },
  can_manage_polls: { action: 'MANAGE_POLLS', resource: 'POLLS' },
  can_manage_store: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
  can_view_audit_logs: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
  can_post_blog: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
  can_manage_newsletters: { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' },
  can_manage_donations: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
}

function isAdminPermission(value: unknown): value is AdminPermission {
  if (!value || typeof value !== 'object') return false
  const permission = value as Partial<AdminPermission>
  return typeof permission.action === 'string' && typeof permission.resource === 'string'
}

export function resolveStoredAdminPermissions(
  role: AdminRole,
  storedPermissions: unknown
): AdminPermission[] {
  if (Array.isArray(storedPermissions)) {
    return storedPermissions.filter(isAdminPermission)
  }

  if (storedPermissions && typeof storedPermissions === 'object') {
    const flags = storedPermissions as LegacyPermissionFlags
    const hasLegacyFlags = Object.keys(flags).some((key) => key in legacyPermissionMap)

    if (hasLegacyFlags) {
      return Object.entries(legacyPermissionMap)
        .filter(([key]) => Boolean(flags[key as keyof LegacyPermissionFlags]))
        .map(([, permission]) => permission)
    }
  }

  return getDefaultRolePermissions(role)
}
