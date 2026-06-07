interface Props {
  membersCount: number
  activeCount: number
  totalDonated: number
  activitiesCount: number
}

export function Kpis({ membersCount, activeCount, totalDonated, activitiesCount }: Props) {
  const items = [
    { label: 'Total Members', value: membersCount, bar: 'hsl(var(--primary))' },
    { label: 'Verified', value: activeCount, bar: 'hsl(var(--accent))' },
    {
      label: 'Total Donated',
      value: `GH₵ ${totalDonated.toLocaleString()}`,
      bar: 'hsl(var(--primary))',
    },
    { label: 'Activities', value: activitiesCount, bar: 'hsl(var(--on-surface))' },
  ]

  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      {items.map((kpi) => (
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
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default Kpis
