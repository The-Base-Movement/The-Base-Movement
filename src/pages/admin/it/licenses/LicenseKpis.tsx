import { useMemo } from 'react'
import { StatTile } from '@/components/admin/StatTile'
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
        <StatTile
          key={kpi.label}
          label={kpi.label}
          value={loading ? '—' : kpi.value}
          bar={kpi.bar}
        />
      ))}
    </div>
  )
}
