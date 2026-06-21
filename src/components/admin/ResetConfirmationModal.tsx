import { createPortal } from 'react-dom'

interface DetailRow {
  label: string
  value: string
}

interface ResetConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean

  /** Modal header title */
  title?: string
  /** Modal header subtitle / warning copy */
  subtitle?: string
  /** Material Symbol icon name shown in the header icon badge */
  icon?: string
  /** Confirm button label */
  confirmLabel?: string
  /** Confirm button icon (Material Symbol) */
  confirmIcon?: string

  /**
   * Generic key/value detail rows shown in the body info card.
   * Replaces the old deviceName / adminName props.
   */
  details?: DetailRow[]

  // ── Legacy props kept for backward-compat with LeadersAuth ──────────────────
  deviceName?: string
  adminName?: string
}

export function ResetConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title = 'Reset Device Slot & MFA',
  subtitle = 'Are you sure you want to reset this device slot? This will automatically disable Two-Factor Authentication (MFA) for the user as well. They will need to re-configure MFA and re-register their device upon their next login.',
  icon = 'lock_reset',
  confirmLabel = 'Reset Slot & MFA',
  confirmIcon = 'device_reset',
  details,
  // legacy
  deviceName,
  adminName,
}: ResetConfirmationModalProps) {
  if (!isOpen) return null

  // Build detail rows: prefer explicit `details`, fall back to legacy props.
  const rows: DetailRow[] =
    details ??
    ([
      adminName ? { label: 'Leader', value: adminName } : null,
      deviceName ? { label: 'Device Slot', value: deviceName } : null,
    ].filter(Boolean) as DetailRow[])

  const accentColor = 'hsl(var(--destructive))'
  const accentBg = 'rgba(206,17,38,0.18)'

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
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: accentColor }} />

        {/* Header */}
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
              borderRadius: 'var(--radius-xs)',
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
              {icon}
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
              {subtitle}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {rows.length > 0 && (
            <div
              style={{
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-xs)',
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              {rows.map((row, i) => (
                <div key={row.label} style={{ marginBottom: i < rows.length - 1 ? 12 : 0 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '0.05em',
                      margin: '0 0 2px',
                    }}
                  >
                    {row.label}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      textTransform: 'capitalize',
                    }}
                  >
                    {row.value}
                  </p>
                </div>
              ))}
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
              className="btn btn-dest"
              style={{
                flex: 1,
                height: 44,
                gap: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
                  {confirmIcon}
                </span>
              )}
              {isLoading ? 'Processing…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
