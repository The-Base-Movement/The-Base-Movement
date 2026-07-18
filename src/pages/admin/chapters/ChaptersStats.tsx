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
import type { RegionalStat } from '@/services/adminService'

interface ChaptersStatsProps {
  regionalStats: RegionalStat[]
  maxMemberCount: number
}

export function ChaptersStats({ regionalStats, maxMemberCount }: ChaptersStatsProps) {
  const sorted = [...regionalStats].sort((a, b) => b.memberCount - a.memberCount)
  const chartHeight = Math.max(260, sorted.length * 32)

  return (
    <div className="chapters-charts-grid twocol" style={{ marginBottom: 14 }}>
      {/* Horizontal bar chart — resource-to-impact */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>Resource-to-impact correlation</h3>
            <div className="meta">Mobilization strength by regional hub</div>
          </div>
        </div>
        <div style={{ padding: '8px 18px 18px', height: chartHeight, overflowX: 'hidden' }}>
          {sorted.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No regional data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={sorted}
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
                  dataKey="region"
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
                  formatter={(value: number, name: string) => [
                    name === 'memberCount' ? `${value} members` : `${value} chapters`,
                    name === 'memberCount' ? 'Mobilization strength' : 'Diaspora density',
                  ]}
                  labelStyle={{
                    color: 'hsl(var(--accent))',
                    fontSize: 10,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                />
                <Bar dataKey="memberCount" name="memberCount" radius={[0, 2, 2, 0]} maxBarSize={14}>
                  {sorted.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Logistical footprint — all regions */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>Logistical footprint</h3>
            <div className="meta">Jurisdictional resource distribution</div>
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
          {sorted.map((stat) => (
            <div key={stat.region}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {stat.region}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: "'Public Sans', sans-serif",
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {stat.chapters} hub{stat.chapters !== 1 ? 's' : ''}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: "'Public Sans', sans-serif",
                      color: stat.color,
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
                    background: stat.color,
                    transition: 'width 0.8s',
                    borderRadius: 'var(--radius-pill)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
