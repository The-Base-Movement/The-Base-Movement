import { Sparkline } from './Sparkline'

interface StatCardProps {
  accent: string
  eye: string
  value: number
  suffix?: string
  label: string
  sparkHeights: number[]
  delta: string
  deltaIcon: 'up' | 'circle'
}

export function StatCard({
  accent,
  eye,
  value,
  suffix,
  label,
  sparkHeights,
  delta,
  deltaIcon,
}: StatCardProps) {
  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-md)',
        padding: '22px 22px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'transform .18s ease, box-shadow .18s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px -8px rgba(0,0,0,.10)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = ''
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px -2px rgba(0,0,0,.04)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '5px',
          background: accent,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '18px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: accent,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {eye}
        </span>
      </div>

      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: '48px',
          letterSpacing: '-.03em',
          lineHeight: '.95',
          color: 'hsl(var(--on-surface))',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span data-countup={value}>{value.toLocaleString()}</span>
        {suffix && (
          <small
            style={{
              fontSize: '20px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              marginLeft: '2px',
              letterSpacing: 0,
            }}
          >
            {suffix}
          </small>
        )}
      </div>

      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'hsl(var(--on-surface))',
          letterSpacing: '-.005em',
          lineHeight: 1.4,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderTop: '1px solid hsl(var(--border))',
          paddingTop: '12px',
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10.5px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: accent,
            letterSpacing: '-.005em',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {deltaIcon === 'circle' ? (
            <svg viewBox="0 0 8 8" width="9" height="9">
              <circle cx="4" cy="4" r="3" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 8 8" width="9" height="9">
              <path d="M0 6 L4 2 L8 6 Z" fill="currentColor" />
            </svg>
          )}
          {delta}
        </span>
        <Sparkline heights={sparkHeights} accent={accent} />
      </div>
    </div>
  )
}
