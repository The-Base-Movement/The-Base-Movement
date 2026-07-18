import type { RefObject } from 'react'
import { StatCard } from './StatCard'

interface Stats {
  members: number
  chapters: number
  regions: number
  diaspora: number
  membersDelta: string
  chaptersDelta: string
  diasporaDelta: string
}

interface StatsSectionProps {
  statsGridRef: RefObject<HTMLDivElement | null>
  stats: Stats
}

export function StatsSection({ statsGridRef, stats }: StatsSectionProps) {
  // Live quarter stamp. suppressHydrationWarning on the node keeps it quiet if a
  // prerender was baked in a prior quarter — the client value wins.
  const now = new Date()
  const updated = `Updated · Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
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
            eye="Base Diaspora"
            value={stats.chapters}
            label="Base Diaspora networks organised by country worldwide"
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
