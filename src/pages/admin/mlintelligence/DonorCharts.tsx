import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import type { PropensityResponse } from '@/services/mlService'

const TIER_COLORS: Record<string, string> = {
  High: '#006B3F',
  Medium: '#DAA520',
  Low: '#9CA3AF',
}

interface Props {
  propensity: PropensityResponse
}

export default function DonorCharts({ propensity }: Props) {
  const pieData = [
    { name: 'High', value: propensity.high_propensity },
    { name: 'Medium', value: propensity.medium_propensity },
    { name: 'Low', value: propensity.low_propensity },
  ]

  const regionMap: Record<string, { total: number; sum: number }> = {}
  for (const m of propensity.members) {
    const r = m.region ?? 'Unknown'
    if (!regionMap[r]) regionMap[r] = { total: 0, sum: 0 }
    regionMap[r].total++
    regionMap[r].sum += m.score
  }

  const regionData = Object.entries(regionMap)
    .map(([region, { total, sum }]) => ({
      region: region.length > 18 ? region.slice(0, 16) + '…' : region,
      avgScore: Math.round((sum / total) * 100),
      members: total,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10)

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
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div className="panel" style={{ padding: '16px 18px' }}>
        <p style={labelStyle}>Tier Distribution</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={TIER_COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number, name: string) => [`${value} members`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          {pieData.map((d) => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: TIER_COLORS[d.name],
                }}
              />
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {d.name} ({d.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ padding: '16px 18px' }}>
        <p style={labelStyle}>Avg Propensity Score by Region (Top 10)</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={regionData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="region"
              width={110}
              tick={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(value: number) => [`${value}%`, 'Avg Score']}
            />
            <Bar dataKey="avgScore" fill="#006B3F" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
