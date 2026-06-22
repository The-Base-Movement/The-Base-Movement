import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { SentimentResponse } from '@/services/mlService'

const SENTIMENT_COLORS: Record<string, string> = {
  Strong: '#006B3F',
  Positive: '#3b82f6',
  Neutral: '#9CA3AF',
  Concerning: '#CE1126',
}

interface Props {
  sentiment: SentimentResponse
}

export default function SentimentCharts({ sentiment }: Props) {
  const chartData = [...sentiment.regions]
    .sort((a, b) => b.sentiment_score - a.sentiment_score)
    .map((r) => ({
      region: r.region.length > 16 ? r.region.slice(0, 14) + '…' : r.region,
      score: Math.round(r.sentiment_score * 100),
      label: r.sentiment_label,
      trend: r.trend,
      activeRatio: Math.round(r.active_ratio * 100),
      donorRate: Math.round(r.donation_participation_rate * 100),
    }))

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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)',
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div
        className="panel"
        style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column' }}
      >
        <p style={labelStyle}>Sentiment Score by Region</p>
        <div style={{ flex: 1, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: 10, right: 10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="region"
                tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 9 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number, _name: string, entry) => {
                  const label = (entry as { payload?: (typeof chartData)[0] }).payload?.label ?? ''
                  return [`${value}% (${label})`, 'Sentiment']
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={24}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={SENTIMENT_COLORS[entry.label] ?? '#9CA3AF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel" style={{ padding: '16px 18px' }}>
        <p style={labelStyle}>Engagement Overview</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {chartData.map((r) => {
            const trendIcon =
              r.trend === 'Rising'
                ? 'trending_up'
                : r.trend === 'Falling'
                  ? 'trending_down'
                  : 'trending_flat'
            const trendColor =
              r.trend === 'Rising'
                ? 'hsl(var(--primary))'
                : r.trend === 'Falling'
                  ? 'hsl(var(--destructive))'
                  : 'hsl(var(--on-surface-muted))'

            return (
              <div
                key={r.region}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingBottom: 10,
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: trendColor }}
                >
                  {trendIcon}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface))',
                    flex: 1,
                  }}
                >
                  {r.region}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Active {r.activeRatio}%
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Donors {r.donorRate}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
