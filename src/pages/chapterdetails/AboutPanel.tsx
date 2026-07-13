interface AboutPanelProps {
  name: string
  description: string
  city_or_region: string
  local_focus?: string | null
  meeting_schedule?: string | null
}

export function AboutPanel({
  name,
  description,
  city_or_region,
  local_focus,
  meeting_schedule,
}: AboutPanelProps) {
  return (
    <div className="panel" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
        >
          language
        </span>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          About this community
        </span>
      </div>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.65,
          fontStyle: 'italic',
          borderLeft: '3px solid hsl(var(--accent))',
          paddingLeft: 14,
          marginBottom: 14,
        }}
      >
        {description}
      </p>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.65,
        }}
      >
        Whether you&rsquo;re looking to volunteer, stay informed, or connect with fellow members,{' '}
        {name} provides the platform for meaningful civic engagement and practical contribution
        within {city_or_region}.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginTop: 20,
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            Local focus
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {local_focus || 'Community organising'}
          </div>
        </div>
        <div
          style={{
            padding: '14px 16px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            Meeting schedule
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {meeting_schedule || 'Contact the community for schedule'}
          </div>
        </div>
      </div>
    </div>
  )
}
