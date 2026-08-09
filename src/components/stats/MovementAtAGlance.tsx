import { memo, useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { StatCard } from '@/pages/home/StatCard'
import type { PublicStats } from '@/services/publicSiteService'

interface MovementAtAGlanceProps {
  stats: PublicStats
  variant?: 'section' | 'embedded' | 'sidebar'
  statsGridRef?: RefObject<HTMLDivElement | null>
  darkBackground?: boolean
  eyebrowText?: string
}

function MovementAtAGlanceInner({
  stats,
  variant = 'section',
  statsGridRef,
  darkBackground = false,
  eyebrowText,
}: MovementAtAGlanceProps) {
  const now = new Date()
  const updated = `Updated · Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`

  useEffect(() => {
    if (!statsGridRef?.current) return
    const grid = statsGridRef.current
    const spans = Array.from(grid.querySelectorAll<HTMLElement>('[data-countup]'))
    if (!spans.length) return
    if (spans.every((s) => (Number(s.dataset.countup) || 0) === 0)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    spans.forEach((s) => (s.textContent = '0'))

    const tweens: gsap.core.Tween[] = []
    let started = false
    const io = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return
        started = true
        spans.forEach((span) => {
          const target = Number(span.dataset.countup) || 0
          const obj = { v: 0 }
          tweens.push(
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: 'power2.out',
              onUpdate: () => {
                span.textContent = Math.round(obj.v).toLocaleString()
              },
            })
          )
        })
        io.disconnect()
      },
      { threshold: 0.35 }
    )
    io.observe(grid)
    return () => {
      io.disconnect()
      tweens.forEach((t) => t.kill())
    }
  }, [statsGridRef, stats])

  if (variant === 'sidebar') {
    const statItems = [
      { key: 'members', label: 'Registered members', value: stats.members, accent: '#006B3F' },
      { key: 'regions', label: 'Regions', value: stats.regions, accent: '#CE1126' },
      { key: 'chapters', label: 'Diaspora', value: stats.chapters, accent: '#DAA520' },
      { key: 'diaspora', label: 'Diaspora countries', value: stats.diaspora, accent: 'hsl(var(--on-surface))' },
    ].filter((s) => s.value > 0)

    if (statItems.length === 0) return null

    return (
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
          padding: 18,
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'hsl(var(--on-surface-muted))',
            margin: '0 0 4px',
          }}
        >
          Movement at a glance
        </p>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            margin: '0 0 14px',
          }}
        >
          Live totals, updated as the movement grows.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: statItems.length > 1 ? '1fr 1fr' : '1fr',
            gap: 10,
          }}
        >
          {statItems.map((s) => (
            <div
              key={s.key}
              style={{
                position: 'relative',
                padding: '12px 14px 12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'hsl(var(--container-low))',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: s.accent,
                }}
              />
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 22,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                {s.value.toLocaleString()}
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '4px 0 0',
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const gridContent = (
    <div ref={statsGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      <StatCard
        accent="#CE1126"
        eye="Regions"
        value={stats.regions}
        suffix="/16"
        label="Full presence across every administrative region of Ghana"
        series={stats.regionsSeries}
        delta="National coverage"
        deltaIcon="circle"
      />
      <StatCard
        accent="#DAA520"
        eye="Diaspora Countries"
        value={stats.countries || stats.chapters}
        label="Countries worldwide with Base Diaspora members"
        series={stats.countriesSeries}
        delta={stats.chaptersDelta || (stats.countries ? `In ${stats.countries.toLocaleString()} countries` : '')}
        deltaIcon="up"
      />
      <StatCard
        accent="hsl(var(--on-surface))"
        eye="Diaspora"
        value={stats.diaspora}
        label="Global Ghanaians supporting from abroad"
        series={stats.diasporaSeries}
        delta={stats.diasporaDelta}
        deltaIcon="up"
      />
      <StatCard
        accent="#006B3F"
        eye="Ghana Base"
        value={stats.members}
        label="Verified citizens registered nationwide"
        series={stats.membersSeries}
        delta={stats.membersDelta}
        deltaIcon="up"
      />
    </div>
  )

  if (variant === 'embedded') {
    return (
      <div>
        <div className="mb-8">
          {eyebrowText && (
            <span
              className={`text-[10px] font-medium tracking-[0.08em] uppercase font-meta block mb-2 ${
                darkBackground ? 'text-accent' : 'text-primary'
              }`}
            >
              {eyebrowText}
            </span>
          )}
          <h2
            className={`font-meta font-medium text-2xl md:text-3xl tracking-tight mb-1 ${
              darkBackground ? 'text-white' : 'text-on-surface'
            }`}
          >
            Movement at a glance
          </h2>
          <span
            suppressHydrationWarning
            className={`text-xs font-meta font-medium uppercase tracking-[.06em] mt-1 block ${
              darkBackground ? 'text-white/60' : 'text-muted-foreground'
            }`}
          >
            {updated}
          </span>
        </div>
        {gridContent}
      </div>
    )
  }

  return (
    <section
      aria-labelledby="stats-heading"
      className="home-stats-section py-16 md:py-24 bg-background"
    >
      <div className="page-container">
        <div className="mb-5">
          <h2
            id="stats-heading"
            className="text-2xl md:text-3xl font-meta font-medium tracking-tight text-on-surface"
          >
            Movement at a glance
          </h2>
          <span
            suppressHydrationWarning
            className="text-[10px] font-medium text-muted-foreground uppercase tracking-[.06em] mt-1.5 block"
          >
            {updated}
          </span>
        </div>
        {gridContent}
      </div>
    </section>
  )
}

export const MovementAtAGlance = memo(MovementAtAGlanceInner)
