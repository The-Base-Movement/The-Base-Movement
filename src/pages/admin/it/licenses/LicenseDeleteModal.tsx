import { createPortal } from 'react-dom'
import type React from 'react'

interface LicenseDeleteModalProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  confirmText: string
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}

export function LicenseDeleteModal({
  isOpen,
  title,
  description,
  confirmText,
  saving,
  onClose,
  onConfirm,
}: LicenseDeleteModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          fontFamily: "'Public Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--destructive))',
            }}
          >
            {title}
          </h3>
        </div>
        <div style={{ padding: 24 }}>
          <div
            style={{
              margin: 0,
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.6,
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>
            Keep
          </button>
          <button className="btn btn-dest btn-sm" onClick={onConfirm} disabled={saving}>
            {saving ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
