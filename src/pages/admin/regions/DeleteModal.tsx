import { createPortal } from 'react-dom'

interface DeleteModalProps {
  label: string
  itemName: string
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function DeleteModal({ label, itemName, onClose, onConfirm, isLoading }: DeleteModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
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
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: 4, background: 'hsl(var(--destructive))' }} />
        <div
          style={{
            padding: '18px 22px',
            background: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 4,
              background: 'rgba(206,17,38,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
            >
              delete_forever
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: '#fff',
                margin: 0,
              }}
            >
              Delete {label}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                margin: '3px 0 0',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 18,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 3px',
              }}
            >
              Target
            </p>
            <p
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {itemName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="btn btn-dest"
              style={{ flex: 1, height: 42 }}
            >
              {isLoading ? (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  delete
                </span>
              )}
              {isLoading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
