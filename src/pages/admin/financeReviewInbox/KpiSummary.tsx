interface KpiItem {
  label: string
  value: string | number
  bar: string
}

export default function KpiSummary({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
      {items.map((item) => (
        <div
          key={item.label}
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
              background: item.bar,
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
            {item.label}
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}
