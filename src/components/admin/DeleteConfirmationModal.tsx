import { createPortal } from 'react-dom'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  isPermanent?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  isPermanent = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  const accentColor = isPermanent ? 'hsl(var(--destructive))' : 'hsl(var(--accent))'
  const accentBg = isPermanent ? 'rgba(206,17,38,0.18)' : 'rgba(184,153,94,0.18)'

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
          maxWidth: 440,
          background: '#fff',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: accentColor }} />

        {/* Dark header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 4,
              background: accentBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: accentColor }}
            >
              {isPermanent ? 'delete_forever' : 'warning'}
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.55)',
                margin: '4px 0 0',
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              padding: '12px 14px',
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'hsl(var(--on-surface-muted))',
                letterSpacing: '0.05em',
                margin: '0 0 4px',
              }}
            >
              Target item
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
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ flex: 1, height: 44 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={isPermanent ? 'btn btn-dest' : 'btn btn-dest'}
              style={{ flex: 1, height: 44 }}
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
                  {isPermanent ? 'delete_forever' : 'delete'}
                </span>
              )}
              {isLoading ? 'Processing…' : isPermanent ? 'Permanently delete' : 'Move to trash'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
