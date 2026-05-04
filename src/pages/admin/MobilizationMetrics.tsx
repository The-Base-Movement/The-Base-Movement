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
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/services/adminService'
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
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* 🏆 Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-stone-900 p-10 -m-8 mb-4 border-b border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter font-meta italic">Mobilization Metrics</h1>
          </div>
          <p className="text-stone-400 text-sm font-medium tracking-wide max-w-xl">
            Real-time competitive telemetry for regional chapters. Rewarding tactical impact and recruitment excellence.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-none h-12 px-6 font-black text-[10px] uppercase tracking-widest">
            <Filter className="w-4 h-4 mr-2" /> Filter Data
          </Button>
          <Button className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-none h-12 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-yellow-500/20">
            <Download className="w-4 h-4 mr-2" /> Export Intel
          </Button>
        </div>
      </div>

      {/* 📊 National Intelligence Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'National Impact Points', value: pulse?.totalMobilizationPoints?.toLocaleString() || '0', sub: 'Aggregated Field Excellence', icon: Target, color: 'text-[var(--brand-green)]' },
          { label: 'Active Chapters', value: pulse?.activeChapters || '0', sub: 'Verified Jurisdictions', icon: Shield, color: 'text-blue-500' },
          { label: 'Top Performing Region', value: pulse?.topPerformingRegion || 'N/A', sub: 'Mobilization Leader', icon: Trophy, color: 'text-yellow-500' },
          { label: 'Movement Velocity', value: `${pulse?.nationalGrowth || 0}%`, sub: 'Quarterly Expansion', icon: TrendingUp, color: 'text-orange-500' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-none border-stone-200 shadow-sm bg-white p-6 flex flex-col justify-between hover:border-stone-400 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-3xl font-black italic tracking-tighter text-stone-900">{stat.value}</p>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{stat.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🥇 Primary Leaderboard */}
        <Card className="lg:col-span-2 rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight font-meta italic">Regional Power Rankings</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Aggregated mobilization points by jurisdictional chapter.</CardDescription>
            </div>
            <TrendingUp className="w-6 h-6 text-stone-300" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Rank</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Chapter / Region</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400 text-center">Patriots</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400 text-center">Achievements</th>
                    <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400 text-right">Impact Points</th>
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
                      <td colSpan={5} className="p-20 text-center text-stone-400 font-bold uppercase text-[10px] tracking-widest">
                        No mobilization data recorded.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <tr key={entry.chapter} className="hover:bg-stone-50/50 transition-colors group cursor-pointer">
                        <td className="p-6">
                          <div className={cn(
                            "w-8 h-8 flex items-center justify-center font-black text-xs rounded-full",
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
                            <span className="text-sm font-black uppercase tracking-tight text-stone-900">{entry.chapter}</span>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {entry.region}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full">
                            <Users className="w-3 h-3 text-stone-500" />
                            <span className="text-xs font-black text-stone-700">{entry.total_patriots}</span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full">
                            <Zap className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-black text-stone-700">{entry.achievements_unlocked}</span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-lg font-black tracking-tighter text-[var(--brand-black)] italic">
                            {entry.total_mobilization_points.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* 🏅 Movement Milestones */}
          <Card className="rounded-none border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-lg font-black uppercase tracking-tight font-meta italic flex items-center gap-2 text-yellow-500">
                <Award className="w-5 h-5" /> Available Milestones
              </CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mt-1">Foundational badges for regional expansion.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 bg-white/5 border border-white/5 hover:border-white/10 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="flex gap-4 relative z-10">
                    <div className="p-3 bg-white/10 rounded-none self-start group-hover:scale-110 transition-transform">
                      <Target className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black uppercase tracking-widest leading-none">{achievement.name}</h4>
                      <p className="text-[10px] text-stone-400 font-medium leading-tight">{achievement.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">{achievement.points_awarded} Points</span>
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">• {achievement.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ⚡ Movement Pulse */}
          <Card className="rounded-none border-stone-200 shadow-sm bg-white p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Movement Velocity</h3>
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">Mobilization Efficiency</span>
                  <span className="text-sm font-black italic">87%</span>
                </div>
                <div className="h-1.5 bg-stone-100 overflow-hidden">
                  <div className="h-full bg-stone-900 w-[87%] transition-all duration-1000" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-600">Recruitment Conversion</span>
                  <span className="text-sm font-black italic">62%</span>
                </div>
                <div className="h-1.5 bg-stone-100 overflow-hidden">
                  <div className="h-full bg-stone-900 w-[62%] transition-all duration-1000" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-stone-100">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest italic leading-relaxed text-center">
                Leadership is currently monitoring 12 active chapters across 4 tactical regions.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
