import { useMemo } from 'react'
import type { License } from './types'
import { monthlyCost, annualCost, daysUntilRenewal, fmtMoney } from './types'

interface LicenseKpisProps {
  licenses: License[]
  loading: boolean
}

export function LicenseKpis({ licenses, loading }: LicenseKpisProps) {
  const active = useMemo(() => licenses.filter((l) => l.status === 'Active'), [licenses])

  const kpis = useMemo(() => {
    const totalCount = licenses.filter((l) => l.status !== 'Cancelled').length
    const monthlySpend = active.reduce((s, l) => s + monthlyCost(l), 0)
    const annualSpend = active.reduce((s, l) => s + annualCost(l), 0)
    const expiringSoon = active.filter((l) => {
      const d = daysUntilRenewal(l.renewal_date)
      return d >= 0 && d <= 30
    }).length
    return [
      { label: 'Total Licenses', value: totalCount, bar: 'hsl(var(--on-surface))' },
      { label: 'Monthly Spend', value: fmtMoney(monthlySpend), bar: 'hsl(var(--primary))' },
      { label: 'Annual Spend', value: fmtMoney(annualSpend), bar: 'hsl(var(--accent))' },
      { label: 'Expiring ≤ 30 days', value: expiringSoon, bar: 'hsl(var(--destructive))' },
    ]
  }, [licenses, active])

  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: kpi.bar,
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            {kpi.label}
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {loading ? '—' : kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
