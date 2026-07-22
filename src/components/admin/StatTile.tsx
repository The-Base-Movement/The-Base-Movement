/**
 * StatTile
 * -------------------------------------------------------------
 * The brand-color left-bar KPI tile (CLAUDE.md "KPI Tile Pattern").
 * This exact block is hand-rolled inline across ~40 admin pages; this
 * component is the single reusable source for it. Drop it inside a
 * `.kpis` grid.
 *
 * Bar colors: 'hsl(var(--on-surface))' (charcoal), 'hsl(var(--primary))'
 * (green), 'hsl(var(--accent))' (gold), 'hsl(var(--destructive))' (red).
 */
import type { ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  /** Left-bar color, e.g. 'hsl(var(--primary))' */
  bar: string
  /** Optional muted caption under the value */
  sub?: string
}

export function StatTile({ label, value, bar, sub }: StatTileProps) {
  return (
    <div
      className="panel"
      style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      <p
        style={{
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
          margin: '0 0 6px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 'var(--kpi-num-size)',
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          margin: sub ? '0 0 4px' : 0,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}
