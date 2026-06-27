import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  ADMIN_PERMISSION_GROUPS,
  ALL_ADMIN_PERMISSIONS,
  hasAdminPermission,
} from '@/lib/adminPermissionCatalog'
import { type AdminUser } from '@/services/adminService'
import type { AdminPermission } from '@/types/admin'

const REGIONAL_ROLES: string[] = ['REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD']

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
  borderRadius: 4,
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}

const selectSt: React.CSSProperties = {
  ...inputSt,
  cursor: 'pointer',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

interface EditPermissionsModalProps {
  editTarget: AdminUser
  onClose: () => void
  editRole: string
  setEditRole: (r: string) => void
  editRegion: string
  setEditRegion: (reg: string) => void
  editPermissions: AdminPermission[]
  setEditPermissions: (permissions: AdminPermission[]) => void
  defaultPermissions: AdminPermission[]
  regions: string[]
  roles: { value: string; label: string }[]
  isEditing: boolean
  handleEditSubmit: () => Promise<void>
}

export function EditPermissionsModal({
  editTarget,
  onClose,
  editRole,
  setEditRole,
  editRegion,
  setEditRegion,
  editPermissions,
  setEditPermissions,
  defaultPermissions,
  regions,
  roles,
  isEditing,
  handleEditSubmit,
}: EditPermissionsModalProps) {
  const togglePermission = (
    action: AdminPermission['action'],
    resource: AdminPermission['resource']
  ) => {
    if (hasAdminPermission(editPermissions, action, resource)) {
      setEditPermissions(
        editPermissions.filter(
          (permission) => permission.action !== action || permission.resource !== resource
        )
      )
      return
    }

    setEditPermissions([...editPermissions, { action, resource }])
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
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 760,
          background: 'hsl(var(--card))',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
              Edit Permissions
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              {editTarget.name}
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 130px)',
          }}
        >
          <div>
            <p id="edit-role-label" style={labelSt}>
              Role
            </p>
            <div
              role="listbox"
              aria-labelledby="edit-role-label"
              style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                maxHeight: 210,
                overflowY: 'auto',
                background: 'hsl(var(--card))',
              }}
            >
              {roles.map((r, i) => {
                const isSelected = editRole === r.value
                return (
                  <div
                    key={r.value}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => setEditRole(r.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditRole(r.value)}
                    style={{
                      padding: '9px 12px',
                      cursor: 'pointer',
                      borderBottom: i < roles.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                      background: isSelected ? 'hsl(var(--primary))' : 'transparent',
                      color: isSelected ? '#fff' : 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: isSelected
                        ? 'var(--font-weight-semibold, 600)'
                        : 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {isSelected && (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 13, flexShrink: 0 }}
                      >
                        check
                      </span>
                    )}
                    {r.label}
                  </div>
                )
              })}
            </div>
          </div>

          {REGIONAL_ROLES.includes(editRole) && (
            <div>
              <label htmlFor="edit-region" style={labelSt}>
                Assigned region
              </label>
              <select
                id="edit-region"
                name="editRegion"
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                style={selectSt}
              >
                <option value="">— None —</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={{ ...labelSt, marginBottom: 2 }}>Row permissions</p>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {editPermissions.length} selected for this administrator.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditPermissions(defaultPermissions)}
              >
                Role defaults
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditPermissions(ALL_ADMIN_PERMISSIONS)}
              >
                Select all
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setEditPermissions([])}
              >
                Clear
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {ADMIN_PERMISSION_GROUPS.map((group) => (
              <div
                key={`${group.resource}-${group.label}`}
                style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  background: 'hsl(var(--card))',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '9px 10px',
                    background: 'hsl(var(--container-low))',
                    borderBottom: '1px solid hsl(var(--border))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {group.label}
                </div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map((item) => {
                    const checked = hasAdminPermission(editPermissions, item.action, group.resource)
                    return (
                      <label
                        key={`${group.resource}-${item.action}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          padding: '7px 6px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          background: checked ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                          border: checked
                            ? '1px solid hsl(var(--primary) / 0.30)'
                            : '1px solid transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(item.action, group.resource)}
                          style={{ marginTop: 1 }}
                        />
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 11,
                            lineHeight: 1.35,
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
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={isEditing}
            onClick={handleEditSubmit}
          >
            {isEditing ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
export default EditPermissionsModal
