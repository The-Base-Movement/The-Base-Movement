import { 
  Users, 
  MapPin, 
  BarChart3, 
  ShoppingBag, 
  Activity,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe,
  ChevronRight
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
import type { GrowthTrend, SentimentStat, AuditLogEntry, RegionalStat } from '@/services/adminService'
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
    <Card className="rounded-none border-stone-100 shadow-none overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-stone-100" />
      <CardContent className="p-6 space-y-4">
        <div className="w-1/3 h-2 bg-stone-100 animate-pulse" />
        <div className="w-2/3 h-8 bg-stone-100 animate-pulse" />
        <div className="w-1/2 h-3 bg-stone-100 animate-pulse" />
      </CardContent>
    </Card>
  )
}

// High-Fidelity Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="rounded-none border-stone-200 shadow-sm group hover:shadow-md transition-all overflow-hidden relative">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">{value}</h3>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5">
                <TrendingUp className="w-3 h-3" /> {change}
              </span>
              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-tight">vs last week</span>
            </div>
          </div>
          <div className={cn("w-12 h-12 flex items-center justify-center bg-stone-50 text-stone-400 group-hover:scale-110 transition-transform", color.replace('bg-', 'text-').replace('-600', '-500'))}>
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [growth, sentiment, audit, regions] = await Promise.all([
        adminService.getGrowthTrends(),
        adminService.getSentimentAnalysis(),
        adminService.getSystemAuditLogs(),
        adminService.getRegionalStats()
      ])
      setGrowthData(growth)
      setSentimentStats(sentiment)
      setAuditLogs(audit)
      setRegionalStats(regions)
      setIsLoading(false)
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
    setTimeout(() => {
      setIsExporting(false)
      toast({
        title: "EXPORT COMPLETE",
        description: "Intelligence vault updated. File ready for regional HQ.",
        variant: "default",
      })
    }, 2000)
  }

  const handlePlatformLogs = () => {
    toast({
      title: "ACCESSING AUDIT VAULT",
      description: "Decrypting high-security system activity logs...",
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">Command Center</h1>
          <p className="text-stone-500 text-sm mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live movement operations monitoring active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-12 px-6 text-[10px] uppercase font-bold tracking-widest border-stone-200"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'GENERATING...' : 'Export Intelligence'}
          </Button>
          <Button 
            className="h-12 px-6 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800"
            onClick={handlePlatformLogs}
          >
            Platform Logs
          </Button>
        </div>
      </div>

      {/* Advanced Filtering & Intelligence Hub */}
      <div className="bg-white border border-stone-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search regional telemetry..." 
            className="w-full h-10 pl-10 pr-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-tight placeholder:text-stone-400 focus:ring-1 focus:ring-[var(--brand-gold)] transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <select className="h-10 px-4 bg-stone-50 border-none text-[10px] font-black uppercase tracking-widest text-stone-600 focus:ring-1 focus:ring-[var(--brand-gold)] cursor-pointer">
            <option>All Regions</option>
            <option>Greater Accra</option>
            <option>Ashanti</option>
            <option>Western</option>
            <option>Central</option>
          </select>
          <select className="h-10 px-4 bg-stone-50 border-none text-[10px] font-black uppercase tracking-widest text-stone-600 focus:ring-1 focus:ring-[var(--brand-gold)] cursor-pointer">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Quarter</option>
          </select>
          <Button variant="ghost" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-[var(--brand-red)] hover:bg-rose-50">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard title="Total Membership" value="452,890" change="+12.4%" icon={Users} color="bg-[var(--brand-green)]" />
            <StatCard title="Regional Chapters" value="124" change="+4.2%" icon={MapPin} color="bg-[var(--brand-red)]" />
            <StatCard title="Member Engagement" value="88.4%" change="+2.1%" icon={Activity} color="bg-[var(--brand-gold)]" />
            <StatCard title="Merch Orders" value="1,245" change="+15.8%" icon={ShoppingBag} color="bg-stone-800" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Main Intelligence Hub (Left/Middle Column) */}
        <div className="xl:col-span-2 space-y-8">
          {/* Growth Intelligence Visualization */}
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--brand-gold)]" />
                  Growth Intelligence
                </CardTitle>
                <CardDescription className="text-xs mt-1">Real-time member expansion telemetry across all regions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#a8a29e' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#a8a29e' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--brand-black)', 
                      border: 'none', 
                      borderRadius: '0', 
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="var(--brand-red)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorGrowth)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              </CardContent>
          </Card>

          {/* Regional Impact Intelligence Hub */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {regionalStats.slice(0, 4).map((region) => (
              <Card key={region.region} className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white group hover:border-[var(--brand-gold)] transition-all">
                <CardHeader className="p-6 pb-4 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 group-hover:text-[var(--brand-gold)] transition-colors" />
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-stone-900">{region.region}</CardTitle>
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border", 
                    region.performance === 'High' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    region.performance === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  )}>
                    {region.performance} IMPACT
                  </span>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-black font-meta text-stone-900 leading-none">{region.memberCount.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Total Members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-stone-600">{region.chapters}</p>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Chapters</p>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-stone-50 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${(region.memberCount / 200000) * 100}%`,
                        backgroundColor: region.color 
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Audit Intelligence Hub */}
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--brand-red)]" />
                  System Audit Intelligence
                </CardTitle>
                <CardDescription className="text-xs mt-1">High-fidelity tracking of all administrative operations.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Live Audit Feed</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Timestamp</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Administrator</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Action</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Resource</th>
                      <th className="p-4 text-[9px] font-black uppercase tracking-widest text-stone-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="p-4">
                          <p className="text-[10px] font-bold text-stone-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-none bg-stone-100 flex items-center justify-center text-[8px] font-black">HQ</div>
                            <span className="text-[10px] font-black text-stone-900 uppercase tracking-tight">{log.adminName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-bold text-[var(--brand-black)] uppercase tracking-tight">{log.action}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{log.resource}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border", 
                            log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            log.status === 'Warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
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
                <Button variant="outline" className="w-full h-12 rounded-none border-stone-200 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--brand-black)] hover:text-white transition-all">
                  Access Full Movement Audit Vault
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Quick Insights (Right Sidebar) */}
        <div className="space-y-8">
          <Card className="rounded-none border-stone-200 shadow-sm">
            <CardHeader className="p-6 border-b border-stone-100">
              <CardTitle className="text-xs font-black font-meta uppercase tracking-widest text-stone-400">System Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Database Engine</span>
                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Member API</span>
                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">99.9% Uptime</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600">Merch Storefront</span>
                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Active</span>
              </div>
              <div className="pt-4 border-t border-stone-50">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Regional Traffic Heat</p>
                <div className="h-2 w-full bg-stone-100 rounded-none overflow-hidden">
                  <div className="h-full bg-[var(--brand-red)] w-3/4" />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] font-bold text-stone-400 uppercase">G. Accra</span>
                  <span className="text-[9px] font-bold text-[var(--brand-red)] uppercase">Peak</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100">
              <CardTitle className="text-xs font-black font-meta uppercase tracking-widest text-stone-400">Engagement Pulse</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {sentimentStats.map((stat) => (
                <div key={stat.topic} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-stone-900 uppercase tracking-tight">{stat.topic}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5", 
                          stat.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' : 
                          stat.sentiment === 'Neutral' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        )}>
                          {stat.sentiment}
                        </span>
                        <span className="text-[8px] font-bold text-stone-400 uppercase flex items-center gap-0.5">
                          {stat.trend === 'Up' ? <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> : <Activity className="w-2.5 h-2.5 text-rose-500 rotate-180" />}
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-black font-meta text-stone-900">{stat.score}%</span>
                  </div>
                  <div className="h-1 w-full bg-stone-50 overflow-hidden">
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
              <div className="pt-2">
                <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-black)] transition-colors">
                  Detailed Sentiment Audit <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-black)] text-white overflow-hidden relative group">
            <Globe className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5 group-hover:scale-110 transition-transform duration-1000" />
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-[var(--brand-red)]" /> System Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black font-meta tracking-tighter">99.8%</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--brand-red)] mt-1">Operational Capacity</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center border border-white/10 relative">
                  <div className="absolute inset-0 border border-[var(--brand-red)] animate-ping opacity-20" />
                  <Activity className="w-5 h-5 text-white/40" />
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Active Data Streams</p>
                <div className="mt-4 flex gap-1 h-8 items-end">
                  {[40, 70, 45, 90, 65, 80, 50, 85, 30, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-[var(--brand-red)] opacity-50 hover:opacity-100 transition-all duration-500" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
