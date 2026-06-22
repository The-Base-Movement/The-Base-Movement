/**
 * EmptyState Component
 * -------------------------------------------------------------
 * A reusable blank slate view representing empty states.
 * Renders an icon container, a title, explanatory text description,
 * and optional call-to-action button widgets.
 */

import type { ReactNode, CSSProperties } from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  body: string
  action?: ReactNode
  bordered?: boolean
  style?: CSSProperties
}

/**
 * EmptyState component definition.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  bordered = false,
  style,
}: EmptyStateProps) {
  return (
    <div
      style={{
        background: 'hsl(var(--background))',
        border: `1px ${bordered ? 'dashed' : 'solid'} hsl(var(--border))`,
        borderRadius: 'var(--radius-lg)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          background: 'hsl(var(--container-low))',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, color: 'hsl(var(--on-surface-muted))' }}
        >
          {icon}
        </span>
      </div>

      <h3
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 17,
          letterSpacing: '-0.01em',
          margin: '0 0 6px',
          color: 'hsl(var(--on-surface))',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 13,
          color: 'hsl(var(--on-surface-muted))',
          maxWidth: 280,
          lineHeight: 1.5,
          margin: action ? '0 0 20px' : 0,
        }}
      >
        {body}
      </p>

      {action}
    </div>
  )
}
