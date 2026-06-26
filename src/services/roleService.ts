import { supabase } from '@/lib/supabase'
import { getRoleCatalogEntry, isProtectedRole } from '@/lib/roleCatalog'
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

export const roleService = {
  async getRoles(): Promise<AdminRoleRecord[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*, admin_role_permissions(action, resource)')
      .order('is_system', { ascending: false })
      .order('name')

    if (error) throw error

    return (data || []).map((r) => {
      const meta = getRoleCatalogEntry(r.name)
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        is_system: r.is_system,
        created_at: r.created_at,
        permissions: (r.admin_role_permissions || []) as AdminPermission[],
        label: meta.label,
        parentGroup: meta.parentGroup,
        committeeLane: meta.committeeLane,
        scopeType: meta.scopeType,
        protected: meta.protected,
        requires2fa: meta.requires2fa,
      }
    })
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

    const { error } = await supabase
      .from('admin_roles')
      .update({ name: slug, description })
      .eq('id', id)

    if (error) throw error

    await supabase.from('admin_role_permissions').delete().eq('role_id', id)

    if (permissions.length > 0) {
      const { error: permError } = await supabase
        .from('admin_role_permissions')
        .insert(permissions.map((p) => ({ role_id: id, action: p.action, resource: p.resource })))

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
