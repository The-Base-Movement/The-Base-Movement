import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'
import { ButtonAccent } from '@/components/buttons/ButtonAccent'

const TRUST_SIGNALS = [
  { icon: 'groups', value: '10,000+', label: 'Compatriots' },
  { icon: 'map', value: '16', label: 'Regions' },
  { icon: 'public', value: 'Global', label: 'Diaspora' },
]

export function AboutCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const reveal = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
  })

  return (
    <section
      aria-label="Join The Base Movement"
      ref={ref as React.RefObject<HTMLElement>}
      className="about-cta"
      style={{
        position: 'relative',
        minHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        padding: 'clamp(56px, 8vw, 96px) clamp(24px, 5vw, 64px)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Radial gold mesh overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(218,165,32,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content stack */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 720,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Editorial anchor */}
        <div
          style={{
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            ...reveal(0),
          }}
        >
          <BrandLine width={96} />
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            National Mobilization
          </span>
        </div>

        {/* Headline */}
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: 'rgba(255,255,255,0.95)',
            margin: '0 0 16px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            ...reveal(80),
          }}
        >
          Ready to Join the Movement?
        </h2>

        {/* Subtext */}
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 'clamp(0.875rem, 1.8vw, 1rem)',
            color: 'rgba(255,255,255,0.6)',
            margin: '0 0 40px',
            maxWidth: 480,
            lineHeight: 1.65,
            ...reveal(160),
          }}
        >
          Add your name. Strengthen the cause. Ghana First. Join a network of compatriots dedicated
          to building a resilient, sovereign foundation.
        </p>

        {/* Trust signals row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            padding: '28px 0',
            marginBottom: 40,
            ...reveal(240),
          }}
        >
          {TRUST_SIGNALS.map((signal, i) => (
            <div
              key={signal.label}
              style={{
                flex: '1 1 120px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '8px 24px',
                borderRight:
                  i < TRUST_SIGNALS.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
              }}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
                style={{ fontSize: 22, color: 'hsl(var(--accent))' }}
              >
                {signal.icon}
              </span>
              <strong
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--accent))',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {signal.value}
              </strong>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'rgba(255,255,255,0.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {signal.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA button + disclaimer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            ...reveal(320),
          }}
        >
          <ButtonAccent
            asChild
            size="lg"
            style={{
              borderRadius: 'var(--radius-pill)',
              gap: 12,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <Link to="/register">
              Join the Base
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                arrow_forward
              </span>
            </Link>
          </ButtonAccent>

          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Privacy Protected · No Spam · Pure Sovereignty
          </p>
        </div>
      </div>
    </section>
  )
}
