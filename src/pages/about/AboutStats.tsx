import { useEffect, useRef, useState } from 'react'
import { Sparkline } from '../home/Sparkline'

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
      else setCount(target)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, active, duration])

  return count
}

interface StatCardProps {
  accent: string
  eye: string
  value: number
  suffix?: string
  label: string
  sparkHeights: number[]
  delta: string
  deltaIcon: 'up' | 'circle'
  delay: number
}

function StatCard({
  accent,
  eye,
  value,
  suffix,
  label,
  sparkHeights,
  delta,
  deltaIcon,
  delay,
}: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const count = useCountUp(value, visible)

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
    <div
      ref={ref}
      style={{
        background: '#fff',
        border: '1px solid #dfe4dd',
        borderRadius: '6px',
        padding: '22px 22px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(0,0,0,.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, box-shadow .18s ease`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 30px -8px rgba(0,0,0,.10)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,.04)'
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '5px',
          background: accent,
        }}
      />
      {/* Corner dot */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '18px',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: accent,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: '#6f7a71',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {eye}
        </span>
      </div>

      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: '48px',
          letterSpacing: '-.03em',
          lineHeight: '.95',
          color: '#181d19',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count.toLocaleString()}
        {suffix && (
          <small
            style={{
              fontSize: '20px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#6f7a71',
              marginLeft: '2px',
              letterSpacing: 0,
            }}
          >
            {suffix}
          </small>
        )}
      </div>

      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#181d19',
          letterSpacing: '-.005em',
          lineHeight: 1.4,
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderTop: '1px solid #dfe4dd',
          paddingTop: '12px',
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10.5px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: accent,
            letterSpacing: '-.005em',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          {deltaIcon === 'circle' ? (
            <svg viewBox="0 0 8 8" width="9" height="9">
              <circle cx="4" cy="4" r="3" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 8 8" width="9" height="9">
              <path d="M0 6 L4 2 L8 6 Z" fill="currentColor" />
            </svg>
          )}
          {delta}
        </span>
        <Sparkline heights={sparkHeights} accent={accent} />
      </div>
    </div>
  )
}

interface AboutStatsProps {
  stats: {
    members: number
    chapters: number
    regions: number
    diaspora: number
    membersDelta: string
    chaptersDelta: string
    diasporaDelta: string
  }
}

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      <StatCard
        accent="#CE1126"
        eye="Regions"
        value={stats.regions}
        suffix="/16"
        label="Full presence across every administrative region of Ghana"
        sparkHeights={[6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18]}
        delta="National coverage"
        deltaIcon="circle"
        delay={0}
      />
      <StatCard
        accent="#DAA520"
        eye="Branches"
        value={stats.chapters}
        label="Community branches active in nearly every district"
        sparkHeights={[5, 6, 7, 7, 9, 10, 10, 12, 13, 14, 16, 18]}
        delta={stats.chaptersDelta}
        deltaIcon="up"
        delay={80}
      />
      <StatCard
        accent="#1A1A1A"
        eye="Diaspora"
        value={stats.diaspora}
        label="Global Ghanaians supporting from abroad"
        sparkHeights={[3, 4, 4, 5, 7, 7, 10, 11, 13, 14, 16, 18]}
        delta={stats.diasporaDelta}
        deltaIcon="up"
        delay={160}
      />
      <StatCard
        accent="#006B3F"
        eye="Ghana Base"
        value={stats.members}
        label="Verified citizens registered nationwide"
        sparkHeights={[4, 6, 7, 7, 9, 11, 12, 14, 15, 16, 17, 18]}
        delta={stats.membersDelta}
        deltaIcon="up"
        delay={240}
      />
    </div>
  )
}
