import type { Entry } from './types'

interface SpendingLedgerKPIsProps {
  entries: Entry[]
  loading: boolean
}

export function SpendingLedgerKPIs({ entries, loading }: SpendingLedgerKPIsProps) {
  const totalSpent = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      {[
        {
          label: 'Total entries',
          value: loading ? '—' : entries.length.toString(),
          icon: 'receipt_long',
          bar: 'hsl(var(--on-surface))',
        },
        {
          label: 'Total spent',
          value: loading ? '—' : `₵ ${totalSpent.toLocaleString()}`,
          icon: 'payments',
          bar: 'hsl(var(--primary))',
        },
      ].map((kpi) => (
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}
            >
              {kpi.label}
            </p>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
            >
              {kpi.icon}
            </span>
          </div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
