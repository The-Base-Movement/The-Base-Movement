import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Target, 
  Users, 
  Zap, 
  TrendingUp, 
  MapPin, 
  Filter,
  Download,
  Award,
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/types/admin'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function MobilizationMetrics() {
  const [leaderboard, setLeaderboard] = useState<ChapterLeaderboard[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [leaderboardData, achievementsData, pulseData] = await Promise.all([
          adminService.getRegionalLeaderboard(),
          adminService.getAchievements(),
          adminService.getMovementPulse()
        ])
        setLeaderboard(leaderboardData)
        setAchievements(achievementsData)
        setPulse(pulseData)
      } catch (error) {
        console.error('[METRICS] Failed to synchronize mobilization telemetry:', error)
        toast.error('Failed to synchronize mobilization telemetry.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🏆 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-stone-900" />
            Mobilization metrics
          </h1>
          <p className="text-stone-500 text-sm mt-1">Performance tracking and impact analytics for regional chapters.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filter data
          </Button>
          <Button className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10">
            <Download className="w-3.5 h-3.5 mr-2" /> Export report
          </Button>
        </div>
      </div>

      {/* 📊 National Intelligence Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Impact Points', value: pulse?.totalMobilizationPoints?.toLocaleString() || '0', sub: 'Total performance score', icon: Target, color: 'text-[var(--brand-green)]' },
          { label: 'Active Chapters', value: pulse?.activeChapters || '0', sub: 'Verified chapters', icon: Shield, color: 'text-blue-500' },
          { label: 'Top Region', value: pulse?.topPerformingRegion || 'N/A', sub: 'Highest performing area', icon: Trophy, color: 'text-yellow-500' },
          { label: 'Growth Rate', value: `${pulse?.nationalGrowth || 0}%`, sub: 'Quarterly increase', icon: TrendingUp, color: 'text-orange-500' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-xl border-stone-200 shadow-sm bg-white p-6 flex flex-col justify-between hover:border-stone-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-stone-400">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-xl md:text-3xl font-bold tracking-tight text-stone-900">{stat.value}</p>
              <p className="text-[9px] font-bold text-stone-400 mt-1">{stat.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🥇 Primary Leaderboard */}
        <Card className="lg:col-span-2 rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Regional power rankings</CardTitle>
              <CardDescription className="text-[10px] font-bold text-stone-400 mt-1">Aggregated mobilization points by jurisdictional chapter.</CardDescription>
            </div>
            <TrendingUp className="w-6 h-6 text-stone-300" />
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="p-6 text-[10px] font-bold text-stone-400 tracking-tight">Rank</th>
                    <th className="p-6 text-[10px] font-bold text-stone-400 tracking-tight">Chapter / region</th>
                    <th className="p-6 text-[10px] font-bold text-stone-400 tracking-tight text-center">Members</th>
                    <th className="p-6 text-[10px] font-bold text-stone-400 tracking-tight text-center">Achievements</th>
                    <th className="p-6 text-[10px] font-bold text-stone-400 tracking-tight text-right">Impact points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="p-6 h-16 bg-stone-50/50" />
                      </tr>
                    ))
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-stone-400 font-bold normal-case text-[10px]">
                        No regional mobilization data for this period.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <tr key={entry.chapter} className="hover:bg-stone-50/50 transition-colors group cursor-pointer">
                        <td className="p-6">
                          <div className={cn(
                            "w-8 h-8 flex items-center justify-center font-bold text-xs rounded-full",
                            index === 0 ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20" : 
                            index === 1 ? "bg-stone-300 text-stone-800" :
                            index === 2 ? "bg-orange-300 text-orange-900" :
                            "bg-stone-100 text-stone-500"
                          )}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight text-stone-900">{entry.chapter}</span>
                            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {entry.region}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full">
                            <Users className="w-3 h-3 text-stone-500" />
                            <span className="text-xs font-bold text-stone-700">{entry.total_patriots}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full">
                            <Zap className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-bold text-stone-700">{entry.achievements_unlocked}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-lg font-bold tracking-tight text-stone-900">
                            {entry.total_mobilization_points.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Leaderboard Cards */}
            <div className="md:hidden divide-y divide-stone-100">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse space-y-4">
                    <div className="h-4 bg-stone-100 w-3/4 rounded" />
                    <div className="h-12 bg-stone-50 w-full rounded-xl" />
                  </div>
                ))
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center text-stone-400 font-bold text-[10px]">
                  No regional mobilization data.
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div key={entry.chapter} className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 flex items-center justify-center font-bold text-sm rounded-xl shadow-md",
                          index === 0 ? "bg-yellow-500 text-black" : 
                          index === 1 ? "bg-stone-300 text-stone-800" :
                          index === 2 ? "bg-orange-300 text-orange-900" :
                          "bg-stone-100 text-stone-500"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 tracking-tight">{entry.chapter}</h4>
                          <p className="text-[10px] font-bold text-stone-400 flex items-center gap-1 mt-0.5 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" /> {entry.region}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Points</p>
                        <p className="text-lg font-black text-stone-900 tracking-tighter">{entry.total_mobilization_points.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-stone-100">
                          <Users className="w-4 h-4 text-stone-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-stone-400 uppercase">Members</p>
                          <p className="text-xs font-bold text-stone-900">{entry.total_patriots}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-stone-100">
                          <Zap className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-stone-400 uppercase">Badges</p>
                          <p className="text-xs font-bold text-stone-900">{entry.achievements_unlocked}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* 🏅 Movement Milestones */}
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-xs font-bold tracking-tight flex items-center gap-2 text-stone-900">
                <Award className="w-4 h-4 text-yellow-600" /> Available milestones
              </CardTitle>
              <CardDescription className="text-[9px] font-bold text-stone-400 mt-1">Recognition badges for chapter growth.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="flex gap-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-lg self-start group-hover:scale-110 transition-transform">
                      <Target className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-bold leading-none">{achievement.name}</h4>
                      <p className="text-[10px] text-stone-400 font-medium leading-tight">{achievement.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] font-bold text-yellow-500">{achievement.points_awarded} points</span>
                        <span className="text-[9px] font-bold text-stone-500">• {(achievement.category || 'General').toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ⚡ Movement Pulse */}
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-stone-400">Movement velocity</h3>
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-stone-600">Mobilization efficiency</span>
                  <span className="text-sm font-bold">87%</span>
                </div>
                <div className="h-1.5 bg-stone-100 overflow-hidden rounded-full">
                  <div className="h-full bg-stone-900 w-[87%] transition-all duration-1000" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-bold text-stone-600">Recruitment conversion</span>
                  <span className="text-sm font-bold">62%</span>
                </div>
                <div className="h-1.5 bg-stone-100 overflow-hidden rounded-full">
                  <div className="h-full bg-stone-900 w-[62%] transition-all duration-1000" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100">
              <p className="text-[9px] font-bold text-stone-400 leading-relaxed text-center">
                Currently tracking activity across 12 active chapters and 4 key regions.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
