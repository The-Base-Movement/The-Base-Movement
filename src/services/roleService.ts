import { supabase } from '@/lib/supabase'
import {
  ROLE_CATALOG,
  getDefaultRolePermissions,
  getRoleCatalogEntry,
  isProtectedRole,
  resolveRoleAlias,
} from '@/lib/roleCatalog'
import type { CommitteeLane, RoleParentGroup, RoleScopeType } from '@/lib/roleCatalog'
import type { AdminPermission } from '@/types/admin'

export interface AdminRoleRecord {
  id: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  permissions: AdminPermission[]
  label: string
  parentGroup: RoleParentGroup
  committeeLane?: CommitteeLane
  scopeType: RoleScopeType
  protected: boolean
  requires2fa: boolean
}

const CATALOG_ID_PREFIX = 'catalog:'
const catalogRoleNames = new Set<string>(ROLE_CATALOG.map((entry) => entry.role))

function toRoleRecord(row: {
  id: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
  admin_role_permissions?: AdminPermission[]
}): AdminRoleRecord {
  const name = resolveRoleAlias(row.name)
  const meta = getRoleCatalogEntry(name)
  const permissions = catalogRoleNames.has(name)
    ? getDefaultRolePermissions(name)
    : (row.admin_role_permissions ?? [])
  return {
    id: row.id,
    name,
    description: row.description,
    is_system: row.is_system,
    created_at: row.created_at,
    permissions,
    label: meta.label,
    parentGroup: meta.parentGroup,
    committeeLane: meta.committeeLane,
    scopeType: meta.scopeType,
    protected: meta.protected,
    requires2fa: meta.requires2fa,
  }
}

function uniqueByRoleName(roles: AdminRoleRecord[]): AdminRoleRecord[] {
  const seen = new Set<string>()
  return roles.filter((role) => {
    if (seen.has(role.name)) return false
    seen.add(role.name)
    return true
  })
}

export const roleService = {
  async getRoles(): Promise<AdminRoleRecord[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*, admin_role_permissions(action, resource)')
      .order('is_system', { ascending: false })
      .order('name')

    if (error) throw error

    const dbRoles = uniqueByRoleName(
      (data || []).map((r) =>
        toRoleRecord({
          ...r,
          admin_role_permissions: (r.admin_role_permissions || []) as AdminPermission[],
        })
      )
    )
    const existing = new Set(dbRoles.map((role) => role.name))
    const catalogRoles = ROLE_CATALOG.filter((entry) => !existing.has(entry.role)).map((entry) =>
      toRoleRecord({
        id: `${CATALOG_ID_PREFIX}${entry.role}`,
        name: entry.role,
        description: entry.label,
        is_system: true,
        created_at: '',
      })
    )

    return uniqueByRoleName([...dbRoles, ...catalogRoles]).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  },

  async createRole(
    name: string,
    description: string,
    permissions: AdminPermission[]
  ): Promise<AdminRoleRecord> {
    const slug = name.toUpperCase().replace(/\s+/g, '_')

    const { data: role, error } = await supabase
      .from('admin_roles')
      .insert({ name: slug, description, is_system: false })
      .select()
      .single()

    if (error) throw error

    if (permissions.length > 0) {
      const { error: permError } = await supabase
        .from('admin_role_permissions')
        .insert(
          permissions.map((p) => ({ role_id: role.id, action: p.action, resource: p.resource }))
        )

      if (permError) throw permError
    }

    const meta = getRoleCatalogEntry(role.name)
    return {
      ...role,
      permissions,
      label: meta.label,
      parentGroup: meta.parentGroup,
      committeeLane: meta.committeeLane,
      scopeType: meta.scopeType,
      protected: meta.protected,
      requires2fa: meta.requires2fa,
    }
  },

  async updateRole(
    id: string,
    name: string,
    description: string,
    permissions: AdminPermission[],
    isSystem: boolean
  ): Promise<void> {
    const slug = isSystem ? name : name.toUpperCase().replace(/\s+/g, '_')
    let roleId = id

    if (id.startsWith(CATALOG_ID_PREFIX)) {
      const { data: inserted, error: insertError } = await supabase
        .from('admin_roles')
        .insert({ name: slug, description, is_system: true })
        .select('id')
        .single()

      if (insertError) throw insertError
      roleId = inserted.id
    } else {
      const { error } = await supabase
        .from('admin_roles')
        .update({ name: slug, description })
        .eq('id', id)

      if (error) throw error
    }

    await supabase.from('admin_role_permissions').delete().eq('role_id', roleId)

    if (permissions.length > 0) {
      const { error: permError } = await supabase
        .from('admin_role_permissions')
        .insert(
          permissions.map((p) => ({ role_id: roleId, action: p.action, resource: p.resource }))
        )

      if (permError) throw permError
    }
  },

  async deleteRole(id: string): Promise<void> {
    const { data: role, error: lookupError } = await supabase
      .from('admin_roles')
      .select('name, is_system')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (!role || role.is_system || isProtectedRole(role.name)) {
      throw new Error('Protected system roles cannot be deleted.')
    }

    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', id)
      .eq('is_system', false)

    if (error) throw error
  },
}
