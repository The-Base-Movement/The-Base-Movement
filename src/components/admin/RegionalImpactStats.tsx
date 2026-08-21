import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts'

export interface ImpactStat {
  label: string
  memberCount: number
  unitCount: number
}

const IMPACT_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#a855f7',
  '#ec4899',
  '#64748b',
  '#14b8a6',
]

interface RegionalImpactStatsProps {
  stats: ImpactStat[]
  maxMemberCount: number
  unitLabel?: string
  correlationTitle?: string
  correlationSubtitle?: string
  footprintTitle?: string
  footprintSubtitle?: string
  /** Cap the bar chart to the top N entries by member count (footprint list still shows all). */
  maxBars?: number
}

export function RegionalImpactStats({
  stats,
  maxMemberCount,
  unitLabel = 'hub',
  correlationTitle = 'Resource-to-impact correlation',
  correlationSubtitle = 'Mobilization strength by regional hub',
  footprintTitle = 'Logistical footprint',
  footprintSubtitle = 'Jurisdictional resource distribution',
  maxBars,
}: RegionalImpactStatsProps) {
  const sorted = [...stats].sort((a, b) => b.memberCount - a.memberCount)
  const barData = maxBars ? sorted.slice(0, maxBars) : sorted
  const chartHeight = Math.max(260, barData.length * 32)

  return (
    <div className="chapters-charts-grid twocol" style={{ marginBottom: 14 }}>
      {/* Horizontal bar chart — resource-to-impact */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>{correlationTitle}</h3>
            <div className="meta">
              {correlationSubtitle}
              {maxBars && sorted.length > maxBars ? ` · top ${maxBars} of ${sorted.length}` : ''}
            </div>
          </div>
        </div>
        <div style={{ padding: '8px 18px 18px', maxHeight: 340, overflowY: 'auto' }}>
          {barData.length === 0 ? (
            <div
              style={{
                height: 260,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No data yet
            </div>
          ) : (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={barData}
                  margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 9,
                      fontFamily: "'Public Sans'",
                      fill: 'hsl(var(--on-surface-muted))',
                    }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={105}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fontFamily: "'Public Sans'",
                      fill: 'hsl(var(--accent))',
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--border) / 0.3)' }}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 10,
                      fontFamily: "'Public Sans'",
                      color: 'hsl(var(--on-surface))',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    itemStyle={{ color: 'hsl(var(--on-surface))' }}
                    formatter={(value: number) => [`${value} members`, 'Mobilization strength']}
                    labelStyle={{
                      color: 'hsl(var(--accent))',
                      fontSize: 10,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  />
                  <Bar
                    dataKey="memberCount"
                    name="memberCount"
                    radius={[0, 2, 2, 0]}
                    maxBarSize={14}
                  >
                    {barData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={IMPACT_PALETTE[i % IMPACT_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Logistical footprint */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>{footprintTitle}</h3>
            <div className="meta">{footprintSubtitle}</div>
          </div>
        </div>
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          {sorted.length === 0 ? (
            <div
              style={{
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No data yet
            </div>
          ) : (
            sorted.map((stat, i) => {
              const color = IMPACT_PALETTE[i % IMPACT_PALETTE.length]
              return (
                <div key={stat.label}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {stat.label}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "'Public Sans', sans-serif",
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {stat.unitCount} {unitLabel}
                        {stat.unitCount !== 1 ? 's' : ''}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontFamily: "'Public Sans', sans-serif",
                          color,
                        }}
                      >
                        {stat.memberCount} members
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'hsl(var(--border))',
                      borderRadius: 'var(--radius-pill)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min((stat.memberCount / maxMemberCount) * 100, 100)}%`,
                        background: color,
                        transition: 'width 0.8s',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
