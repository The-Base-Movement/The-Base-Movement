import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ReceiptViewerModalProps {
  isOpen: boolean
  receiptUrl: string | null
  onClose: () => void
}

export function ReceiptViewerModal({ isOpen, receiptUrl, onClose }: ReceiptViewerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [receiptHtml, setReceiptHtml] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !receiptUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceiptHtml(null)
      return
    }
    fetch(receiptUrl)
      .then((r) => r.text())
      .then(setReceiptHtml)
      .catch(() => setReceiptHtml('<p>Failed to load receipt.</p>'))
  }, [isOpen, receiptUrl])

  if (!isOpen || !receiptUrl) return null

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print()
  }

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
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Transaction Receipt
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginTop: 1,
              }}
            >
              Financial audit vault
            </div>
          </div>
          <button
            aria-label="Close receipt viewer"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--container-low))',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* iframe body */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <iframe
            ref={iframeRef}
            srcDoc={receiptHtml ?? ''}
            title="Transaction Receipt"
            style={{
              width: '100%',
              height: '65vh',
              border: 'none',
              display: 'block',
            }}
          />
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          <a
            href={receiptUrl}
            download
            className="btn btn-outline btn-sm"
            style={{ textDecoration: 'none' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              download
            </span>
            Download
          </a>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              print
            </span>
            Print / Save PDF
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
export default ReceiptViewerModal
