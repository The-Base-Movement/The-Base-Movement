import { useEffect, useRef, useState } from 'react'
import { LeaderSlider } from './LeaderSlider'

const PILLARS = [
  {
    icon: 'flag',
    color: 'hsl(var(--destructive))',
    bg: 'hsl(var(--destructive) / 0.08)',
    title: 'Our Mission',
    description:
      'Delivering an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians. Not promises, but a plan.',
    side: 'left' as const,
  },
  {
    icon: 'visibility',
    color: 'hsl(var(--accent))',
    bg: 'hsl(var(--accent) / 0.08)',
    title: 'Our Vision',
    description:
      "Quality education, lean and accountable government, and industrialisation that creates jobs for Ghana's youth.",
    side: 'left' as const,
  },
  {
    icon: 'diamond',
    color: 'hsl(var(--primary))',
    bg: 'hsl(var(--primary) / 0.08)',
    title: 'Our Values',
    description:
      'Guided by Patriotism, Honesty, and Discipline in everything we do: the three pillars that hold the movement together.',
    side: 'left' as const,
  },
  {
    icon: 'groups',
    color: 'hsl(var(--destructive))',
    bg: 'hsl(var(--destructive) / 0.08)',
    title: 'Leadership',
    description:
      'Dedicated leaders across every region, committed to driving transformational change with accountability and discipline.',
    side: 'right' as const,
  },
  {
    icon: 'location_on',
    color: 'hsl(var(--accent))',
    bg: 'hsl(var(--accent) / 0.08)',
    title: 'Ghana Network',
    description:
      'Organized across all 275 constituencies, mobilizing patriots at the grassroots with region-by-region coordination.',
    side: 'right' as const,
  },
  {
    icon: 'public',
    color: 'hsl(var(--primary))',
    bg: 'hsl(var(--primary) / 0.08)',
    title: 'Diaspora Network',
    description:
      'Uniting Ghanaian patriots worldwide, from London to New York to Dubai, under one movement and one agenda.',
    side: 'right' as const,
  },
]

function PillarItem({
  icon,
  color,
  bg,
  title,
  description,
  delay,
}: {
  icon: string
  color: string
  bg: string
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
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: 8,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>
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

interface AboutPillarsProps {
  mission?: string
  vision?: string
  values?: string
  leadership?: string
  ghanaNetwork?: string
  diaspora?: string
}

export function AboutPillars({
  mission,
  vision,
  values,
  leadership,
  ghanaNetwork,
  diaspora,
}: AboutPillarsProps) {
  const overrides: Record<string, string | undefined> = {
    'Our Mission': mission,
    'Our Vision': vision,
    'Our Values': values,
    Leadership: leadership,
    'Ghana Network': ghanaNetwork,
    'Diaspora Network': diaspora,
  }
  const left = PILLARS.filter((p) => p.side === 'left')
  const right = PILLARS.filter((p) => p.side === 'right')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-center">
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {left.map((p, i) => (
          <PillarItem
            key={p.title}
            {...p}
            description={overrides[p.title] || p.description}
            delay={i * 120}
          />
        ))}
      </div>

      {/* Center slider */}
      <div
        className="order-first md:order-none"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <LeaderSlider />
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {right.map((p, i) => (
          <PillarItem
            key={p.title}
            {...p}
            description={overrides[p.title] || p.description}
            delay={i * 120}
          />
        ))}
      </div>
    </div>
  )
}
