export function VerificationStatusPanel() {
  return (
    <div className="panel">
      <div className="ph">
        <h3>Membership verification</h3>
        <span className="pill pill-ok">Verified</span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12.5,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Status: Active & Verified
          </span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            lineHeight: 1.55,
          }}
        >
          Your digital card is real-time verifiable. Use the QR code to present your credentials at
          official movement events.
        </p>
      </div>
    </div>
  )
}
