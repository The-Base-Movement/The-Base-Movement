import { Trophy, Medal, Star } from 'lucide-react'
import type { LeaderboardEntry, Achievement } from '@/types/admin'
import { cn } from '@/lib/utils'

interface AchievementsAndLeaderboardProps {
  leaderboard: LeaderboardEntry[]
  achievements: Achievement[]
  region: string
}

export function AchievementsAndLeaderboard({ leaderboard, achievements, region }: AchievementsAndLeaderboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Regional Leaderboard */}
      <div className="bg-white border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-tight text-primary flex items-center gap-2 m-0">
            <Trophy className="w-4 h-4" />
            Regional Patriots - {region || 'National'}
          </h3>
          <span className="text-micro font-bold text-on-surface/30 tracking-tight">Top 5 Members</span>
        </div>
        <div className="divide-y divide-border/10">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-on-surface/30 italic text-xs">
              No regional data available yet.
            </div>
          ) : (
            leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.name} className="p-4 flex items-center justify-between hover:bg-on-surface/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    index === 0 ? "bg-accent text-accent-foreground" : "bg-on-surface/5 text-on-surface/40"
                  )}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-on-surface tracking-tight">{entry.name}</span>
                </div>
                <span className="text-xs font-bold italic text-primary">{entry.points.toLocaleString()} pts</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div className="bg-surface-warm border border-border/40 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-on-surface/5 border-b border-border/10 p-4 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-tight text-accent flex items-center gap-2 m-0">
            <Medal className="w-4 h-4" />
            Unlocked Achievements
          </h3>
          <span className="text-micro font-bold text-on-surface/30 tracking-tight">{achievements.length} Unlocked</span>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {achievements.length === 0 ? (
            <div className="col-span-full p-4 text-center text-on-surface/30 italic text-xs">
              No achievements unlocked yet.
            </div>
          ) : (
            achievements.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center text-center p-3 bg-white/50 border border-border/10 rounded-sm hover:border-accent/40 transition-all group">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-on-surface tracking-tight leading-tight">{achievement.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
