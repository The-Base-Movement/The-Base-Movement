interface HealthCardProps {
  label: string
  icon: string
  value: string
  pct: number
  bar: string
  status: string
  statusColor: string
  loading: boolean
}

export function HealthCard({
  label,
  icon,
  value,
  pct,
  bar,
  status,
  statusColor,
  loading,
}: HealthCardProps) {
  return (
    <div
      className="panel"
      style={{ padding: '16px 18px 18px 22px', position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          {label}
        </p>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 16, color: bar, opacity: 0.55 }}
        >
          {icon}
        </span>
      </div>
      <p
        style={{
          fontSize: 'var(--kpi-num-size)',
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
          margin: '0 0 12px',
        }}
      >
        {loading ? '—' : value}
      </p>
      <div
        style={{
          height: 4,
          background: 'hsl(var(--border))',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${loading ? 0 : pct}%`,
            background: bar,
            borderRadius: 'var(--radius-pill)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: loading ? 'hsl(var(--border))' : statusColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontFamily: "'Public Sans', sans-serif",
            color: loading ? 'hsl(var(--on-surface-muted))' : statusColor,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {loading ? 'Checking…' : status}
        </span>
      </div>
    </div>
  )
}
