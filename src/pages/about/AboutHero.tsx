import { useEffect, useRef, useState } from 'react'
import { BrandLine } from '@/components/ui/BrandLine'

export function AboutHero() {
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

  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center px-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <span
        className="flex items-center gap-2 mb-3"
        style={{
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'hsl(var(--accent))',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          bolt
        </span>
        Discover our story
      </span>

      <h1
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          lineHeight: 1.1,
          color: 'hsl(var(--on-surface))',
          margin: '0 0 16px',
        }}
      >
        About The Base
      </h1>

      <div className="mb-6">
        <BrandLine />
      </div>

      <p
        className="max-w-2xl"
        style={{
          fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
          fontWeight: 'var(--font-weight-normal, 400)',
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        We are a political movement dedicated to the transformation of Ghana through patriotism,
        honesty, and discipline. From the grassroots of every constituency to Ghanaians across the
        globe — The Base unites patriots behind a single, actionable vision: Ghana First.
      </p>
    </div>
  )
}
