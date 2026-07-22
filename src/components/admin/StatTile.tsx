/**
 * StatTile
 * -------------------------------------------------------------
 * The brand-color left-bar KPI tile (CLAUDE.md "KPI Tile Pattern").
 * This exact block is hand-rolled inline across ~40 admin pages; this
 * component is the single reusable source for it. Drop it inside a
 * `.kpis` grid. Wrap it in a <Link> at the call site to make it clickable.
 *
 * Bar colors: 'hsl(var(--on-surface))' (charcoal), 'hsl(var(--primary))'
 * (green), 'hsl(var(--accent))' (gold), 'hsl(var(--destructive))' (red).
 */
import type { CSSProperties, ReactNode } from 'react'

interface StatTileProps {
  label: string
  value: ReactNode
  /** Left-bar color, e.g. 'hsl(var(--primary))' */
  bar: string
  /** Optional muted caption under the value */
  sub?: string
  /** Optional Material Symbols icon shown top-right, tinted to the bar color */
  icon?: string
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
}

export function StatTile({ label, value, bar, sub, icon }: StatTileProps) {
  return (
    <div
      className="panel"
      style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      {icon ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <p style={{ ...labelStyle, margin: 0 }}>{label}</p>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: bar, opacity: 0.55 }}
          >
            {icon}
          </span>
        </div>
      ) : (
        <p style={{ ...labelStyle, margin: '0 0 6px' }}>{label}</p>
      )}
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
