import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/buttons/ui/neon-button'

const TRUST_SIGNALS = [
  { icon: 'groups', value: '10,000+', label: 'Patriots' },
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
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      aria-label="Join The Base Movement"
      ref={ref as React.RefObject<HTMLElement>}
      style={{
        background: 'hsl(var(--on-surface))',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
      }}
    >
      {/* Gold accent bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'hsl(var(--accent))',
        }}
      />

      {/* Headline */}
      <h2
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
          color: 'hsl(var(--card))',
          margin: '0 0 12px',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Ready to Join the Movement?
      </h2>

      {/* Subtext */}
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 'clamp(0.9rem, 2vw, 1rem)',
          color: 'rgba(255,255,255,0.6)',
          margin: '0 auto 32px',
          maxWidth: 480,
          lineHeight: 1.6,
        }}
      >
        Add your name. Strengthen the cause. Ghana First.
      </p>

      {/* Trust signals */}
      <ul
        style={{
          listStyle: 'none',
          margin: '0 auto 36px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '0',
          maxWidth: 480,
        }}
      >
        {TRUST_SIGNALS.map((signal, i) => (
          <li
            key={signal.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 20px',
              borderRight:
                i < TRUST_SIGNALS.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
              transition: `opacity 0.55s ease ${i * 120}ms, transform 0.55s ease ${i * 120}ms`,
            }}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontSize: 18, color: 'hsl(var(--accent))' }}
            >
              {signal.icon}
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--accent))',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                }}
              >
                {signal.value}
              </strong>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {signal.label}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to="/register" style={{ display: 'inline-block' }}>
        <Button variant="accent" size="lg">
          Join the Base
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </Button>
      </Link>
    </section>
  )
}
