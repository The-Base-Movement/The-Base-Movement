import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { type AdminUser } from '@/services/adminService'
import type { AdminRole } from '@/types/admin'

const ALL_ROLES: { value: AdminRole; label: string }[] = [
  { value: 'FOUNDER', label: 'Founder' },
  { value: 'ORGANIZER', label: 'Strategic Organizer' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'REGIONAL_DIRECTOR', label: 'Regional Director' },
  { value: 'CONSTITUENCY_LEAD', label: 'Constituency Lead' },
  { value: 'VERIFIER', label: 'Verifier' },
  { value: 'CHIEF_EDITOR', label: 'Chief Editor' },
  { value: 'SENIOR_EDITOR', label: 'Senior Editor' },
  { value: 'EDITOR', label: 'Editor' },
  { value: 'JUNIOR_EDITOR', label: 'Junior Editor' },
  { value: 'REGIONAL_CORRESPONDENT', label: 'Regional Correspondent' },
]

const REGIONAL_ROLES: AdminRole[] = ['REGIONAL_DIRECTOR', 'CONSTITUENCY_LEAD']

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
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
  fontWeight: 800,
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
  editRole: AdminRole
  setEditRole: (r: AdminRole) => void
  editRegion: string
  setEditRegion: (reg: string) => void
  regions: string[]
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
  regions,
  isEditing,
  handleEditSubmit,
}: EditPermissionsModalProps) {
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
          maxWidth: 480,
          background: '#fff',
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
                fontWeight: 900,
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
                fontWeight: 700,
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

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="edit-role" style={labelSt}>
              Role
            </label>
            <select
              id="edit-role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as AdminRole)}
              style={selectSt}
            >
              {ALL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {REGIONAL_ROLES.includes(editRole) && (
            <div>
              <label htmlFor="edit-region" style={labelSt}>
                Assigned region
              </label>
              <select
                id="edit-region"
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

          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Permissions will be reset to the defaults for the selected role.
          </p>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ minWidth: 80 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ minWidth: 120 }}
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
