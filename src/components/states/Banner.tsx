/**
 * Banner Component
 * -------------------------------------------------------------
 * A semantic inline alert banner used to broadcast warning, success, or info states.
 * Variants:
 * - error: High visibility red alert
 * - warn: Gold caution alert
 * - info: Steel blue alert
 * - ok: Movement green confirmation alert
 */

import type { CSSProperties } from 'react'

type BannerVariant = 'error' | 'warn' | 'info' | 'ok'

interface BannerProps {
  variant: BannerVariant
  title: string
  body?: string
  onDismiss?: () => void
  style?: CSSProperties
}

const VARIANTS: Record<
  BannerVariant,
  { bg: string; border: string; iconColor: string; icon: string }
> = {
  error: {
    bg: 'rgba(206,17,38,0.06)',
    border: '1px solid rgba(206,17,38,0.2)',
    iconColor: 'hsl(var(--destructive))',
    icon: 'cancel',
  },
  warn: {
    bg: 'rgba(218,165,32,0.08)',
    border: '1px solid rgba(218,165,32,0.25)',
    iconColor: '#7d5d12',
    icon: 'warning',
  },
  info: {
    bg: 'rgba(70,130,180,0.06)',
    border: '1px solid rgba(70,130,180,0.2)',
    iconColor: '#4682B4',
    icon: 'info',
  },
  ok: {
    bg: 'rgba(0,107,63,0.06)',
    border: '1px solid rgba(0,107,63,0.2)',
    iconColor: 'hsl(var(--primary))',
    icon: 'check_circle',
  },
}

/**
 * Banner component definition.
 */
export function Banner({ variant, title, body, onDismiss, style }: BannerProps) {
  const v = VARIANTS[variant]

  return (
    <div
      role="alert"
      style={{
        background: v.bg,
        border: v.border,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: v.iconColor, flexShrink: 0, marginTop: 1 }}
      >
        {v.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <b
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            display: 'block',
            color: 'hsl(var(--on-surface))',
            marginBottom: body ? 2 : 0,
          }}
        >
          {title}
        </b>
        {body && (
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              lineHeight: 1.4,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {body}
          </span>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      )}
    </div>
  )
}
