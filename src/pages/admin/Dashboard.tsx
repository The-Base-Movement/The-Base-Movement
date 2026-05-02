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
import type { GrowthTrend } from '@/services/adminService'
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

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: LucideIcon
  color: string
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

  useEffect(() => {
    const fetchData = async () => {
      const data = await adminService.getGrowthTrends()
      setGrowthData(data)
    }
    fetchData()
  }, [])

  const activityLogs = [
    { id: 1, type: 'registration', user: 'Kwesi Appiah', time: '12 mins ago', details: 'New member verified in Western Region', icon: ShieldCheck, color: 'text-emerald-500' },
    { id: 2, type: 'chapter', user: 'Ashanti HQ', time: '45 mins ago', details: 'Established new constituency cell in Bantama', icon: MapPin, color: 'text-[var(--brand-red)]' },
    { id: 3, type: 'poll', user: 'National HQ', time: '1 hour ago', details: 'Poll "Economic Policy Feedback" reached 10k votes', icon: BarChart3, color: 'text-[var(--brand-gold)]' },
    { id: 4, type: 'store', user: 'Logistics', time: '3 hours ago', details: 'Stock alert: Official Tee (Low Inventory)', icon: ShoppingBag, color: 'text-amber-500' },
    { id: 5, type: 'security', user: 'System', time: '5 hours ago', details: 'Successful backup of member encrypted database', icon: CheckCircle2, color: 'text-blue-500' },
  ]

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
          <Button variant="outline" className="h-12 px-6 text-[10px] uppercase font-bold tracking-widest border-stone-200">
            Export Intelligence
          </Button>
          <Button variant="primary" className="h-12 px-6 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            Platform Logs
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Membership" value="452,890" change="+12.4%" icon={Users} color="bg-[var(--brand-green)]" />
        <StatCard title="Regional Chapters" value="124" change="+4.2%" icon={MapPin} color="bg-[var(--brand-red)]" />
        <StatCard title="Member Engagement" value="88.4%" change="+2.1%" icon={Activity} color="bg-[var(--brand-gold)]" />
        <StatCard title="Merch Orders" value="1,245" change="+15.8%" icon={ShoppingBag} color="bg-stone-800" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Growth Intelligence Visualization */}
        <Card className="xl:col-span-2 rounded-none border-stone-200 shadow-sm overflow-hidden">
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

        {/* Status / Quick Insights */}
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
