/**
 * Roles Manager Page Component
 * -------------------------------------------------------------
 * Component for managing system and custom administrator roles and permissions.
 * Includes detail modals for creating, updating, and deleting roles.
 */

import { Fragment, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'
import { usePageLabel } from '@/contexts/PageLabelContext'
import {
  COMMITTEE_LANES,
  ROLE_PARENT_GROUPS,
  formatRoleName,
  getRoleCatalogEntry,
  isProtectedRole,
  type CommitteeLane,
  type RoleParentGroup,
  type RoleScopeType,
} from '@/lib/roleCatalog'
import { roleService, type AdminRoleRecord } from '@/services/roleService'
import type { AdminPermission } from '@/types/admin'

// ─── Permission catalogue ────────────────────────────────────────────────────

const PERMISSION_GROUPS: {
  label: string
  resource: AdminPermission['resource']
  items: { action: AdminPermission['action']; label: string }[]
}[] = [
  {
    label: 'Members',
    resource: 'MEMBERS',
    items: [
      { action: 'VIEW_MEMBER_DIRECTORY', label: 'View member directory (read-only)' },
      { action: 'VERIFY_MEMBER', label: 'Verify / approve members' },
      { action: 'DELETE_MEMBER', label: 'Delete members' },
    ],
  },
  {
    label: 'Chapters',
    resource: 'CHAPTERS',
    items: [
      { action: 'MANAGE_CHAPTER', label: 'Create & manage chapters' },
      { action: 'APPOINT_LEAD', label: 'Appoint chapter leads' },
    ],
  },
  {
    label: 'Polls',
    resource: 'POLLS',
    items: [
      { action: 'VIEW_POLLS', label: 'View polls (read-only)' },
      { action: 'MANAGE_POLLS', label: 'Create & manage polls' },
    ],
  },
  {
    label: 'Store',
    resource: 'STORE',
    items: [{ action: 'MANAGE_INVENTORY', label: 'Manage store inventory' }],
  },
  {
    label: 'Content',
    resource: 'BLOGS',
    items: [
      { action: 'MANAGE_BLOGS', label: 'Write & publish blog posts' },
      { action: 'MANAGE_NEWSLETTERS', label: 'Compose & send newsletters' },
    ],
  },
  {
    label: 'Donations',
    resource: 'DONATIONS',
    items: [{ action: 'MANAGE_DONATIONS', label: 'Review & verify donations' }],
  },
  {
    label: 'System',
    resource: 'SYSTEM',
    items: [{ action: 'VIEW_AUDIT_LOGS', label: 'View audit logs & system data' }],
  },
  {
    label: 'Finance',
    resource: 'FINANCE',
    items: [{ action: 'VIEW_FINANCE', label: 'View all finance pages' }],
  },
  {
    label: 'Operations',
    resource: 'OPERATIONS',
    items: [
      { action: 'VIEW_WAR_ROOM', label: 'View War Room' },
      { action: 'VIEW_DEPLOYMENT_METRICS', label: 'View Deployment Metrics' },
      { action: 'VIEW_CONSTITUENCY_OPS', label: 'View Constituency Operations' },
      { action: 'VIEW_POLLING_STATIONS', label: 'View Polling Stations' },
      { action: 'VIEW_MASS_MOBILIZATION', label: 'View Mass Mobilization' },
      { action: 'VIEW_DIRECTIVES', label: 'View Tactical Directives' },
      { action: 'VIEW_DEPLOY_ASSET', label: 'View Deploy Asset' },
    ],
  },
  {
    label: 'Strategy',
    resource: 'STRATEGY',
    items: [
      { action: 'VIEW_STRATEGIC_FOCUS', label: 'View Strategic Focus' },
      { action: 'VIEW_MISSION_PLAN', label: 'View Mission Plan' },
      { action: 'VIEW_ROADMAP', label: 'View Mission Roadmap' },
    ],
  },
  {
    label: 'Party & Administration',
    resource: 'PARTY',
    items: [{ action: 'VIEW_PARTY_OFFICIALS', label: 'View Party Officials' }],
  },
  {
    label: 'Admins (Read-Only)',
    resource: 'ADMINS',
    items: [{ action: 'VIEW_ADMINS', label: 'View administrator list (read-only)' }],
  },
  {
    label: 'IT Support',
    resource: 'IT_SUPPORT',
    items: [{ action: 'SUBMIT_IT_TICKET', label: 'Submit IT support tickets' }],
  },
]

const ALL_PERMISSIONS: AdminPermission[] = PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ action: i.action, resource: g.resource }))
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Helper function to format SCREAMING_SNAKE_CASE names into Title Case
const formatName = formatRoleName

// Helper function to determine if a permission set contains a specific action and resource
const hasPermission = (perms: AdminPermission[], action: string, resource: string) =>
  perms.some((p) => p.action === action && p.resource === resource)

const badgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'hsl(var(--container-low))',
  border: '1px solid hsl(var(--border))',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 9.5,
  color: 'hsl(var(--on-surface-muted))',
  whiteSpace: 'nowrap',
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}

const selectSt: React.CSSProperties = { ...inputSt, maxWidth: 190 }

// ─── Role Modal ───────────────────────────────────────────────────────────────

interface RoleModalProps {
  role: AdminRoleRecord | null
  onClose: () => void
  onSaved: () => void
}

// Dialog component for creating or editing roles and their permission listings
function RoleModal({ role, onClose, onSaved }: RoleModalProps) {
  const isEdit = !!role
  const [name, setName] = useState(role ? role.name : '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [permissions, setPermissions] = useState<AdminPermission[]>(role ? role.permissions : [])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const togglePermission = (
    action: AdminPermission['action'],
    resource: AdminPermission['resource']
  ) => {
    setPermissions((prev) => {
      if (hasPermission(prev, action, resource)) {
        return prev.filter((p) => !(p.action === action && p.resource === resource))
      }
      return [...prev, { action, resource }]
    })
  }

  const handleSelectAll = () => setPermissions([...ALL_PERMISSIONS])
  const handleClearAll = () => setPermissions([])

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Role name is required.')
      return
    }
    setError('')
    setIsSaving(true)
    try {
      if (isEdit && role) {
        await roleService.updateRole(
          role.id,
          trimmed,
          description.trim(),
          permissions,
          role.is_system
        )
      } else {
        await roleService.createRole(trimmed, description.trim(), permissions)
      }
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save role.')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 680,
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'clip',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isEdit ? 'Edit Role' : 'Create Role'}
            </h3>
            {isEdit && role && (
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
              >
                {formatName(role.name)}
              </p>
            )}
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: 24,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 130px)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {/* Name */}
            <div>
              <label
                htmlFor="role-name"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Role name
              </label>
              <input
                id="role-name"
                name="roleName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. FIELD_OFFICER"
                style={inputSt}
                disabled={isEdit && role?.is_system}
              />
              {!isEdit && (
                <p
                  style={{ margin: '4px 0 0', fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}
                >
                  Spaces become underscores and the name is uppercased automatically.
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="role-desc"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Description
              </label>
              <input
                id="role-desc"
                name="roleDescription"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role's responsibilities"
                style={inputSt}
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Permissions
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    color: 'hsl(var(--primary))',
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 4px',
                  }}
                >
                  All
                </button>
                <span style={{ color: 'hsl(var(--border))' }}>·</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '2px 4px',
                  }}
                >
                  None
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PERMISSION_GROUPS.map((group) => (
                <div
                  key={group.resource}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'hsl(var(--container-low))',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {group.label}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {group.items.map((item) => {
                      const checked = hasPermission(permissions, item.action, group.resource)
                      const checkId = `perm-${item.action}`
                      return (
                        <label
                          key={item.action}
                          htmlFor={checkId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            id={checkId}
                            name={checkId}
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(item.action, group.resource)}
                            style={{
                              width: 14,
                              height: 14,
                              accentColor: 'hsl(var(--primary))',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 12,
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {item.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: 'hsl(var(--destructive))',
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
            flexShrink: 0,
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={isSaving}
            onClick={handleSubmit}
          >
            {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create role'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteModalProps {
  role: AdminRoleRecord
  onClose: () => void
  onDeleted: () => void
}

// Modal component confirming the deletion of a specific custom role
function DeleteModal({ role, onClose, onDeleted }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Request the role service delete target role
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await roleService.deleteRole(role.id)
      onDeleted()
    } catch {
      setIsDeleting(false)
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--destructive))',
            }}
          >
            Delete Role
          </h3>
        </div>
        <div style={{ padding: 24 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.6,
            }}
          >
            Permanently delete <strong>{formatName(role.name)}</strong>? This cannot be undone.
            Admins currently assigned this role will lose their permissions.
          </p>
        </div>
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-dest btn-sm"
            style={{ flex: 1 }}
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting…' : 'Delete role'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// Main roles manager list component
export default function RolesManager() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('Roles Manager')
  }, [setCurrentLabel])

  const [roles, setRoles] = useState<AdminRoleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [parentFilter, setParentFilter] = useState<RoleParentGroup | 'all'>('all')
  const [laneFilter, setLaneFilter] = useState<CommitteeLane | 'all'>('all')
  const [scopeFilter, setScopeFilter] = useState<RoleScopeType | 'all'>('all')
  const [twoFactorFilter, setTwoFactorFilter] = useState<'all' | 'required'>('all')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editTarget, setEditTarget] = useState<AdminRoleRecord | null | 'new'>()
  const [deleteTarget, setDeleteTarget] = useState<AdminRoleRecord | null>(null)

  // Fetch all administrative roles from security services
  const load = async () => {
    setIsLoading(true)
    try {
      const data = await roleService.getRoles()
      setRoles(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filtered = roles.filter((r) => {
    const meta = getRoleCatalogEntry(r.name)
    const query = search.toLowerCase()
    const matchesSearch =
      r.name.toLowerCase().includes(query) ||
      meta.label.toLowerCase().includes(query) ||
      (r.description ?? '').toLowerCase().includes(query)

    const matchesParent = parentFilter === 'all' || meta.parentGroup === parentFilter
    const matchesLane = laneFilter === 'all' || meta.committeeLane === laneFilter
    const matchesScope = scopeFilter === 'all' || meta.scopeType === scopeFilter
    const matches2fa = twoFactorFilter === 'all' || meta.requires2fa

    return matchesSearch && matchesParent && matchesLane && matchesScope && matches2fa
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = formatName(a.name).localeCompare(formatName(b.name))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const boardCount = roles.filter((r) => getRoleCatalogEntry(r.name).parentGroup === 'BOARD').length
  const protectedCount = roles.filter((r) => getRoleCatalogEntry(r.name).protected).length
  const elevatedCount = roles.filter((r) => getRoleCatalogEntry(r.name).requires2fa).length
  const hasActiveFilters =
    search.trim() !== '' ||
    parentFilter !== 'all' ||
    laneFilter !== 'all' ||
    scopeFilter !== 'all' ||
    twoFactorFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setParentFilter('all')
    setLaneFilter('all')
    setScopeFilter('all')
    setTwoFactorFilter('all')
  }

  const groupedRoles = ROLE_PARENT_GROUPS.map((group) => {
    const groupRoles = sorted.filter((role) => getRoleCatalogEntry(role.name).parentGroup === group)
    const hasLanes = group === 'NCC' || group === 'RCC' || group === 'CCC'
    const lanes = hasLanes
      ? COMMITTEE_LANES.map((lane) => ({
          lane,
          roles: groupRoles.filter((role) => getRoleCatalogEntry(role.name).committeeLane === lane),
        })).filter((lane) => lane.roles.length > 0)
      : []

    return { group, roles: groupRoles, lanes }
  }).filter((group) => group.roles.length > 0)

  return (
    <div className="main">
      <AdminPageHeader
        title="Roles Manager"
        icon="manage_accounts"
        description="Define roles and control what each one can do within the platform."
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setEditTarget('new')}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              add
            </span>
            Create role
          </button>
        }
      />

      {/* KPIs */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          {
            label: 'Total Roles',
            value: isLoading ? '—' : roles.length,
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Board Roles',
            value: isLoading ? '—' : boardCount,
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Protected Roles',
            value: isLoading ? '—' : protectedCount,
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Elevated Security',
            value: isLoading ? '—' : elevatedCount,
            bar: 'hsl(var(--destructive))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div
          style={{
            padding: '14px 20px',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ position: 'relative' }}>
            <label htmlFor="roles-search" style={{ display: 'none' }}>
              Search roles
            </label>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              id="roles-search"
              name="rolesSearch"
              type="text"
              placeholder="Search by role name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputSt, paddingLeft: 34 }}
            />
          </div>
          <div
            style={{
              display: 'grid',
              gap: 10,
              gridTemplateColumns: 'repeat(4, minmax(150px, 1fr)) auto auto',
              alignItems: 'center',
            }}
          >
            <select
              aria-label="Filter by parent group"
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value as RoleParentGroup | 'all')}
              style={{ ...selectSt, maxWidth: 'none' }}
            >
              <option value="all">All groups</option>
              {ROLE_PARENT_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by committee lane"
              value={laneFilter}
              onChange={(e) => setLaneFilter(e.target.value as CommitteeLane | 'all')}
              style={{ ...selectSt, maxWidth: 'none' }}
            >
              <option value="all">All lanes</option>
              {COMMITTEE_LANES.map((lane) => (
                <option key={lane} value={lane}>
                  {lane}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by scope type"
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as RoleScopeType | 'all')}
              style={{ ...selectSt, maxWidth: 'none' }}
            >
              <option value="all">All scopes</option>
              <option value="national">National</option>
              <option value="region">Region</option>
              <option value="constituency">Constituency</option>
              <option value="polling_station">Polling station</option>
            </select>
            <select
              aria-label="Filter by elevated security"
              value={twoFactorFilter}
              onChange={(e) => setTwoFactorFilter(e.target.value as 'all' | 'required')}
              style={{ ...selectSt, maxWidth: 'none' }}
            >
              <option value="all">All security states</option>
              <option value="required">Elevated only</option>
            </select>
            <button
              className="btn btn-outline btn-sm"
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                filter_alt_off
              </span>
              Clear
            </button>
            <SortToggle value={sortDir} onChange={setSortDir} />
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="panel desktop-only" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'hsl(var(--container-low))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                {['Role', 'Structure', 'Permissions', 'Badges', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-semibold, 600)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div
                          style={{
                            height: 12,
                            background: 'hsl(var(--container-low))',
                            borderRadius: 2,
                            width: j === 0 ? '60%' : j === 1 ? '80%' : '40%',
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: '60px 16px',
                      textAlign: 'center',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    No roles found.
                  </td>
                </tr>
              ) : (
                groupedRoles.map((group) => (
                  <Fragment key={group.group}>
                    <tr key={`${group.group}-heading`}>
                      <td
                        colSpan={5}
                        style={{
                          padding: '12px 16px',
                          background: 'hsl(var(--container-low))',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontSize: 11,
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {group.group}
                      </td>
                    </tr>
                    {(group.lanes.length > 0
                      ? group.lanes.flatMap(({ lane, roles: laneRoles }) => [
                          { type: 'lane' as const, lane },
                          ...laneRoles.map((role) => ({ type: 'role' as const, role })),
                        ])
                      : group.roles.map((role) => ({ type: 'role' as const, role }))
                    ).map((item) => {
                      if (item.type === 'lane') {
                        return (
                          <tr key={`${group.group}-${item.lane}`}>
                            <td
                              colSpan={5}
                              style={{
                                padding: '8px 16px 8px 28px',
                                background: 'hsl(var(--surface))',
                                borderBottom: '1px solid hsl(var(--border))',
                                fontSize: 10,
                                fontWeight: 'var(--font-weight-semibold, 600)',
                                color: 'hsl(var(--primary))',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                              }}
                            >
                              {item.lane}
                            </td>
                          </tr>
                        )
                      }

                      const role = item.role
                      const meta = getRoleCatalogEntry(role.name)
                      return (
                        <tr
                          key={role.id}
                          onClick={() => setEditTarget(role)}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setEditTarget(role)
                            }
                          }}
                          style={{
                            borderBottom: '1px solid hsl(var(--border))',
                            transition: 'background 0.1s',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-semibold, 600)',
                                  fontSize: 12,
                                  color: 'hsl(var(--on-surface))',
                                }}
                              >
                                {formatName(role.name)}
                              </span>
                              <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                                {role.description || role.name}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              <span style={badgeStyle}>{meta.parentGroup}</span>
                              {meta.committeeLane && (
                                <span style={badgeStyle}>{meta.committeeLane}</span>
                              )}
                              <span style={badgeStyle}>{meta.scopeType.replace(/_/g, ' ')}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {role.permissions.length === 0 ? (
                                <span
                                  style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}
                                >
                                  None
                                </span>
                              ) : (
                                role.permissions.slice(0, 4).map((p) => (
                                  <span key={`${p.action}-${p.resource}`} style={badgeStyle}>
                                    {p.action.replace(/_/g, ' ')}
                                  </span>
                                ))
                              )}
                              {role.permissions.length > 4 && (
                                <span style={badgeStyle}>+{role.permissions.length - 4} more</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {meta.protected && <span className="pill pill-err">Protected</span>}
                              {meta.requires2fa && (
                                <span className="pill pill-warn">Elevated security</span>
                              )}
                              <span style={badgeStyle}>{role.permissions.length} permissions</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditTarget(role)
                                }}
                                style={{ padding: '0 10px' }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 13 }}
                                >
                                  edit
                                </span>
                                Edit
                              </button>
                              {!role.is_system && !isProtectedRole(role.name) && (
                                <button
                                  className="btn btn-outline-dest btn-sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteTarget(role)
                                  }}
                                  style={{ padding: '0 10px' }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: 13 }}
                                  >
                                    delete
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                  style={{
                    height: 14,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 2,
                    width: '50%',
                  }}
                />
                <div
                  style={{
                    height: 11,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 2,
                    width: '75%',
                  }}
                />
                <div
                  style={{
                    height: 30,
                    background: 'hsl(var(--container-low))',
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            No roles found.
          </div>
        ) : (
          groupedRoles.map((group) => (
            <div key={group.group} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  color: 'hsl(var(--on-surface))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '4px 2px',
                }}
              >
                {group.group}
              </div>
              {(group.lanes.length > 0
                ? group.lanes
                : [{ lane: undefined, roles: group.roles }]
              ).map(({ lane, roles: laneRoles }) => (
                <Fragment key={lane ?? group.group}>
                  {lane && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        color: 'hsl(var(--primary))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '2px 2px',
                      }}
                    >
                      {lane}
                    </div>
                  )}
                  {laneRoles.map((role) => {
                    const meta = getRoleCatalogEntry(role.name)
                    return (
                      <div
                        key={role.id}
                        className="panel"
                        onClick={() => setEditTarget(role)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setEditTarget(role)
                          }
                        }}
                        style={{ padding: 20, cursor: 'pointer' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-semibold, 600)',
                                fontSize: 13,
                                color: 'hsl(var(--on-surface))',
                                margin: 0,
                              }}
                            >
                              {formatName(role.name)}
                            </p>
                            <p
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-normal, 400)',
                                fontSize: 11,
                                color: 'hsl(var(--on-surface-muted))',
                                margin: '2px 0 0',
                              }}
                            >
                              {role.description || role.name}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}
                        >
                          <span style={badgeStyle}>{meta.scopeType.replace(/_/g, ' ')}</span>
                          {meta.protected && <span className="pill pill-err">Protected</span>}
                          {meta.requires2fa && (
                            <span className="pill pill-warn">Elevated security</span>
                          )}
                          <span style={badgeStyle}>{role.permissions.length} permissions</span>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditTarget(role)
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                              edit
                            </span>
                            Edit
                          </button>
                          {!role.is_system && !isProtectedRole(role.name) && (
                            <button
                              className="btn btn-dest btn-sm"
                              style={{ flex: 1, justifyContent: 'center' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(role)
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                delete
                              </span>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editTarget != null && (
          <RoleModal
            key="role-modal"
            role={editTarget === 'new' ? null : editTarget}
            onClose={() => setEditTarget(undefined)}
            onSaved={() => {
              setEditTarget(undefined)
              load()
            }}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            role={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={() => {
              setDeleteTarget(null)
              load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
