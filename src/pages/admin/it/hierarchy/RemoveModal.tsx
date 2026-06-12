import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  name: string
  hasChildren: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function RemoveModal({ name, hasChildren, onClose, onConfirm }: Props) {
  const [removing, setRemoving] = useState(false)

  async function handleConfirm() {
    setRemoving(true)
    await onConfirm()
    setRemoving(false)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
          >
            person_remove
          </span>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Remove from Hierarchy
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.6,
            }}
          >
            Remove <strong>{name}</strong> from the IT hierarchy?
          </p>
          {hasChildren && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                background: 'hsl(var(--accent) / 0.08)',
                border: '1px solid hsl(var(--accent) / 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: 'hsl(var(--accent))', flexShrink: 0, marginTop: 1 }}
              >
                info
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.5,
                }}
              >
                Their direct reports will be reassigned to their manager.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={removing}>
            Cancel
          </button>
          <button className="btn btn-dest btn-sm" onClick={handleConfirm} disabled={removing}>
            {removing ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
