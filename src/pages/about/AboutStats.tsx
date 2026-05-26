import { useEffect, useRef, useState } from 'react'

interface Stat {
  icon: string
  value: number
  label: string
  suffix: string
}

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
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, active, duration])

  return count
}

function StatCard({ icon, value, label, suffix, delay }: Stat & { delay: number }) {
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

  const count = useCountUp(value, visible)

  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center group"
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
        borderRadius: 16,
        padding: '28px 20px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.2s`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)')}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'hsl(var(--on-surface) / 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          transition: 'background 0.2s',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 22, color: 'hsl(var(--accent))' }}
        >
          {icon}
        </span>
      </div>

      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 32,
          color: 'hsl(var(--on-surface))',
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {count.toLocaleString()}
        {suffix}
      </div>

      <p
        style={{
          fontSize: 12,
          fontWeight: 'var(--font-weight-normal, 400)',
          color: 'hsl(var(--on-surface-muted))',
          margin: '0 0 12px',
        }}
      >
        {label}
      </p>

      <div
        style={{
          width: 28,
          height: 2,
          borderRadius: 999,
          background: 'hsl(var(--accent))',
          transition: 'width 0.3s',
        }}
        className="group-hover:w-12"
      />
    </div>
  )
}

interface AboutStatsProps {
  stats: {
    members: number
    chapters: number
    regions: number
    diaspora: number
  }
}

export function AboutStats({ stats }: AboutStatsProps) {
  const STAT_ITEMS: Stat[] = [
    { icon: 'people', value: stats.members, label: 'Ghana patriots', suffix: '+' },
    { icon: 'account_balance', value: stats.chapters, label: 'Active chapters', suffix: '+' },
    { icon: 'map', value: stats.regions, label: 'Regions covered', suffix: '' },
    { icon: 'public', value: stats.diaspora, label: 'Diaspora members', suffix: '+' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {STAT_ITEMS.map((s, i) => (
        <StatCard key={s.label} {...s} delay={i * 100} />
      ))}
    </div>
  )
}
