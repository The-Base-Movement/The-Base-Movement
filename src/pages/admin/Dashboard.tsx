import { 
  Users, 
  MapPin, 
  ShoppingBag, 
  Activity,
  Globe,
  Trash2
} from 'lucide-react'


import type { LucideIcon } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { logisticsService } from '@/services/logisticsService'
import { contentService } from '@/services/contentService'
import type { GrowthTrend, SentimentStat, AuditLogEntry, RegionalStat, LogisticsLatency } from '@/types/admin'
import { useState, useEffect } from 'react'

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { BrandLine } from '@/components/ui/BrandLine'

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
}

// Operational Skeleton Component
function SkeletonCard() {
  return (
    <Card className="rounded-sm border-border/60 shadow-none overflow-hidden bg-white">
      <CardContent className="p-5 space-y-3">
        <dt className="w-1/4 h-2 bg-muted/10 animate-pulse rounded-full" />
        <dd className="m-0 w-1/2 h-6 bg-muted/10 animate-pulse rounded-lg" />
      </CardContent>
    </Card>
  )
}

// Operational Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="rounded-sm border-border/40 shadow-sm transition-all overflow-hidden bg-white hover:border-border/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <dt className="text-[10px] sm:text-[11px] font-bold text-muted-foreground/80 normal-case truncate">{title}</dt>
            <dd className="m-0 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-on-surface tabular-nums truncate">{value}</span>
              <span className={cn(
                "text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 whitespace-nowrap",
                change.startsWith('+') ? "text-primary" : "text-muted-foreground/80"
              )}>
                {change}
              </span>
            </dd>
          </div>
          <div className={cn("w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-muted/10", color.replace('bg-', 'text-'))}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



export default function AdminDashboard() {
  const [growthData, setGrowthData] = useState<GrowthTrend[]>([])
  const [sentimentStats, setSentimentStats] = useState<SentimentStat[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [globalStats, setGlobalStats] = useState<{ label: string, value: string, change: string }[]>([])
  const [logisticsData, setLogisticsData] = useState<LogisticsLatency[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      console.log('[SYSTEM] Dashboard: Starting data fetch...')
      setIsLoading(true)
      try {
        const [growth, sentiment, audit, regions, stats, logistics, trashedBlogs, trashedProducts, trashedMedia] = await Promise.all([
          adminService.getGrowthTrends(),
          adminService.getSentimentAnalysis(),
          adminService.getSystemAuditLogs(),
          adminService.getRegionalStats(),
          adminService.getGlobalStats(),
          logisticsService.getLogisticsLatency(),
          contentService.getTrashedBlogPosts(),
          logisticsService.getTrashedInventory(),
          contentService.getTrashedMedia()
        ])
        setGrowthData(growth)
        setSentimentStats(sentiment)
        setAuditLogs(audit)
        setRegionalStats(regions)
        setGlobalStats(stats)
        setLogisticsData(logistics)
        setTrashCount(trashedBlogs.length + trashedProducts.length + trashedMedia.length)
        console.log('[SYSTEM] Dashboard: Data fetch complete.')
      } catch (error) {
        console.error('[SYSTEM] Dashboard: Data fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (regionalStats.length === 0) {
      toast({
        title: "No data available",
        description: "There is no regional data to export at this time.",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    toast({
      title: "Generating export",
      description: "Aggregating regional performance telemetry...",
    })
    
    try {
      // Aggregate real regional data
      const headers = ['Region', 'Member Count', 'Chapters', 'Performance Status', 'Activity Level']
      const rows = regionalStats.map(r => [
        r.region,
        r.memberCount,
        r.chapters,
        r.performance,
        r.memberCount > 1000 ? 'Peak' : r.memberCount > 100 ? 'High' : 'Normal'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      const timestamp = new Date().toISOString().split('T')[0]
      a.setAttribute('href', url)
      a.setAttribute('download', `base_regional_performance_${timestamp}.csv`)
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)

      setIsExporting(false)
      toast({
        title: "Export complete",
        description: "The regional performance report has been successfully generated.",
      })
    } catch (error) {
      console.error('[DASHBOARD] Export failure:', error)
      setIsExporting(false)
      toast({
        title: "Export failed",
        description: "A critical error occurred during data aggregation.",
        variant: "destructive"
      })
    }
  }


  const handlePlatformLogs = () => {
    navigate('/admin/settings?tab=audit')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Activity className="w-8 h-8 text-on-surface" />
            Operational dashboard
          </h1>
          <BrandLine className="mt-4" />
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground/80 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              16 regions active
            </p>
            <p className="text-muted-foreground/80 text-xs font-medium">Telemetry updated 2m ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            size="lg"
            className="rounded-sm text-[10px] font-bold tracking-tight px-8 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting telemetry...' : 'Export regional data'}
          </Button>

          <Button 
            variant="outline"
            size="lg"
            className="rounded-sm text-[10px] font-bold tracking-tight px-8 border-border/40 hover:bg-stone-50 h-12 transition-all active:scale-95"
            onClick={handlePlatformLogs}
          >
            System logs
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Members" value={globalStats[0]?.value || "0"} change={globalStats[0]?.change || "0%"} icon={Users} color="bg-destructive" />
            <StatCard title="Chapters" value={globalStats[1]?.value || "0"} change={globalStats[1]?.change || "0%"} icon={MapPin} color="bg-accent" />
            <StatCard title="Trash Vault" value={trashCount.toString()} change="30d retention" icon={Trash2} color="bg-on-surface" />
            <StatCard title="Inventory" value={globalStats[3]?.value || "0"} change={globalStats[3]?.change || "0%"} icon={ShoppingBag} color="bg-primary" />
          </>
        )}
      </dl>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
        <div className="xl:col-span-2 space-y-10">
          
          {/* Membership Growth Trend */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/5">
              <div>
                <CardTitle className="text-sm font-bold text-on-surface flex items-center gap-2">
                  Membership Growth
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-muted-foreground/80 mt-1">Rolling 30-day expansion trend</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select className="h-7 px-2 bg-white border border-border/60 text-[10px] font-bold text-on-surface/80 rounded-lg outline-none">
                  <option>Last 30 Days</option>
                  <option>Last 90 Days</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border) / 0.4)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--on-surface) / 0.4)' }}
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--on-surface) / 0.4)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      border: 'none', 
                      borderRadius: '6px', 
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '500',
                      padding: '8px 12px'
                    }} 
                    labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorGrowth)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* Regional Performance - Filtered Table */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-on-surface">Regional Distribution</CardTitle>
                <CardDescription className="text-[11px] font-medium text-muted-foreground/80 mt-1">Top performing regions by member count</CardDescription>
              </div>
              <Button variant="ghost" className="h-7 px-2 text-[10px] font-bold tracking-tight text-muted-foreground/80 hover:text-on-surface active:scale-95">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="p-4 pl-6 text-[10px] font-bold tracking-wider text-muted-foreground/80">Region</th>
                    <th className="p-4 text-[10px] font-bold tracking-wider text-muted-foreground/80">Members</th>
                    <th className="p-4 text-[10px] font-bold tracking-wider text-muted-foreground/80">Chapters</th>
                    <th className="p-4 pr-6 text-right text-[10px] font-bold tracking-wider text-muted-foreground/80">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {regionalStats.filter(r => r.memberCount > 0).length > 0 ? (
                    regionalStats.filter(r => r.memberCount > 0).slice(0, 5).map((region) => (
                      <tr key={region.region} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: region.color }} />
                            <span className="text-xs font-semibold text-on-surface">{region.region}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-on-surface/80 tabular-nums">{region.memberCount.toLocaleString()}</td>
                        <td className="p-4 text-xs font-medium text-on-surface/80 tabular-nums">{region.chapters}</td>
                        <td className="p-4 pr-6 text-right">
                          <span className={cn("px-2 py-0.5 text-[9px] font-bold rounded-full", 
                            region.performance === 'High' ? "bg-primary/10 text-primary" : "bg-border/40 text-muted-foreground/80"
                          )}>
                            {region.performance}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground/80 text-xs font-medium italic">
                        No regional data available for current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* System Activity & Logistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* System Activity Table */}
            <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
                <CardTitle className="text-sm font-bold text-on-surface">System Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border/40">
                    {auditLogs.length > 0 ? (
                      auditLogs.slice(0, 6).map((log) => (
                        <tr key={log.id} className="text-[11px] hover:bg-muted/5 transition-colors">
                          <td className="p-4 pl-6 text-muted-foreground/80 font-medium whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-on-surface">{log.adminName.split(' ')[0]}</span>
                            <span className="text-muted-foreground/80 ml-1.5">{log.action.toLowerCase()}</span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className={cn("w-1.5 h-1.5 rounded-full inline-block", 
                              log.status === 'Success' ? "bg-primary" : "bg-accent"
                            )} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-12 text-center text-muted-foreground/80 text-xs font-medium italic">
                          No recent system activity.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="p-4 border-t border-border/40 text-center">
                  <Button variant="ghost" onClick={handlePlatformLogs} className="h-7 text-[10px] font-bold tracking-tight text-muted-foreground/80 hover:text-on-surface active:scale-95">
                    View full activity log
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logistics Performance */}
            <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-6 border-b border-border/40 bg-muted/5 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-on-surface">Logistics Performance</CardTitle>
                <ShoppingBag className="w-4 h-4 text-muted-foreground/40" />
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {logisticsData.length > 0 ? (
                  logisticsData.slice(0, 3).map((item) => (
                    <div key={item.region} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold text-muted-foreground/80 tracking-wide">{item.region}</p>
                        <p className="text-xs font-bold text-on-surface tabular-nums">{item.avgDispatchToDeliveryDays}d <span className="text-[10px] font-medium text-muted-foreground/80 ml-1">avg</span></p>
                      </div>
                      <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                        <div className="h-full bg-on-surface rounded-full" style={{ width: `${Math.min(100, (3 / item.avgDispatchToDeliveryDays) * 100)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground/80 text-xs font-medium italic">
                    Logistics data unavailable.
                  </div>
                )}
                <div className="pt-4">
                   <div className="bg-muted/10 rounded-lg p-4 flex justify-between items-center border border-border/40">
                      <p className="text-[10px] font-bold text-muted-foreground/80 tracking-wider">Overall velocity</p>
                     <p className="text-sm font-bold text-on-surface tracking-tight">3.2 Days</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operational Health (Right Sidebar) */}
        <div className="space-y-10">
          {/* Health & Status Consolidated */}
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-[11px] font-bold tracking-wider text-muted-foreground/80">Operations health</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* System Health */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface/80">Infrastructure</span>
                  <span className="text-primary font-bold">Optimal</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface/80">Database Engine</span>
                  <span className="text-primary font-bold">Stable</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-on-surface/80">Regional Sync</span>
                  <span className="text-primary font-bold">Active</span>
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Engagement Pulse (Simplified) */}
              <div className="space-y-6">
                <p className="text-[10px] font-bold text-muted-foreground/80 tracking-wider">Sentiment pulse</p>
                {sentimentStats.length > 0 && sentimentStats.some(s => s.score > 0) ? (
                  sentimentStats.slice(0, 3).map((stat) => (
                    <div key={stat.topic} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[11px] font-bold text-on-surface">{stat.topic}</p>
                        <span className="text-xs font-bold tabular-nums">{stat.score}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                        <div className="h-full bg-on-surface opacity-20 rounded-full" style={{ width: `${stat.score}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground/80 text-[10px] font-medium italic py-4">
                    No recent sentiment data.
                  </div>
                )}
              </div>

              <div className="h-px bg-border/40" />

              {/* Quick Status Bar */}
              <div className="bg-on-surface rounded-sm p-6 text-white relative overflow-hidden group shadow-lg">
                <Globe className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold tracking-wider text-white/40">Core system</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums tracking-tighter">99.8%</span>
                    <span className="text-[10px] font-medium text-white/30 tracking-wider">Uptime</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Traffic Summary */}
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-[11px] font-bold tracking-wider text-muted-foreground/80">Regional traffic</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-lg bg-muted/10 flex items-center justify-center text-[10px] font-bold text-on-surface border border-border/40">GA</div>
                     <div>
                       <p className="text-xs font-bold text-on-surface">Greater Accra</p>
                       <p className="text-[10px] text-muted-foreground/80 font-medium">Peak flow detected</p>
                     </div>
                   </div>
                   <Activity className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-lg bg-muted/10 flex items-center justify-center text-[10px] font-bold text-on-surface border border-border/40">AS</div>
                     <div>
                       <p className="text-xs font-bold text-on-surface">Ashanti</p>
                       <p className="text-[10px] text-muted-foreground/80 font-medium">Normal operations</p>
                     </div>
                     </div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}

