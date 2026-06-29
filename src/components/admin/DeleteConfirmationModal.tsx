/**
 * DeleteConfirmationModal Component
 * -------------------------------------------------------------
 * A reusable modal portal for confirming deletions of records, assets,
 * or user profiles. Supports normal soft-deletion ("Move to trash")
 * and irreversible permanent deletion.
 */

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
  redirectDestination?: string
  setRedirectDestination?: (val: string) => void
  redirectOptions?: { label: string; value: string }[]
}

/**
 * Renders a standardized dark/light mode compatible delete confirmation modal.
 * Uses React Portals to attach to the document body to prevent z-index/overflow issues.
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  isPermanent = false,
  redirectDestination,
  setRedirectDestination,
  redirectOptions,
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
          background: 'hsl(var(--card))',
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
            background: 'hsl(var(--container-low))',
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
                fontWeight: 700,
                fontSize: 16,
                color: 'hsl(var(--on-surface))',
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
                color: 'hsl(var(--on-surface-muted))',
                margin: '4px 0 0',
                fontWeight: 500,
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
                fontWeight: 600,
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
                fontWeight: 700,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {itemName}
            </p>
          </div>

          {redirectOptions && redirectOptions.length > 0 && (
            <div
              style={{
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <label
                htmlFor="select-redirect-dest"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'hsl(var(--on-surface-muted))',
                  letterSpacing: '0.05em',
                  margin: '0 0 6px',
                  display: 'block',
                }}
              >
                Redirect incoming traffic to (Optional)
              </label>
              <select
                id="select-redirect-dest"
                value={redirectDestination || ''}
                onChange={(e) => setRedirectDestination?.(e.target.value)}
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  borderRadius: 4,
                  fontSize: 12,
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                <option value="">None (Show 404 page)</option>
                {redirectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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
