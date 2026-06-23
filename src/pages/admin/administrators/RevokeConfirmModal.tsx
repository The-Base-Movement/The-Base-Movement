import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { type AdminUser } from '@/services/adminService'

interface RevokeConfirmModalProps {
  revokeTarget: AdminUser
  onClose: () => void
  isRevoking: boolean
  handleRevoke: () => Promise<void>
}

export function RevokeConfirmModal({
  revokeTarget,
  onClose,
  isRevoking,
  handleRevoke,
}: RevokeConfirmModalProps) {
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
          maxWidth: 420,
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
            Revoke Access
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
            Remove administrative credentials from <strong>{revokeTarget.name}</strong>? They will
            lose all platform access immediately.
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
            disabled={isRevoking}
            onClick={handleRevoke}
          >
            {isRevoking ? 'Revoking…' : 'Revoke access'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
export default RevokeConfirmModal
