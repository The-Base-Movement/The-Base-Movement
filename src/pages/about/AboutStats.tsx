import { StatCard } from '../home/StatCard'
import type { PublicStats } from '@/services/publicSiteService'

interface AboutStatsProps {
  stats: PublicStats
}

export function AboutStats({ stats }: AboutStatsProps) {
  const now = new Date()
  const updated = `Updated · Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`

  return (
    <div>
      <div className="mb-8">
        <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-accent font-meta block mb-2">
          Verified Impact
        </span>
        <h2 className="font-meta font-medium text-2xl md:text-4xl tracking-tight text-white mb-1">
          Movement at a glance
        </h2>
        <span
          suppressHydrationWarning
          className="text-xs font-meta font-medium text-white/60 uppercase tracking-[.06em] mt-1 block"
        >
          {updated}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
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
          eye="Base Diaspora"
          value={stats.chapters}
          label="Base Diaspora networks organised by country worldwide"
          series={[]}
          delta={stats.countries ? `In ${stats.countries.toLocaleString()} countries` : ''}
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
    </div>
  )
}
