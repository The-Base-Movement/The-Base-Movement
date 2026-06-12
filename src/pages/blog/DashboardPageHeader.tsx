export function DashboardPageHeader() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'hsl(var(--primary))',
            display: 'inline-block',
            animation: 'pulse 1.4s infinite',
          }}
        />
        Movement articles
      </div>
      <h2
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 20,
          color: 'hsl(var(--on-surface))',
          margin: 0,
        }}
      >
        Updates &amp; Blog
      </h2>
    </div>
  )
}
