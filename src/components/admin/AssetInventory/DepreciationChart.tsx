import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  purchasePrice: number
  purchaseDate: string
  lifespanYears: number
}

export function DepreciationChart({ purchasePrice, purchaseDate, lifespanYears }: Props) {
  const data = useMemo(() => {
    if (lifespanYears <= 0) return []
    const start = new Date(purchaseDate)
    const endYear = start.getFullYear() + lifespanYears
    const points: { year: string; value: number }[] = []
    for (let y = start.getFullYear(); y <= endYear; y++) {
      const age = y - start.getFullYear()
      const value = Math.max(0, purchasePrice * (1 - age / lifespanYears))
      points.push({ year: String(y), value: Math.round(value * 100) / 100 })
    }
    return points
  }, [purchasePrice, purchaseDate, lifespanYears])

  if (lifespanYears <= 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 10,
          fontWeight: 'var(--font-weight-medium, 500)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Depreciation Curve
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="year" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => [`$${v.toFixed(2)}`, 'Est. Value']}
            contentStyle={{
              fontSize: 11,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
