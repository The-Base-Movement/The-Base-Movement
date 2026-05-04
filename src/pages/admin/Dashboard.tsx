import { 
  Users, 
  MapPin, 
  ShoppingBag, 
  Activity,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { logisticsService } from '@/services/logisticsService'
import type { GrowthTrend, SentimentStat, AuditLogEntry, RegionalStat, LogisticsLatency } from '@/types/admin'
import { useState, useEffect } from 'react'
import { GhanaGrowthMap } from '@/components/admin/GhanaGrowthMap'
import { PulseReport } from '@/components/admin/PulseReport'
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

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
}

// High-Fidelity Skeleton Loading Component
function SkeletonCard() {
  return (
    <Card className="rounded-xl border-stone-200 shadow-none overflow-hidden bg-white">
      <CardContent className="p-6 space-y-4">
        <div className="w-1/3 h-2 bg-stone-100 animate-pulse rounded-full" />
        <div className="w-2/3 h-8 bg-stone-50 animate-pulse rounded-md" />
        <div className="w-1/2 h-3 bg-stone-100 animate-pulse rounded-full" />
      </CardContent>
    </Card>
  )
}

// High-Fidelity Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="rounded-xl border-stone-200 shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-bold text-stone-900 tracking-tight">{value}</h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> {change}
              </span>
              <span className="text-[9px] font-medium text-stone-400 uppercase tracking-tight">vs last week</span>
            </div>
          </div>
          <div className={cn("w-12 h-12 flex items-center justify-center rounded-xl bg-stone-50 group-hover:scale-110 transition-transform", color.replace('bg-', 'text-'))}>
            <Icon className="w-6 h-6" />
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
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      console.log('[SYSTEM] Dashboard: Starting data fetch...')
      setIsLoading(true)
      try {
        const [growth, sentiment, audit, regions, stats, logistics] = await Promise.all([
          adminService.getGrowthTrends(),
          adminService.getSentimentAnalysis(),
          adminService.getSystemAuditLogs(),
          adminService.getRegionalStats(),
          adminService.getGlobalStats(),
          logisticsService.getLogisticsLatency()
        ])
        setGrowthData(growth)
        setSentimentStats(sentiment)
        setAuditLogs(audit)
        setRegionalStats(regions)
        setGlobalStats(stats)
        setLogisticsData(logistics)
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
    setIsExporting(true)
    toast({
      title: "PREPARING INTELLIGENCE EXPORT",
      description: "Generating high-fidelity movement telemetry report...",
    })
    
    // Simulate high-speed processing
    setIsExporting(false)
    toast({
      title: "EXPORT COMPLETE",
      description: "Intelligence vault updated. File ready for regional HQ.",
      variant: "default",
    })
  }

  const handlePlatformLogs = () => {
    navigate('/admin/settings?tab=audit')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Command Center</h1>
          <p className="text-stone-500 text-base mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live movement telemetry active. Monitoring 16 regional HQs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-10 px-5 text-xs font-bold text-stone-900 border-stone-200 hover:bg-stone-900 hover:text-white transition-all uppercase tracking-wider rounded-md"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Generating...' : 'Export Intelligence'}
          </Button>
          <Button 
            className="h-10 px-5 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 transition-all active:scale-95 uppercase tracking-wider rounded-md"
            onClick={handlePlatformLogs}
          >
            System Logs
          </Button>
        </div>
      </div>

      {/* Intelligence Hub Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-2 flex flex-wrap items-center gap-2 mb-8 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search regional telemetry..." 
            className="w-full h-10 pl-11 pr-4 bg-stone-50 border-none text-xs font-medium placeholder:text-stone-400 focus:ring-1 focus:ring-stone-200 transition-all rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="h-10 px-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-widest text-stone-600 focus:ring-1 focus:ring-stone-200 cursor-pointer rounded-lg">
            <option>All Regions</option>
            <option>Greater Accra</option>
            <option>Ashanti</option>
          </select>
          <select className="h-10 px-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-widest text-stone-600 focus:ring-1 focus:ring-stone-200 cursor-pointer rounded-lg">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <Button variant="ghost" className="h-10 px-4 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900">
            Reset
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title={globalStats[0]?.label || "Members"} value={globalStats[0]?.value || "0"} change={globalStats[0]?.change || "0%"} icon={Users} color="bg-[var(--brand-red)]" />
            <StatCard title={globalStats[1]?.label || "Chapters"} value={globalStats[1]?.value || "0"} change={globalStats[1]?.change || "0%"} icon={MapPin} color="bg-[var(--brand-gold)]" />
            <StatCard title={globalStats[2]?.label || "Activity"} value={globalStats[2]?.value || "0"} change={globalStats[2]?.change || "0%"} icon={Activity} color="bg-stone-900" />
            <StatCard title={globalStats[3]?.label || "Inventory"} value={globalStats[3]?.value || "0"} change={globalStats[3]?.change || "0%"} icon={ShoppingBag} color="bg-emerald-600" />
          </>
        )}
      </div>

      {/* Movement Pulse Report */}
      <section className="mb-10">
        <PulseReport />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Main Intelligence Hub (Left/Middle Column) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Growth Intelligence Visualization */}
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--brand-gold)]" />
                  Growth Intelligence
                </CardTitle>
                <CardDescription className="text-sm font-medium text-stone-400 mt-1">Real-time member expansion telemetry across all regions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#a8a29e' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#a8a29e' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: '600'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ce1126" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorGrowth)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* Regional Impact Intelligence Hub */}
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100">
              <CardTitle className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--brand-gold)]" />
                Regional Expansion Map
              </CardTitle>
              <CardDescription className="text-sm font-medium text-stone-400 mt-1">Geospatial visualization of movement density across Ghana's 16 regions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="border-r border-stone-100">
                  <GhanaGrowthMap 
                    data={regionalStats} 
                    onRegionClick={(region) => {
                      toast({
                        title: `${region.toUpperCase()} REGIONAL FOCUS`,
                        description: `Retrieving detailed telemetry for ${region}...`,
                      })
                    }} 
                  />
                </div>
                <div className="divide-y divide-stone-50 max-h-[500px] overflow-y-auto">
                  {regionalStats.map((region) => (
                    <div key={region.region} className="p-6 hover:bg-stone-50 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: region.color }} 
                          />
                          <p className="text-xs font-bold text-stone-900 uppercase tracking-wide">{region.region}</p>
                        </div>
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", 
                          region.performance === 'High' ? 'bg-emerald-50 text-emerald-600' : 
                          region.performance === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        )}>
                          {region.performance}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-bold text-stone-900 leading-none">{region.memberCount.toLocaleString()}</p>
                          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mt-2">Total Members</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-stone-600">{region.chapters}</p>
                          <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mt-1">Chapters</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Audit Intelligence Hub */}
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--brand-red)]" />
                  System Audit Feed
                </CardTitle>
                <CardDescription className="text-sm font-medium text-stone-400 mt-1">Real-time tracking of all administrative operations.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Live Stream</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Timestamp</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Administrator</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Action</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 text-stone-500 font-medium">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-[9px] font-bold">HQ</div>
                            <span className="font-bold text-stone-900">{log.adminName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-stone-700">{log.action}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full", 
                            log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 
                            log.status === 'Warning' ? 'bg-amber-50 text-amber-600' : 
                            'bg-rose-50 text-rose-600'
                          )}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-stone-50 bg-stone-50/20">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/settings?tab=audit')}
                  className="w-full h-11 rounded-md border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-900 hover:text-white transition-all uppercase tracking-wider"
                >
                  Access Full Audit Vault
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logistics Intelligence Hub */}
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  Logistics Intelligence
                </CardTitle>
                <CardDescription className="text-sm font-medium text-stone-400 mt-1">Mobilization latency and supply chain efficiency.</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-stone-900">3.2 Days</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Avg Velocity</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-stone-50">
                {logisticsData.slice(0, 4).map((item) => (
                  <div key={item.region} className="p-6 hover:bg-stone-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{item.region}</p>
                      <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", 
                        item.efficiency === 'High' ? 'bg-emerald-50 text-emerald-600' : 
                        item.efficiency === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      )}>
                        {item.efficiency}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-stone-900 leading-none">{item.avgDispatchToDeliveryDays}d</p>
                        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mt-2">Delivery Time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-600">{item.totalDispatches}</p>
                        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mt-1">Shipments</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Quick Insights (Right Sidebar) */}
        <div className="space-y-8">
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white">
            <CardHeader className="p-6 border-b border-stone-100">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Database Engine</span>
                <span className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 rounded-full">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Member API</span>
                <span className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 rounded-full">99.9% Up</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Storefront</span>
                <span className="px-2 py-1 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 rounded-full">Active</span>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Regional Traffic</p>
                <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--brand-red)] w-3/4 rounded-full" />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-stone-400">Accra</span>
                  <span className="text-[10px] font-bold text-[var(--brand-red)]">Peak Flow</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-stone-200 shadow-sm bg-white">
            <CardHeader className="p-6 border-b border-stone-100">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">Engagement Pulse</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {sentimentStats.map((stat) => (
                <div key={stat.topic} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-stone-900">{stat.topic}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md", 
                          stat.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' : 
                          stat.sentiment === 'Neutral' ? 'bg-stone-50 text-stone-400' : 'bg-rose-50 text-rose-600'
                        )}>
                          {stat.sentiment}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                          {stat.trend === 'Up' ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> : <Activity className="w-2.5 h-2.5 text-rose-500" />}
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                    <span className="text-base font-bold text-stone-900">{stat.score}%</span>
                  </div>
                  <div className="h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${stat.score}%`,
                        backgroundColor: stat.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden relative group p-8">
            <Globe className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                <Zap className="w-4 h-4 text-[var(--brand-red)]" /> System Pulse
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold tracking-tight">99.8%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-red)] mt-2">Operational</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center border border-white/10 rounded-xl relative">
                  <div className="absolute inset-0 border border-[var(--brand-red)] animate-ping opacity-20 rounded-xl" />
                  <Activity className="w-6 h-6 text-white/40" />
                </div>
              </div>
              <div className="pt-6 border-t border-white/10">
                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4">Active Telemetry</p>
                <div className="flex gap-1.5 h-10 items-end">
                  {[40, 70, 45, 90, 65, 80, 50, 85, 30, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-[var(--brand-red)]/40 hover:bg-[var(--brand-red)] transition-all duration-500 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
