export function ProfileSettingsHeader() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-semibold, 600)',
          letterSpacing: '.05em',
          textTransform: 'uppercase',
        }}
      >
        Account · Settings
      </div>
      <h2
        style={{
          margin: '4px 0 0',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-semibold, 600)',
          fontSize: 26,
          letterSpacing: '-.02em',
          color: 'hsl(var(--on-surface))',
        }}
      >
        Profile Settings
      </h2>
      <p
        style={{
          color: 'hsl(var(--on-surface-muted))',
          fontSize: 12.5,
          marginTop: 4,
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
        }}
      >
        Manage your identity, download your card and update your details.
      </p>
    </div>
  )
}
