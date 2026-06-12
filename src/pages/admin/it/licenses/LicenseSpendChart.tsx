import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { License } from './types'
import { DONUT_COLORS, annualCost, fmtMoney } from './types'

interface LicenseSpendChartProps {
  licenses: License[]
}

export function LicenseSpendChart({ licenses }: LicenseSpendChartProps) {
  const active = useMemo(() => licenses.filter((l) => l.status === 'Active'), [licenses])

  const donutData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const l of active) {
      totals[l.category] = (totals[l.category] ?? 0) + annualCost(l)
    }
    const grand = Object.values(totals).reduce((s, v) => s + v, 0)
    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: grand > 0 ? Math.round((amount / grand) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [active])

  if (donutData.length === 0) return null

  return (
    <div className="panel" style={{ padding: 20 }}>
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 12,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Annual Spend by Category
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={donutData}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
          >
            {donutData.map((_, i) => (
              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(val) => fmtMoney(Number(val))} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 12 }}>
        {donutData.map((item, i) => (
          <div
            key={item.category}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 0',
              fontSize: 12,
              borderBottom: i < donutData.length - 1 ? '1px solid hsl(var(--border))' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 'var(--radius-pill)',
                  background: DONUT_COLORS[i % DONUT_COLORS.length],
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'hsl(var(--on-surface))' }}>{item.category}</span>
            </div>
            <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
