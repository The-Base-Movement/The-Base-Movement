interface KpiItem {
  label: string
  value: string
  sub: string
  bar: string
  icon: string
}

interface Props {
  kpis: KpiItem[]
  kpiValueSize: (v: string | number) => number
}

export function DashboardKpiTiles({ kpis, kpiValueSize }: Props) {
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
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {kpi.label}
            </span>
            <span
              className="material-symbols-outlined desktop-only"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}
            >
              {kpi.icon}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: kpiValueSize(kpi.value),
              color: 'hsl(var(--on-surface))',
              lineHeight: 1,
              marginBottom: 4,
              letterSpacing: '-0.02em',
            }}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
