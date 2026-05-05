import { 
  Users, 
  MapPin, 
  ShoppingBag, 
  Activity,
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

// Operational Skeleton Component
function SkeletonCard() {
  return (
    <Card className="rounded-lg border-stone-200 shadow-none overflow-hidden bg-white">
      <CardContent className="p-5 space-y-3">
        <div className="w-1/4 h-2 bg-stone-100 animate-pulse rounded-full" />
        <div className="w-1/2 h-6 bg-stone-50 animate-pulse rounded-md" />
      </CardContent>
    </Card>
  )
}

// Operational Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="rounded-lg border-stone-200 shadow-sm transition-all overflow-hidden bg-white">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-stone-900 tabular-nums">{value}</h3>
              <span className={cn(
                "text-[10px] font-bold flex items-center gap-0.5",
                change.startsWith('+') ? "text-emerald-600" : "text-stone-400"
              )}>
                {change}
              </span>
            </div>
          </div>
          <div className={cn("w-8 h-8 flex items-center justify-center rounded-lg bg-stone-50", color.replace('bg-', 'text-'))}>
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
      title: "Generating export",
      description: "Aggregating regional data into CSV format...",
    })
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Trigger dummy download
    const dummyData = "Date,Category,Value\n" + 
      new Date().toISOString() + ",Members," + (globalStats[0]?.value || "0") + "\n" +
      new Date().toISOString() + ",Chapters," + (globalStats[1]?.value || "0") + "\n";
    
    const blob = new Blob([dummyData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `the_base_export_${new Date().getTime()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setIsExporting(false)
    toast({
      title: "Export complete",
      description: "The CSV file has been generated and downloaded successfully.",
    })
  }


  const handlePlatformLogs = () => {
    navigate('/admin/settings?tab=audit')
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Top Header - Operational */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-stone-400 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              16 regions tracked
            </p>
            <p className="text-stone-400 text-xs font-medium">Updated 2m ago</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="h-8 px-3 text-xs font-semibold text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900 transition-all rounded-md"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export data'}
          </Button>

          <Button 
            className="h-8 px-3 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all rounded-md"
            onClick={handlePlatformLogs}
          >
            View logs
          </Button>

        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Members" value={globalStats[0]?.value || "0"} change={globalStats[0]?.change || "0%"} icon={Users} color="bg-[var(--brand-red)]" />
            <StatCard title="Chapters" value={globalStats[1]?.value || "0"} change={globalStats[1]?.change || "0%"} icon={MapPin} color="bg-[var(--brand-gold)]" />
            <StatCard title="Activity" value={globalStats[2]?.value || "0"} change={globalStats[2]?.change || "0%"} icon={Activity} color="bg-stone-900" />
            <StatCard title="Inventory" value={globalStats[3]?.value || "0"} change={globalStats[3]?.change || "0%"} icon={ShoppingBag} color="bg-emerald-600" />
          </>
        )}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
        <div className="xl:col-span-2 space-y-10">
          
          {/* Membership Growth Trend */}
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/20">
              <div>
                <CardTitle className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  Membership Growth
                </CardTitle>
                <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Rolling 30-day expansion trend</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select className="h-7 px-2 bg-white border border-stone-200 text-[10px] font-bold text-stone-600 rounded-md outline-none">
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
                      <stop offset="5%" stopColor="#ce1126" stopOpacity={0.08}/>
                      <stop offset="95%" stopColor="#ce1126" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f5f5f4" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#a8a29e' }}
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#a8a29e' }}
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
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ce1126" 
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
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-stone-900">Regional Distribution</CardTitle>
                <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Top performing regions by member count</CardDescription>
              </div>
              <Button variant="ghost" className="h-7 px-2 text-[10px] font-bold text-stone-400 hover:text-stone-900">
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-100">
                    <th className="p-4 pl-6 text-[10px] font-bold uppercase tracking-wider text-stone-400">Region</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Members</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">Chapters</th>
                    <th className="p-4 pr-6 text-right text-[10px] font-bold uppercase tracking-wider text-stone-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {regionalStats.filter(r => r.memberCount > 0).length > 0 ? (
                    regionalStats.filter(r => r.memberCount > 0).slice(0, 5).map((region) => (
                      <tr key={region.region} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: region.color }} />
                            <span className="text-xs font-semibold text-stone-900">{region.region}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-medium text-stone-600 tabular-nums">{region.memberCount.toLocaleString()}</td>
                        <td className="p-4 text-xs font-medium text-stone-600 tabular-nums">{region.chapters}</td>
                        <td className="p-4 pr-6 text-right">
                          <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase rounded-full", 
                            region.performance === 'High' ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-500"
                          )}>
                            {region.performance}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-stone-400 text-xs font-medium italic">
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
            <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/20">
                <CardTitle className="text-sm font-bold text-stone-900">System Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-stone-50">
                    {auditLogs.length > 0 ? (
                      auditLogs.slice(0, 6).map((log) => (
                        <tr key={log.id} className="text-[11px] hover:bg-stone-50 transition-colors">
                          <td className="p-4 pl-6 text-stone-400 font-medium whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-stone-900">{log.adminName.split(' ')[0]}</span>
                            <span className="text-stone-500 ml-1.5">{log.action.toLowerCase()}</span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <div className={cn("w-1.5 h-1.5 rounded-full inline-block", 
                              log.status === 'Success' ? "bg-emerald-500" : "bg-amber-500"
                            )} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-12 text-center text-stone-400 text-xs font-medium italic">
                          No recent system activity.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="p-4 border-t border-stone-50 text-center">
                  <Button variant="ghost" onClick={handlePlatformLogs} className="h-7 text-[10px] font-bold text-stone-400 hover:text-stone-900">
                    View full activity log
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logistics Performance */}
            <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-stone-900">Logistics Performance</CardTitle>
                <ShoppingBag className="w-4 h-4 text-stone-300" />
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {logisticsData.length > 0 ? (
                  logisticsData.slice(0, 3).map((item) => (
                    <div key={item.region} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">{item.region}</p>
                        <p className="text-xs font-bold text-stone-900 tabular-nums">{item.avgDispatchToDeliveryDays}d <span className="text-[10px] font-medium text-stone-400 ml-1">avg</span></p>
                      </div>
                      <div className="h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-900 rounded-full" style={{ width: `${Math.min(100, (3 / item.avgDispatchToDeliveryDays) * 100)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-stone-400 text-xs font-medium italic">
                    Logistics data unavailable.
                  </div>
                )}
                <div className="pt-4">
                   <div className="bg-stone-50 rounded-lg p-4 flex justify-between items-center border border-stone-100/50">
                     <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Overall Velocity</p>
                     <p className="text-sm font-bold text-stone-900 tracking-tight">3.2 Days</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Operational Health (Right Sidebar) */}
        <div className="space-y-10">
          {/* Health & Status Consolidated */}
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/20">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Operations Health</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* System Health */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-600">Infrastructure</span>
                  <span className="text-emerald-600 font-bold">Optimal</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-600">Database Engine</span>
                  <span className="text-emerald-600 font-bold">Stable</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-600">Regional Sync</span>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>
              </div>

              <div className="h-px bg-stone-100" />

              {/* Engagement Pulse (Simplified) */}
              <div className="space-y-6">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sentiment Pulse</p>
                {sentimentStats.length > 0 && sentimentStats.some(s => s.score > 0) ? (
                  sentimentStats.slice(0, 3).map((stat) => (
                    <div key={stat.topic} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <p className="text-[11px] font-bold text-stone-900">{stat.topic}</p>
                        <span className="text-xs font-bold tabular-nums">{stat.score}%</span>
                      </div>
                      <div className="h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                        <div className="h-full bg-stone-900 opacity-20 rounded-full" style={{ width: `${stat.score}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-stone-400 text-[10px] font-medium italic py-4">
                    No recent sentiment data.
                  </div>
                )}
              </div>

              <div className="h-px bg-stone-100" />

              {/* Quick Status Bar */}
              <div className="bg-stone-900 rounded-xl p-6 text-white relative overflow-hidden group shadow-lg">
                <Globe className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Core System</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums tracking-tighter">99.8%</span>
                    <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Uptime</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regional Traffic Summary */}
          <Card className="rounded-xl border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/20">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Regional Traffic</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center text-[10px] font-bold text-stone-900 border border-stone-100">GA</div>
                     <div>
                       <p className="text-xs font-bold text-stone-900">Greater Accra</p>
                       <p className="text-[10px] text-stone-400 font-medium">Peak flow detected</p>
                     </div>
                   </div>
                   <Activity className="w-4 h-4 text-[var(--brand-red)]" />
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center text-[10px] font-bold text-stone-900 border border-stone-100">AS</div>
                     <div>
                       <p className="text-xs font-bold text-stone-900">Ashanti</p>
                       <p className="text-[10px] text-stone-400 font-medium">Normal operations</p>
                     </div>
                   </div>
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}

