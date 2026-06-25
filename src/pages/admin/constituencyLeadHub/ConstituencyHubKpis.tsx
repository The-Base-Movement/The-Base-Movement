interface ConstituencyHubKpisProps {
  memberCount: number
  verifiedCount: number
  activitiesCount: number
}

export function ConstituencyHubKpis({
  memberCount,
  verifiedCount,
  activitiesCount,
}: ConstituencyHubKpisProps) {
  return (
    <div className="kpis" style={{ marginBottom: 24 }}>
      <div
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
            background: 'hsl(var(--primary))',
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
          Members
        </p>
        <p
          style={{
            fontSize: 'var(--kpi-num-size)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          {memberCount}
        </p>
      </div>

      <div
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
            background: 'hsl(var(--accent))',
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
          Verified
        </p>
        <p
          style={{
            fontSize: 'var(--kpi-num-size)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          {verifiedCount}
        </p>
      </div>

      <div
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
            background: 'hsl(var(--container-low))',
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
          Activities
        </p>
        <p
          style={{
            fontSize: 'var(--kpi-num-size)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          {activitiesCount}
        </p>
      </div>
    </div>
  )
}
