import { memo, useEffect, type RefObject } from 'react'
import { gsap } from 'gsap'
import { StatCard } from './StatCard'

interface Stats {
  members: number
  chapters: number
  regions: number
  diaspora: number
  countries: number
  membersDelta: string
  chaptersDelta: string
  diasporaDelta: string
}

interface StatsSectionProps {
  statsGridRef: RefObject<HTMLDivElement | null>
  stats: Stats
}

function StatsSectionInner({ statsGridRef, stats }: StatsSectionProps) {
  // Live quarter stamp. suppressHydrationWarning on the node keeps it quiet if a
  // prerender was baked in a prior quarter — the client value wins.
  const now = new Date()
  const updated = `Updated · Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`

  // GSAP count-up: numbers tick from 0 to their value when the grid scrolls into
  // view. SSR renders the real values (SEO/no-JS); this only runs on the client.
  useEffect(() => {
    const grid = statsGridRef.current
    if (!grid) return
    const spans = Array.from(grid.querySelectorAll<HTMLElement>('[data-countup]'))
    if (!spans.length) return
    // Wait for real data — don't animate the 0 placeholder before the RPC resolves.
    if (spans.every((s) => (Number(s.dataset.countup) || 0) === 0)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Park at 0 on the client (the section is usually still below the fold).
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

  return (
    <section
      aria-labelledby="stats-heading"
      className="home-stats-section py-16 md:py-24 bg-background"
    >
      <div className="page-container">
        <div className="mb-5">
          <h2
            id="stats-heading"
            className="font-meta font-medium text-xl tracking-tight text-on-surface"
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

        <div ref={statsGridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <StatCard
            accent="#CE1126"
            eye="Regions"
            value={stats.regions}
            suffix="/16"
            label="Full presence across every administrative region of Ghana"
            sparkHeights={[6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18]}
            delta="National coverage"
            deltaIcon="circle"
          />
          <StatCard
            accent="#DAA520"
            eye="Diaspora Countries"
            value={stats.countries}
            label="Countries worldwide with Base Diaspora members"
            sparkHeights={[5, 6, 7, 7, 9, 10, 10, 12, 13, 14, 16, 18]}
            delta={stats.chaptersDelta}
            deltaIcon="up"
          />
          <StatCard
            accent="hsl(var(--on-surface))"
            eye="Diaspora"
            value={stats.diaspora}
            label="Global Ghanaians supporting from abroad"
            sparkHeights={[3, 4, 4, 5, 7, 7, 10, 11, 13, 14, 16, 18]}
            delta={stats.diasporaDelta}
            deltaIcon="up"
          />
          <StatCard
            accent="#006B3F"
            eye="Ghana Base"
            value={stats.members}
            label="Verified citizens registered nationwide"
            sparkHeights={[4, 6, 7, 7, 9, 11, 12, 14, 15, 16, 17, 18]}
            delta={stats.membersDelta}
            deltaIcon="up"
          />
        </div>
      </div>
    </section>
  )
}

// Memoised so Home's frequent re-renders (mouse-tracking state) don't reset the
// imperative count-up mid-animation.
export const StatsSection = memo(StatsSectionInner)
