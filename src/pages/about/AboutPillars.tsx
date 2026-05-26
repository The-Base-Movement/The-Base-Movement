import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const PILLARS = [
  {
    icon: 'flag',
    title: 'Our Mission',
    description:
      'Delivering an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians — not promises, but a plan.',
    side: 'left' as const,
  },
  {
    icon: 'location_on',
    title: 'Ghana Network',
    description:
      'Organized across all 275 constituencies, mobilizing patriots at the grassroots with region-by-region coordination.',
    side: 'left' as const,
  },
  {
    icon: 'groups',
    title: 'Leadership',
    description:
      'Dedicated leaders across every region, committed to driving transformational change with accountability and discipline.',
    side: 'left' as const,
  },
  {
    icon: 'public',
    title: 'Diaspora Network',
    description:
      'Uniting Ghanaian patriots worldwide — from London to New York to Dubai — under one movement, one agenda.',
    side: 'right' as const,
  },
  {
    icon: 'diamond',
    title: 'Our Values',
    description:
      'Guided by Patriotism, Honesty, and Discipline in everything we do — the three pillars that hold the movement together.',
    side: 'right' as const,
  },
  {
    icon: 'visibility',
    title: 'The Vision',
    description:
      "Quality education, lean and accountable government, and industrialisation that creates jobs for Ghana's youth.",
    side: 'right' as const,
  },
]

function PillarItem({
  icon,
  title,
  description,
  delay,
}: {
  icon: string
  title: string
  description: string
  delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex-shrink-0 rounded-lg flex items-center justify-center"
          style={{
            width: 42,
            height: 42,
            background: 'hsl(var(--accent) / 0.1)',
            transition: 'background 0.2s',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
          >
            {icon}
          </span>
        </div>
        <h3
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 15,
            color: 'hsl(var(--on-surface))',
            margin: 0,
            transition: 'color 0.2s',
          }}
        >
          {title}
        </h3>
      </div>
      <p
        style={{
          fontSize: 13,
          fontWeight: 'var(--font-weight-normal, 400)',
          color: 'hsl(var(--on-surface-muted))',
          lineHeight: 1.65,
          margin: 0,
          paddingLeft: 54,
        }}
      >
        {description}
      </p>
    </div>
  )
}

export function AboutPillars() {
  const imgRef = useRef<HTMLDivElement>(null)
  const [imgVisible, setImgVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setImgVisible(true)
      },
      { threshold: 0.1 }
    )
    if (imgRef.current) obs.observe(imgRef.current)
    return () => obs.disconnect()
  }, [])

  const left = PILLARS.filter((p) => p.side === 'left')
  const right = PILLARS.filter((p) => p.side === 'right')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-center">
      {/* Left column */}
      <div className="flex flex-col gap-8">
        {left.map((p, i) => (
          <PillarItem key={p.title} {...p} delay={i * 120} />
        ))}
      </div>

      {/* Center image */}
      <div
        ref={imgRef}
        className="flex justify-center items-center order-first md:order-none"
        style={{
          opacity: imgVisible ? 1 : 0,
          transform: imgVisible ? 'scale(1)' : 'scale(0.94)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        <div className="relative w-full max-w-[280px]">
          {/* Decorative offset border */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              border: `2px solid hsl(var(--primary) / 0.25)`,
              transform: 'translate(-10px, 10px)',
              borderRadius: 12,
            }}
          />
          {/* Image */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{ borderRadius: 12, boxShadow: '0 20px 48px -8px rgba(0,0,0,0.18)' }}
          >
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=560&h=720&fit=crop&q=80"
              alt="The Base Movement — united patriots"
              style={{ width: '100%', display: 'block', aspectRatio: '7/9', objectFit: 'cover' }}
            />
            {/* Overlay CTA */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <Link
                to="/our-agenda"
                style={{
                  background: '#fff',
                  color: 'hsl(var(--on-surface))',
                  padding: '8px 18px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Our Agenda
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* Floating dots */}
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'hsl(var(--accent))',
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-8">
        {right.map((p, i) => (
          <PillarItem key={p.title} {...p} delay={i * 120} />
        ))}
      </div>
    </div>
  )
}
