export function RolesManagementTab() {
  const roles = [
    {
      role: 'Super Admin',
      desc: 'Full system sovereignty and configuration rights.',
      count: 2,
      icon: 'shield',
      color: 'hsl(var(--destructive))',
    },
    {
      role: 'Regional Admin',
      desc: 'Operational oversight within assigned regional boundaries.',
      count: 16,
      icon: 'language',
      color: 'hsl(var(--on-surface))',
    },
    {
      role: 'Chapter Lead',
      desc: 'Local verification and mobilization management.',
      count: 124,
      icon: 'groups',
      color: 'hsl(var(--on-surface))',
    },
    {
      role: 'Audit View',
      desc: 'Read-only access to financial and telemetry streams.',
      count: 4,
      icon: 'history',
      color: 'hsl(var(--on-surface-muted))',
    },
  ]

  return (
    <div className="panel">
      <div className="ph" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <span>Administrative Roles</span>
        <span style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Summary of active permission tiers across the movement.
        </span>
      </div>
      <div>
        {roles.map((item, i) => (
          <div
            key={item.role}
            style={{
              padding: '16px 20px',
              borderBottom: i < roles.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--container-low))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
          >
            {/* Row 1: icon + role name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: item.color }}
                >
                  {item.icon}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {item.role}
              </p>
            </div>
            {/* Row 2: description */}
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 8px',
              }}
            >
              {item.desc}
            </p>
            {/* Row 3: active count */}
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 20,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              {item.count} active
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '14px 20px',
          background: 'hsl(var(--container-low))',
          borderTop: '1px solid hsl(var(--border))',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          Role assignments are managed by System Administrators only.
        </p>
      </div>
    </div>
  )
}
