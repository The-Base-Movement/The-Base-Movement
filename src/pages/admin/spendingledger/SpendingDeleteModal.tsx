import { createPortal } from 'react-dom'
import type { Entry } from './types'

interface SpendingDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  selected: Entry | null
  saving: boolean
  onDelete: () => void
}

export function SpendingDeleteModal({
  isOpen,
  onClose,
  selected,
  saving,
  onDelete,
}: SpendingDeleteModalProps) {
  if (!isOpen || !selected) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          border: '1px solid hsl(var(--border))',
          borderRadius: 6,
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 20px 16px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'hsla(var(--destructive), 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
            >
              delete
            </span>
          </div>
          <h3
            style={{
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 15,
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
              margin: '0 0 6px',
            }}
          >
            Delete entry?
          </h3>
          <p
            style={{
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            "{selected.description}" will be removed from the public spending ledger. This cannot be
            undone.
          </p>
        </div>
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'hsl(var(--container-low))',
          }}
        >
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={onDelete} disabled={saving} className="btn btn-dest btn-sm">
            {saving ? 'Deleting…' : 'Delete entry'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
