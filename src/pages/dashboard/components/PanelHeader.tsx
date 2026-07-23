import type { ReactNode } from 'react'

/**
 * Brand-green header bar shared across the member-dashboard panels (feed,
 * quick actions, journey, recent activity). Keeps the colored header in one
 * place so the treatment stays consistent and the colour is a one-line change.
 */
export function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 18px',
        background: 'hsl(var(--panel-header))',
        flexShrink: 0,
      }}
    >
      <h3
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          fontWeight: 'var(--font-weight-semibold, 600)',
          letterSpacing: '-0.01em',
          color: '#fff',
          margin: 0,
        }}
      >
        {title}
      </h3>
      {action}
    </div>
  )
}
