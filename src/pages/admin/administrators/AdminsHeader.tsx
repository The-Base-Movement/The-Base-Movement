interface AdminsHeaderProps {
  onProvision: () => void
}

export function AdminsHeader({ onProvision }: AdminsHeaderProps) {
  return (
    <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
      <div>
        <div className="crumbs">Security · Personnel</div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            shield
          </span>
          Administrators
        </h2>
        <div style={{ marginTop: 10, marginBottom: 4 }}>
          <div className="bl">
            <div />
            <div />
            <div />
          </div>
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 12.5,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 6,
            marginBottom: 0,
          }}
        >
          Authorized personnel with leadership credentials and platform oversight.
        </p>
      </div>
      <div className="actions">
        <button className="btn btn-primary" onClick={onProvision}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            person_add
          </span>
          Provision Credentials
        </button>
      </div>
    </div>
  )
}
