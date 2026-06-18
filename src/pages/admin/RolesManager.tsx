import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SortToggle } from '@/components/ui/SortToggle'
import { usePageLabel } from '@/contexts/PageLabelContext'
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

const formatName = (name: string) =>
  name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

const hasPermission = (perms: AdminPermission[], action: string, resource: string) =>
  perms.some((p) => p.action === action && p.resource === resource)

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

// ─── Role Modal ───────────────────────────────────────────────────────────────

interface RoleModalProps {
  role: AdminRoleRecord | null
  onClose: () => void
  onSaved: () => void
}

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
          maxWidth: 540,
          background: 'hsl(var(--surface))',
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
                {role.is_system && ' · System role'}
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
              <p style={{ margin: '4px 0 0', fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
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

function DeleteModal({ role, onClose, onDeleted }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

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
          background: 'hsl(var(--surface))',
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

export default function RolesManager() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('Roles Manager')
  }, [setCurrentLabel])

  const [roles, setRoles] = useState<AdminRoleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [editTarget, setEditTarget] = useState<AdminRoleRecord | null | 'new'>()
  const [deleteTarget, setDeleteTarget] = useState<AdminRoleRecord | null>(null)

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
    load()
  }, [])

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    const cmp = formatName(a.name).localeCompare(formatName(b.name))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const systemCount = roles.filter((r) => r.is_system).length
  const customCount = roles.filter((r) => !r.is_system).length

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
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {[
          {
            label: 'Total Roles',
            value: isLoading ? '—' : roles.length,
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'System Roles',
            value: isLoading ? '—' : systemCount,
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Custom Roles',
            value: isLoading ? '—' : customCount,
            bar: 'hsl(var(--accent))',
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

      {/* Search + Sort */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
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
          <SortToggle value={sortDir} onChange={setSortDir} />
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
                {['Role', 'Description', 'Permissions', 'Type', ''].map((h) => (
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
              ) : sorted.length === 0 ? (
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
                sorted.map((role) => (
                  <tr
                    key={role.id}
                    style={{
                      borderBottom: '1px solid hsl(var(--border))',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--container-low))')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '14px 16px' }}>
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
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {role.description || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {role.permissions.length === 0 ? (
                          <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                            None
                          </span>
                        ) : (
                          role.permissions.map((p) => (
                            <span
                              key={`${p.action}-${p.resource}`}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-pill)',
                                background: 'hsl(var(--container-low))',
                                border: '1px solid hsl(var(--border))',
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 9.5,
                                color: 'hsl(var(--on-surface-muted))',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.action.replace(/_/g, ' ')}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={role.is_system ? 'pill pill-ok' : 'pill pill-warn'}>
                        {role.is_system ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditTarget(role)}
                          style={{ padding: '0 10px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            edit
                          </span>
                          Edit
                        </button>
                        {!role.is_system && (
                          <button
                            className="btn btn-outline-dest btn-sm"
                            onClick={() => setDeleteTarget(role)}
                            style={{ padding: '0 10px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
          filtered.map((role) => (
            <div key={role.id} className="panel" style={{ padding: 20 }}>
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
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatName(role.name)}
                  </p>
                  {role.description && (
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '2px 0 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {role.description}
                    </p>
                  )}
                </div>
                <span
                  className={`pill ${role.is_system ? 'pill-ok' : 'pill-warn'}`}
                  style={{ flexShrink: 0, marginLeft: 8 }}
                >
                  {role.is_system ? 'System' : 'Custom'}
                </span>
              </div>

              {role.permissions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                  {role.permissions.map((p) => (
                    <span
                      key={`${p.action}-${p.resource}`}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'hsl(var(--container-low))',
                        border: '1px solid hsl(var(--border))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 9.5,
                        color: 'hsl(var(--on-surface-muted))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.action.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setEditTarget(role)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    edit
                  </span>
                  Edit
                </button>
                {!role.is_system && (
                  <button
                    className="btn btn-dest btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setDeleteTarget(role)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      delete
                    </span>
                    Delete
                  </button>
                )}
              </div>
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
