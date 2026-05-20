interface MediaKPIsProps {
  filesCount: number
  activeFolder: string
}

export function MediaKPIs({ filesCount, activeFolder }: MediaKPIsProps) {
  const kpiList = [
    {
      label: 'Total assets',
      value: String(filesCount),
      sub: 'In current vault',
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Active folder',
      value: activeFolder,
      sub: 'Context segment',
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Storage usage',
      value: '12%',
      sub: 'Of 5.0 GB limit',
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Sync status',
      value: 'Online',
      sub: 'Supabase connected',
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div className="kpis" style={{ marginBottom: 8 }}>
      {kpiList.map((kpi) => (
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
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 6px',
            }}
          >
            {kpi.label}
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 'var(--kpi-num-size)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 4px',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {kpi.value}
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            {kpi.sub}
          </p>
        </div>
      ))}
    </div>
  )
}
