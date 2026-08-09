import { type RefObject } from 'react'
import { MovementAtAGlance } from '@/components/stats/MovementAtAGlance'
import type { PublicStats } from '@/services/publicSiteService'

interface StatsSectionProps {
  statsGridRef: RefObject<HTMLDivElement | null>
  stats: PublicStats
}

export function StatsSection({ statsGridRef, stats }: StatsSectionProps) {
  return <MovementAtAGlance variant="section" statsGridRef={statsGridRef} stats={stats} />
}
