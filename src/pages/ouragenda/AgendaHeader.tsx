import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandLine } from '@/components/ui/BrandLine'
import { LeaderSlider } from '@/pages/about/LeaderSlider'

interface AgendaHeaderProps {
  pillarsCount: number
}

export function AgendaHeader({ pillarsCount }: AgendaHeaderProps) {
  const stats = [
    { value: `${pillarsCount}`, label: 'Core aims' },
    { value: '16', label: 'Regions covered' },
    { value: '2026', label: 'Publication date' },
  ]

  return (
    <header
      style={{
        background: 'hsl(var(--container-low))',
        padding: 'clamp(56px, 8vw, 88px) clamp(16px, 5vw, 48px) clamp(40px, 6vw, 64px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 50% 100% at 80% 50%, rgba(218,165,32,.12), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Breadcrumbs />

        <div
          className="agenda-hero-inner"
          style={{
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(32px, 5vw, 64px)',
            justifyContent: 'space-between',
          }}
        >
          {/* Text column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--accent))',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 16,
              }}
            >
              The Base Movement · Official agenda
            </span>
            <BrandLine />
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                letterSpacing: '-0.03em',
                lineHeight: 0.95,
                margin: '16px 0 20px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              The <span style={{ color: 'hsl(var(--accent))' }}>Plan</span>
              <br />
              for Ghana.
            </h1>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
                color: 'hsl(var(--on-surface-muted))',
                maxWidth: 520,
                lineHeight: 1.65,
                margin: '0 0 36px',
              }}
            >
              A detailed, actionable blueprint to build a stronger, more prosperous nation through
              patriotism, honesty, and discipline.
            </p>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {stats.map((s) => (
                <div key={s.label}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 'clamp(1.8rem, 3vw, 2.25rem)',
                      letterSpacing: '-0.025em',
                      lineHeight: 1,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slider column */}
          <div className="agenda-hero-slider" style={{ flexShrink: 0 }}>
            <LeaderSlider />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .agenda-hero-slider { display: none; }
          .agenda-hero-inner { flex-direction: column; }
        }
      `}</style>
    </header>
  )
}
