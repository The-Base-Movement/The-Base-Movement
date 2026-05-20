import type { GrowthTrend } from '@/types/admin'

interface TrendChartsPanelProps {
  growthTrends: GrowthTrend[]
}

export function TrendChartsPanel({ growthTrends }: TrendChartsPanelProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 12,
      }}
    >
      {/* Sign-ups */}
      <div
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <h3
            style={{
              fontWeight: 800,
              fontSize: 12.5,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Sign-ups · 24 h
          </h3>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
            Hourly · Gmt
          </span>
        </div>
        <div style={{ height: 200, padding: 16, position: 'relative' }}>
          <svg
            viewBox="0 0 600 180"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="gp" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(206,17,38,.4)" />
                <stop offset="100%" stopColor="rgba(206,17,38,0)" />
              </linearGradient>
            </defs>
            <g stroke="rgba(0,0,0,.08)" strokeWidth="1">
              <line x1="0" x2="600" y1="40" y2="40" />
              <line x1="0" x2="600" y1="90" y2="90" />
              <line x1="0" x2="600" y1="140" y2="140" />
            </g>
            {growthTrends.length > 1 &&
              (() => {
                const safeTrends = growthTrends.map((t) => ({
                  ...t,
                  count: Number(t.count) || 0,
                }))
                const max = Math.max(...safeTrends.map((t) => t.count), 1)
                const points = safeTrends
                  .map((t, i) => {
                    const divisor = Math.max(1, safeTrends.length - 1)
                    const x = (i / divisor) * 600
                    const y = 180 - (t.count / (max * 1.2)) * 180
                    return `${x} ${y}`
                  })
                  .join(' L ')
                const fillPath = `M0 180 L${points} L600 180 Z`
                const strokePath = `M${points}`
                return (
                  <>
                    <path d={fillPath} fill="url(#gp)" />
                    <path
                      d={strokePath}
                      fill="none"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="2"
                    />
                    {safeTrends.map((t, i) => (
                      <circle
                        key={i}
                        cx={(i / Math.max(1, safeTrends.length - 1)) * 600}
                        cy={180 - (t.count / (max * 1.2)) * 180}
                        r="2"
                        fill="hsl(var(--destructive))"
                      />
                    ))}
                  </>
                )
              })()}
            {growthTrends.length === 1 && (
              <circle cx="300" cy="90" r="4" fill="hsl(var(--destructive))" />
            )}
          </svg>
        </div>
      </div>

      {/* Donations */}
      <div
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <h3
            style={{
              fontWeight: 800,
              fontSize: 12.5,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Donations · 24 h (₵)
          </h3>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
            Momo + card
          </span>
        </div>
        <div style={{ height: 200, padding: 16, position: 'relative' }}>
          <svg
            viewBox="0 0 600 180"
            style={{ width: '100%', height: '100%' }}
            preserveAspectRatio="none"
          >
            <g fill="hsl(var(--accent))">
              {growthTrends.map((t, i) => {
                const h = (t.count / Math.max(...growthTrends.map((x) => x.count), 1)) * 150
                const x = (i / growthTrends.length) * 600 + 5
                return (
                  <rect
                    key={i}
                    x={x}
                    y={180 - h}
                    width="20"
                    height={h}
                    rx="2"
                    fill={
                      i > growthTrends.length - 4 ? 'hsl(var(--destructive))' : 'hsl(var(--accent))'
                    }
                  />
                )
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
