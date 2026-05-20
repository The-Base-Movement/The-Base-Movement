interface Props {
  totalMembers: number
  activeCount: number
  pendingCount: number
  totalDonated: number
}

export function ChapterHubKPIs({ totalMembers, activeCount, pendingCount, totalDonated }: Props) {
  const tiles = [
    { label: 'Total members', value: totalMembers, bar: 'hsl(var(--on-surface))' },
    { label: 'Active members', value: activeCount, bar: 'hsl(var(--primary))' },
    { label: 'Pending members', value: pendingCount, bar: 'hsl(var(--accent))' },
    {
      label: 'Total donated',
      value: `GH₵ ${totalDonated.toLocaleString()}`,
      bar: 'hsl(var(--primary))',
    },
  ]

  return (
    <div className="kpis">
      {tiles.map((k) => (
        <div
          key={k.label}
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
              background: k.bar,
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            {k.label}
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            {k.value}
          </p>
        </div>
      ))}
    </div>
  )
}
