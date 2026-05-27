import { type AgendaPillar } from './agendaData'

interface AgendaIntroCardsProps {
  pillars: AgendaPillar[]
  onSelect: (id: string) => void
}

export function AgendaIntroCards({ pillars, onSelect }: AgendaIntroCardsProps) {
  const handleSelect = (id: string) => {
    onSelect(id)
    setTimeout(() => {
      document
        .getElementById('pillar-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <section style={{ padding: 'clamp(48px, 6vw, 72px) 0 0' }} className="agenda-overview-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 32,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            letterSpacing: '-0.025em',
            margin: 0,
            color: 'hsl(var(--on-surface))',
          }}
        >
          {pillars.length} aims.
          <br />
          One plan.
        </h2>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 14,
            color: 'hsl(var(--on-surface-muted))',
            maxWidth: 360,
            margin: 0,
            textAlign: 'right',
            lineHeight: 1.6,
          }}
        >
          Select an aim to read its full objectives and delivery plan.
        </p>
      </div>

      <div
        className="agenda-overview-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}
      >
        {pillars.map((pillar) => (
          <button
            key={pillar.id}
            onClick={() => handleSelect(pillar.id)}
            style={{
              textDecoration: 'none',
              display: 'block',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid hsl(var(--border))',
                borderTop: `3px solid ${pillar.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                background: 'hsl(var(--background))',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                const d = e.currentTarget as HTMLDivElement
                d.style.transform = 'translateY(-2px)'
                d.style.boxShadow = '0 16px 32px -8px rgba(0,0,0,.1)'
              }}
              onMouseLeave={(e) => {
                const d = e.currentTarget as HTMLDivElement
                d.style.transform = ''
                d.style.boxShadow = ''
              }}
            >
              <div style={{ padding: '20px 22px', background: 'hsl(var(--container-low))' }}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 44,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    opacity: 0.15,
                    color: pillar.color,
                    userSelect: 'none',
                  }}
                >
                  {pillar.number}
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: pillar.color,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  Aim {pillar.number}
                </span>
                <h3
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 15,
                    letterSpacing: '-0.01em',
                    lineHeight: 1.3,
                    margin: 0,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {pillar.title}
                </h3>
              </div>
              <div style={{ padding: '16px 22px', borderTop: '1px solid hsl(var(--border))' }}>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface-muted))',
                    lineHeight: 1.6,
                    marginBottom: 12,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {pillar.summary}
                </p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {pillar.objectives.map((obj, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {obj.title.split(' ').slice(0, 3).join(' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .agenda-overview-section { display: none; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .agenda-overview-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
