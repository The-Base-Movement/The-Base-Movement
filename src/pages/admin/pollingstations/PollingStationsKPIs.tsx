interface PollingStationsKPIsProps {
  stats: {
    total: number
    regions: number
    constituencies: number
    withMembers: number
  } | null
}

export function PollingStationsKPIs({ stats }: PollingStationsKPIsProps) {
  const kpis = [
    {
      label: 'Total polling stations',
      value: stats ? stats.total.toLocaleString() : '—',
      sub: 'EC-registered stations across Ghana',
      bar: 'hsl(var(--on-surface))',
      icon: 'ballot',
    },
    {
      label: 'Regions covered',
      value: stats ? stats.regions.toLocaleString() : '—',
      sub: 'Administrative regions',
      bar: 'hsl(var(--primary))',
      icon: 'map',
    },
    {
      label: 'Constituencies',
      value: stats ? stats.constituencies.toLocaleString() : '—',
      sub: 'Unique constituencies in system',
      bar: 'hsl(var(--accent))',
      icon: 'location_city',
    },
    {
      label: 'Stations with members',
      value: stats ? stats.withMembers.toLocaleString() : '—',
      sub: 'Have at least 1 registered member',
      bar: 'hsl(var(--destructive))',
      icon: 'how_to_vote',
    },
  ]

  return (
    <div className="kpis" style={{ marginBottom: 18 }}>
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
              gap: 8,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  marginBottom: 6,
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 26,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1,
                  marginBottom: 4,
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
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: kpi.bar, opacity: 0.7, marginTop: 2 }}
            >
              {kpi.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
