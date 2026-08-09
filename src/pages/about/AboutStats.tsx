import { MovementAtAGlance } from '@/components/stats/MovementAtAGlance'
import type { PublicStats } from '@/services/publicSiteService'

interface AboutStatsProps {
  stats: PublicStats
}

export function AboutStats({ stats }: AboutStatsProps) {
  return (
    <MovementAtAGlance
      variant="embedded"
      stats={stats}
      darkBackground
      eyebrowText="Verified Impact"
    />
  )
}
