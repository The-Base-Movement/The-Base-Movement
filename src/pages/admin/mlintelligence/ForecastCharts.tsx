import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ForecastResponse } from '@/services/mlService'

const REGION_COLORS = [
  '#006B3F',
  '#DAA520',
  '#CE1126',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
]

interface Props {
  forecast: ForecastResponse
}

export default function ForecastCharts({ forecast }: Props) {
  const top6 = [...forecast.regions]
    .sort((a, b) => b.current_members - a.current_members)
    .slice(0, 6)

  const chartData = [
    { period: 'Current', ...Object.fromEntries(top6.map((r) => [r.region, r.current_members])) },
    { period: '+30d', ...Object.fromEntries(top6.map((r) => [r.region, r.forecast_30d])) },
    { period: '+60d', ...Object.fromEntries(top6.map((r) => [r.region, r.forecast_60d])) },
    { period: '+90d', ...Object.fromEntries(top6.map((r) => [r.region, r.forecast_90d])) },
  ]

  const growthData = [...forecast.regions]
    .filter((r) => r.growth_rate_pct !== 0)
    .sort((a, b) => b.growth_rate_pct - a.growth_rate_pct)

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Public Sans', sans-serif",
    fontSize: 10,
    fontWeight: 'var(--font-weight-medium, 500)' as string,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'hsl(var(--on-surface-muted))',
    margin: '0 0 8px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
      <div className="panel" style={{ padding: '16px 18px' }}>
        <p style={labelStyle}>Membership Growth Projection — Top 6 Regions</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ left: 10, right: 20, top: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11 }}
            />
            <YAxis tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            />
            <Legend wrapperStyle={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }} />
            {top6.map((r, i) => (
              <Line
                key={r.region}
                type="monotone"
                dataKey={r.region}
                stroke={REGION_COLORS[i % REGION_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {growthData.length > 0 && (
        <div className="panel" style={{ padding: '16px 18px' }}>
          <p style={labelStyle}>30-Day Growth Rate by Region</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {growthData.map((r) => {
              const maxGrowth = Math.max(...growthData.map((g) => Math.abs(g.growth_rate_pct)))
              const width = maxGrowth > 0 ? (Math.abs(r.growth_rate_pct) / maxGrowth) * 100 : 0
              const isPositive = r.growth_rate_pct > 0

              return (
                <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11,
                      color: 'hsl(var(--on-surface))',
                      width: 130,
                      flexShrink: 0,
                      textAlign: 'right',
                    }}
                  >
                    {r.region}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 14,
                      background: 'hsl(var(--container-low))',
                      borderRadius: 'var(--radius-pill)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${width}%`,
                        background: isPositive ? '#006B3F' : '#CE1126',
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: isPositive ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                      width: 50,
                      textAlign: 'right',
                    }}
                  >
                    {isPositive ? '+' : ''}
                    {r.growth_rate_pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
