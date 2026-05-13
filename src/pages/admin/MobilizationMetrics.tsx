import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/types/admin'
import { toast } from 'sonner'
import MobilizationLeaderboardCard from '@/components/admin/MobilizationLeaderboardCard'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { 
  Trophy, 
  Download, 
  Filter, 
  TrendingUp, 
  Award, 
  Zap,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'

export default function MobilizationMetrics() {
  const [leaderboard, setLeaderboard] = useState<ChapterLeaderboard[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('All')
  const [isFilterVisible, setIsFilterVisible] = useState(false)

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
        console.error('[METRICS] Failed to synchronize mobilization operational metrics:', error)
        toast.error('Failed to synchronize mobilization operational metrics.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleExport = () => {
    if (!leaderboard.length) {
      toast.error('No data available to export.')
      return
    }
    
    const headers = ['Rank', 'Chapter', 'Region', 'Members', 'Badges', 'Impact Points']
    const csvContent = [
      headers.join(','),
      ...leaderboard.map((entry, index) => [
        index + 1,
        `"${entry.chapter}"`,
        `"${entry.region}"`,
        entry.total_patriots,
        entry.achievements_unlocked,
        entry.total_mobilization_points
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mobilization_metrics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tactical metrics exported successfully.')
  }

  const regions = ['All', ...new Set(leaderboard.map(e => e.region?.trim()).filter(Boolean).sort())]
  
  const filteredLeaderboard = regionFilter === 'All' 
    ? leaderboard 
    : leaderboard.filter(e => e.region === regionFilter)

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-12 h-12 text-muted-foreground/20 animate-spin" />
        <p className="text-micro font-bold normal-case text-muted-foreground/40">Synchronizing mobilization metrics...</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Metrics Header */}
      <div className="flex-columns items-center flex-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 m-0">
            <Trophy className="w-8 h-8 text-on-surface" />
            Mobilization metrics
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-2 mb-0">Performance tracking and impact analytics for regional chapters across the movement's jurisdictional boundaries.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={isFilterVisible ? "primary" : "default"} 
            size="lg"
            className="rounded-sm border-border/40 text-micro px-8 h-10 font-bold capitalize tracking-tight hover:bg-stone-100 transition-all active:scale-95"
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {isFilterVisible ? 'Hide Filters' : 'Filter'}
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {isFilterVisible && (
        <Card className="mb-8 p-4 rounded-sm border-border/60 bg-muted/10 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <span className="text-micro font-bold uppercase tracking-widest text-muted-foreground/60">Region Filter:</span>
            <div className="flex gap-2 overflow-x-auto flex-1 no-scrollbar">
              {regions.map(r => (
                <Button
                  key={r}
                  variant={regionFilter === r ? "primary" : "default"}
                  size="sm"
                  className={cn(
                    "rounded-full px-4 h-8 text-micro font-bold capitalize tracking-tight transition-all",
                    regionFilter !== r && "bg-transparent border-border/60"
                  )}
                  onClick={() => setRegionFilter(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI 
          label="Impact Points"
          value={pulse?.totalMobilizationPoints || 0}
          description="Total performance score"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI 
          label="Active Chapters"
          value={pulse?.activeChapters || 0}
          description="Verified chapters"
        />
        <TacticalKPI 
          label="Top Region"
          value={pulse?.topPerformingRegion || 'N/A'}
          description="Highest performing area"
          trend={{ direction: 'neutral', value: 'Lead' }}
        />
        <TacticalKPI 
          label="Growth Rate"
          value={`${pulse?.nationalGrowth || 0}%`}
          description="Quarterly increase"
          trend={{ direction: (pulse?.nationalGrowth || 0) > 0 ? 'up' : 'neutral', value: 'Pulse' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 🏆 Leaderboard Panel */}
        <div className="xl:col-span-2">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Regional power rankings</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Aggregated mobilization points</p>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground/40" />
            </CardHeader>
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest w-16">Rank</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest">Chapter / Region</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest text-center">Members</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest text-center">Badges</th>
                      <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 uppercase tracking-widest text-right">Impact Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredLeaderboard.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-micro font-bold text-muted-foreground/40">No regional mobilization data available.</td>
                      </tr>
                    ) : (
                      filteredLeaderboard.map((entry, index) => (
                        <tr key={entry.chapter} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-5">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                              index === 0 ? "bg-accent text-white shadow-lg" : 
                              index === 1 ? "bg-primary/20 text-primary" : "bg-muted/10 border border-border/40 text-muted-foreground/60"
                            )}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-on-surface">{entry.chapter}</span>
                              <span className="text-micro font-bold text-muted-foreground/40 mt-0.5 uppercase tracking-tighter">{entry.region}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-2.5 py-1 text-micro font-bold bg-muted/10 border border-border/20 rounded-md text-muted-foreground/60">{entry.total_patriots}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="px-2.5 py-1 text-micro font-bold bg-accent/10 border border-accent/20 rounded-md text-accent">{entry.achievements_unlocked}</span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-xs font-bold text-on-surface">{entry.total_mobilization_points.toLocaleString()}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-border/40">
                {filteredLeaderboard.length === 0 ? (
                  <div className="px-6 py-12 text-center text-micro font-bold text-muted-foreground/40">No regional data found.</div>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <MobilizationLeaderboardCard key={entry.chapter} entry={entry} index={index} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🌟 Milestones & Pulse Panel */}
        <div className="xl:col-span-1 space-y-8">
          {/* Milestones */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Available milestones</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Recognition badges</p>
              </div>
              <Award className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 bg-muted/10 border-l-4 border-accent rounded-sm space-y-1 hover:bg-muted/20 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface">{achievement.name}</span>
                    <span className="text-micro font-bold text-accent">+{achievement.points_awarded} pts</span>
                  </div>
                  <p className="text-micro font-bold text-muted-foreground/60 leading-relaxed normal-case">{achievement.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pulse */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-white/5 relative z-10 flex flex-row items-center justify-between">
              <h3 className="text-micro font-bold uppercase tracking-widest text-white/40 m-0">Movement velocity</h3>
              <Zap className="w-5 h-5 text-accent" />
            </CardHeader>
            <CardContent className="p-6 space-y-8 relative z-10">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-micro font-bold uppercase tracking-widest text-white/60">Mobilization efficiency</span>
                    <span className="text-xs font-bold text-white">87%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: '87%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-micro font-bold uppercase tracking-widest text-white/60">Recruitment conversion</span>
                    <span className="text-xs font-bold text-white">62%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '62%' }} />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 text-center">
                <p className="text-micro font-bold text-white/30 leading-relaxed normal-case tracking-tight italic">
                  Currently tracking activity across {pulse?.activeChapters || 0} active chapters and {leaderboard.length} regions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
