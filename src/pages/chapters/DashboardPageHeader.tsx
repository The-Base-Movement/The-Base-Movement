interface DashboardPageHeaderProps {
  totalChapters: number
}

export function DashboardPageHeader({ totalChapters }: DashboardPageHeaderProps) {
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
        }}
      >
        Global community
      </div>
      <h2
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 'var(--h3-size, 20px)',
          color: 'hsl(var(--on-surface))',
          margin: '0 0 4px',
        }}
      >
        Base Diaspora
      </h2>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 12,
          color: 'hsl(var(--on-surface-muted))',
          margin: 0,
        }}
      >
        Connect with {totalChapters} diaspora communities around the world contributing to
        Ghana&rsquo;s future.
      </p>
    </div>
  )
}
