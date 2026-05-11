import { Users, Navigation, Trophy, Flag } from 'lucide-react'
import type { FieldAction } from '@/types/admin'

interface GrowthStats {
  joined_last_hour: number
  joined_last_24h: number
  joined_last_7d: number
}

interface StatCardsProps {
  stats: GrowthStats | null
  fieldActions: FieldAction[]
  totalPoints: number
  unlockedAchievementsCount: number
}

export function StatCards({ stats, fieldActions, totalPoints, unlockedAchievementsCount }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm group hover:border-primary/40 transition-all">
        <div className="flex items-center justify-between mb-4">
          <span className="text-tiny font-bold text-on-surface/40 tracking-tight">New Members</span>
          <Users className="w-4 h-4 text-primary opacity-40" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tighter m-0">{stats?.joined_last_24h || 0}</h3>
          <span className="text-tiny font-bold text-on-surface/20">Past 24h</span>
        </div>
        <p className="text-micro text-on-surface/30 mt-4 font-medium italic">National digital infrastructure stabilized and the regional rollout is now underway.</p>
      </div>
      <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-tiny font-bold text-on-surface/40 tracking-tight">Active outreach</span>
          <Navigation className="w-4 h-4 text-primary opacity-40" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight m-0">{fieldActions.length}</h3>
          <span className="text-tiny font-bold text-on-surface/20">In area</span>
        </div>
        <p className="text-tiny text-on-surface/30 mt-4 font-medium italic">No community actions detected yet.</p>
      </div>
      <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-tiny font-bold text-on-surface/40 tracking-tight">Impact points</span>
          <Trophy className="w-4 h-4 text-[var(--brand-gold)] opacity-40" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight m-0">{totalPoints}</h3>
          <span className="text-tiny font-bold text-on-surface/20">Earned</span>
        </div>
        <p className="text-tiny text-on-surface/30 mt-4 font-medium italic">Participate to earn your first points.</p>
      </div>
      <div className="bg-white border border-border/40 p-6 rounded-none shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-tiny font-bold text-on-surface/40 tracking-tight">Achievements</span>
          <Flag className="w-4 h-4 text-[var(--brand-red)] opacity-40" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold tracking-tight m-0">{unlockedAchievementsCount}</h3>
          <span className="text-tiny font-bold text-on-surface/20">Unlocked</span>
        </div>
        <p className="text-tiny text-on-surface/30 mt-4 font-medium italic">Complete actions to earn badges.</p>
      </div>
    </div>
  )
}
