import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'
import { Button } from '@/components/buttons/ui/neon-button'

interface AgendaCovenantProps {
  isLoggedIn: boolean
}

export function AgendaCovenant({ isLoggedIn }: AgendaCovenantProps) {
  return (
    <section
      style={{
        background: 'hsl(var(--container-low))',
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(48px, 6vw, 72px) clamp(32px, 5vw, 64px)',
        marginTop: 'clamp(48px, 6vw, 72px)',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <BrandLine />
      </div>

      <h2
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          letterSpacing: '-0.02em',
          color: 'hsl(var(--on-surface))',
          margin: '0 0 24px',
        }}
      >
        Our Covenant with Ghana
      </h2>

      <div
        style={{
          maxWidth: 640,
          margin: '0 auto 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 15,
            lineHeight: 1.7,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          These Aims define the Ghana we are building. These Objectives are the steps we will be
          held accountable to. Together, they form THE BASE's covenant with every Ghanaian who
          believes this country can, and must, do better.
        </p>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 15,
            lineHeight: 1.7,
            color: 'hsl(var(--on-surface-muted))',
            margin: 0,
          }}
        >
          We do not offer vague promises. We offer an honest, detailed, and actionable agenda rooted
          in the realities of ordinary Ghanaians and the potential of an extraordinary nation.
        </p>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 15,
            color: 'hsl(var(--accent))',
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          Ghana First. Always.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {isLoggedIn ? (
          <Link to="/dashboard/members">
            <Button variant="accent" size="lg">
              View Members
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Button>
          </Link>
        ) : (
          <Link to="/register">
            <Button variant="accent" size="lg">
              Join The Movement
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
