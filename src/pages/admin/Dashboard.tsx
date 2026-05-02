import React from 'react'
import { 
  Users, 
  MapPin, 
  BarChart3, 
  ShoppingBag, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2
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
        {/* Live Activity Feed */}
        <Card className="xl:col-span-2 rounded-none border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--brand-red)]" />
                Live Operations Feed
              </CardTitle>
              <CardDescription className="text-xs mt-1">Real-time administrative and movement activity.</CardDescription>
            </div>
            <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-stone-400">
              Refresh Feed
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-50">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-6 flex items-start gap-5 hover:bg-stone-50/50 transition-colors group">
                  <div className={cn("w-10 h-10 shrink-0 flex items-center justify-center bg-stone-50", log.color.replace('text-', 'bg-').replace('500', '100'))}>
                    <log.icon className={cn("w-5 h-5", log.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black text-[var(--brand-black)] uppercase tracking-tight truncate">{log.details}</p>
                      <span className="text-[10px] font-bold text-stone-400 whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {log.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Source:</span>
                      <span className="text-[10px] font-black text-stone-600 uppercase tracking-tight">{log.user}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-stone-300 opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-stone-50 bg-stone-50/20">
              <Button variant="outline" className="w-full h-12 rounded-none border-stone-200 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--brand-black)] hover:text-white transition-all">
                View Full System Audit Trail
              </Button>
            </div>
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

          <Card className="rounded-none border-stone-900 bg-[var(--brand-black)] text-white p-8 relative overflow-hidden group">
            <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform duration-500" />
            <div className="relative z-10 space-y-4">
              <h4 className="text-lg font-black font-meta uppercase tracking-tighter">Security Protocol</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Platform encryption is active. All administrative actions are recorded for the National HQ audit trail.
              </p>
              <Button variant="outline" className="h-10 text-[10px] uppercase font-bold tracking-widest border-white/20 text-white hover:bg-white/10">
                Review Permissions
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
