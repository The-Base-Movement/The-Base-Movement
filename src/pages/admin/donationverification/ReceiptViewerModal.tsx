import { createPortal } from 'react-dom'

interface ReceiptViewerModalProps {
  isOpen: boolean
  receiptUrl: string | null
  onClose: () => void
}

export function ReceiptViewerModal({ isOpen, receiptUrl, onClose }: ReceiptViewerModalProps) {
  if (!isOpen || !receiptUrl) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,.88)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          maxWidth: 680,
          width: '100%',
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 15,
              }}
            >
              Transaction receipt
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                marginTop: 2,
              }}
            >
              Financial audit vault
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--border))' }}
            >
              image
            </span>
            <button
              aria-label="Close receipt viewer"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                background: '#0f1310',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
        </div>
        <div
          style={{
            padding: 32,
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <img
            src={receiptUrl}
            alt="Transaction Receipt"
            style={{
              maxHeight: '60vh',
              objectFit: 'contain',
              boxShadow: '0 4px 20px rgba(0,0,0,.1)',
              borderRadius: 4,
              border: '1px solid hsl(var(--border))',
            }}
            crossOrigin="anonymous"
          />
        </div>
        <div
          style={{
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid hsl(var(--border))',
            background: '#fff',
          }}
        >
          <button className="btn btn-dest" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
            Close viewer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default ReceiptViewerModal
