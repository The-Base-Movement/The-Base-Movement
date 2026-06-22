/**
 * ValueSummary Component
 * -------------------------------------------------------------
 * Displays key financial metrics for the active asset fleet, calculating and
 * summarizing total purchase value and dynamic estimated current depreciated value.
 */

import { useMemo } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
  categoriesById: Record<string, number> // category_id → lifespan_years
}

/**
 * estimateCurrentValue
 * -------------------------------------------------------------
 * Computes linear depreciation value based on purchase date and category lifespan.
 */
function estimateCurrentValue(asset: Asset, lifespanYears: number): number {
  if (!asset.purchase_price || !asset.purchase_date) return 0
  const ageYears =
    (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.max(0, asset.purchase_price * (1 - ageYears / lifespanYears))
}

/**
 * ValueSummary
 * -------------------------------------------------------------
 * Renders twin KPI cards for total fleet investment vs. depreciated value.
 */
export function ValueSummary({ assets, categoriesById }: Props) {
  const { totalPurchase, totalCurrent } = useMemo(() => {
    let tp = 0,
      tc = 0
    for (const a of assets) {
      if (!a.purchase_price) continue
      tp += a.purchase_price
      const lifespan = categoriesById[a.category_id] ?? 3
      tc += estimateCurrentValue(a, lifespan)
    }
    return { totalPurchase: tp, totalCurrent: tc }
  }, [assets, categoriesById])

  if (totalPurchase === 0) return null

  const kpis = [
    {
      label: 'Fleet Purchase Value',
      value: `$${totalPurchase.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Estimated Current Value',
      value: `$${totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{ padding: '14px 16px 14px 20px', position: 'relative', overflow: 'hidden' }}
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
              margin: '0 0 6px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {kpi.label}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
