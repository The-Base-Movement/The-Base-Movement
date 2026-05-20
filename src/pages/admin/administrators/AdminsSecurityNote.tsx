export function AdminsSecurityNote() {
  return (
    <div
      className="panel"
      style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 20 }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          background: 'hsl(var(--container-low))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
        >
          verified_user
        </span>
      </div>
      <div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
          }}
        >
          Security protocol
        </p>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          Administrative access is governed by movement encryption standards. All actions within the
          command center are logged in the audit vault for transparency and security. Unauthorized
          access attempts will be intercepted.
        </p>
      </div>
    </div>
  )
}
