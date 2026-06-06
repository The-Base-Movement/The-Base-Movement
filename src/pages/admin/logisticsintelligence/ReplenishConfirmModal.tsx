import { createPortal } from 'react-dom'

interface ReplenishConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isReplenishing: boolean
}

export function ReplenishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isReplenishing,
}: ReplenishConfirmModalProps) {
  if (!isOpen) return null

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
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--surface))',
          borderRadius: 6,
          width: '100%',
          maxWidth: 440,
          padding: '40px 32px',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 32, color: 'hsl(var(--on-surface))' }}
          >
            add_box
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 18,
            color: 'hsl(var(--on-surface))',
            marginBottom: 12,
          }}
        >
          Confirm bulk replenishment?
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          This will initiate a movement-wide replenishment protocol for all low-stock assets.
          Standard procurement workflows will be triggered.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={isReplenishing}
          >
            {isReplenishing ? (
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
              >
                refresh
              </span>
            ) : (
              'Confirm protocol'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
