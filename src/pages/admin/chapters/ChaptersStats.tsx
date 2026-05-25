import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
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
  return (
    <div
      className="chapters-charts-grid"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}
    >
      {/* Scatter chart */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>Resource-to-impact correlation</h3>
            <div className="meta">Chapter density vs. mobilization strength</div>
          </div>
        </div>
        <div style={{ padding: '0 18px 18px', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis
                type="number"
                dataKey="chapters"
                name="Chapters"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fill: 'rgba(0,0,0,0.3)',
                }}
                label={{
                  value: 'Chapter density',
                  position: 'bottom',
                  offset: 0,
                  fontSize: 10,
                  fill: 'rgba(0,0,0,0.4)',
                }}
              />
              <YAxis
                type="number"
                dataKey="memberCount"
                name="Members"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fill: 'rgba(0,0,0,0.3)',
                }}
                label={{
                  value: 'Mobilization strength',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: 'rgba(0,0,0,0.4)',
                }}
              />
              <ZAxis type="number" dataKey="chapters" range={[60, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#0f1310',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
                itemStyle={{ fontSize: 10, fontWeight: 'var(--font-weight-medium, 500)' }}
              />
              <Scatter name="Regions" data={regionalStats} fill="#006b3f">
                {regionalStats.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional footprint */}
      <div className="panel">
        <div className="ph">
          <div>
            <h3>Logistical footprint</h3>
            <div className="meta">Jurisdictional resource distribution</div>
          </div>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {regionalStats.slice(0, 6).map((stat) => (
            <div key={stat.region}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
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
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {stat.chapters} hubs
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: 'hsl(var(--border))',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((stat.memberCount / maxMemberCount) * 100, 100)}%`,
                    background: stat.color,
                    transition: 'width 0.8s',
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
