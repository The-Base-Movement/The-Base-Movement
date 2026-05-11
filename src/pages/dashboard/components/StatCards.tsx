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

function Tile({ color, label, value, delta, deltaDown }: {
  color: 'red' | 'gold' | 'ink' | 'green'
  label: string
  value: string | number
  delta: string
  deltaDown?: boolean
}) {
  const accentClass = {
    red: 'bg-destructive',
    gold: 'bg-accent',
    ink: 'bg-[#181d19]',
    green: 'bg-primary',
  }[color]

  const deltaColor = deltaDown ? 'text-destructive' : 'text-primary'

  return (
    <div className="bg-white border border-border rounded-[6px] p-[18px] relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentClass}`} />
      <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[0.06em] font-meta leading-none">
        {label}
      </div>
      <div className="font-meta text-[32px] font-extrabold tracking-[-0.025em] leading-none my-2 text-on-surface">
        {value}
      </div>
      <div className={`text-[11px] font-bold ${deltaColor} font-meta flex items-center gap-1`}>
        {delta}
      </div>
    </div>
  )
}

export function StatCards({ stats, fieldActions, totalPoints, unlockedAchievementsCount }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-4">
      <Tile
        color="red"
        label="New members"
        value={stats?.joined_last_24h ?? 0}
        delta="Past 24 hours"
      />
      <Tile
        color="gold"
        label="Active outreach"
        value={fieldActions.length}
        delta={fieldActions.length > 0 ? `${fieldActions.length} in your area` : 'None nearby'}
      />
      <Tile
        color="ink"
        label="Impact points"
        value={totalPoints}
        delta={totalPoints > 0 ? `${totalPoints} earned` : 'Participate to earn'}
      />
      <Tile
        color="green"
        label="Achievements"
        value={unlockedAchievementsCount}
        delta={unlockedAchievementsCount > 0 ? `${unlockedAchievementsCount} unlocked` : 'Complete actions'}
      />
    </div>
  )
}
