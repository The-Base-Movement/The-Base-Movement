import type { Region } from '@/services/adminService'

interface RegionsKPIsProps {
  regions: Region[]
  totalConstituencies: number
  isLoading: boolean
}

export function RegionsKPIs({ regions, totalConstituencies, isLoading }: RegionsKPIsProps) {
  const avgConstituencies = regions.length ? Math.round(totalConstituencies / regions.length) : 0

  const kpiData = [
    {
      label: 'Regions',
      value: regions.length || 16,
      icon: 'map',
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Constituencies',
      value: totalConstituencies,
      icon: 'location_on',
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Avg. per region',
      value: avgConstituencies,
      icon: 'analytics',
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Sync status',
      value: 'Live',
      icon: 'sync',
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      {kpiData.map((kpi) => (
        <div
          key={kpi.label}
          className="panel"
          style={{ padding: '14px 18px 14px 22px', position: 'relative', overflow: 'hidden' }}
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
              marginBottom: 6,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              {kpi.label}
            </p>
            <span
              className="material-symbols-outlined desktop-only"
              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
            >
              {kpi.icon}
            </span>
          </div>
          <p
            style={{
              fontSize: 22,
              fontWeight: 'var(--font-weight-semibold, 600)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {isLoading ? '—' : kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}
