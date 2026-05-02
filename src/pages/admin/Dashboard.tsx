import { 
  Users, 
  MapPin, 
  Vote, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden group">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-black font-meta text-[var(--brand-black)]">{value}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <span className="text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              {change}
            </span>
            <span className="text-stone-400 uppercase tracking-tight ml-1">vs last month</span>
          </div>
        </div>
        <div className={cn(
          "w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110",
          color
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
)

import { cn } from '@/lib/utils'

export default function AdminDashboard() {
  const recentActivities = [
    { id: 1, type: 'registration', member: 'Kwame Mensah', region: 'Greater Accra', time: '2 mins ago', status: 'Approved' },
    { id: 2, type: 'chapter', title: 'New Chapter: Kumasi Central', region: 'Ashanti', time: '45 mins ago', status: 'Pending' },
    { id: 3, type: 'poll', title: 'Economic Policy Feedback', count: '1,240 votes', time: '2 hours ago', status: 'Active' },
    { id: 4, type: 'donation', amount: 'GHS 5,000', member: 'Abena Osei', time: '5 hours ago', status: 'Completed' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">System Overview</h1>
          <p className="text-stone-500 text-sm mt-1">Monitor the pulse of the movement in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 text-[10px] uppercase font-bold tracking-widest">
            Export Report
          </Button>
          <Button variant="primary" className="h-10 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            Manual Registration
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Members" 
          value="45,280" 
          change="+12.5%" 
          icon={Users} 
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard 
          title="Active Chapters" 
          value="124" 
          change="+3.2%" 
          icon={MapPin} 
          color="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="Poll Engagement" 
          value="89.4%" 
          change="+5.1%" 
          icon={Vote} 
          color="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Avg Impact" 
          value="7.8/10" 
          change="+0.4%" 
          icon={TrendingUp} 
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <Card className="lg:col-span-2 rounded-none border-stone-200 shadow-sm">
          <CardHeader className="border-b border-stone-100 bg-stone-50/50 p-6">
            <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--brand-red)]" />
              Live Feed Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/30">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Activity</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            activity.status === 'Approved' || activity.status === 'Completed' ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className="text-xs font-bold text-stone-900">{activity.type === 'registration' ? 'Member Join' : activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-stone-600 font-medium">{activity.member || activity.title}</span>
                        <p className="text-[10px] text-stone-400 mt-0.5">{activity.region || activity.count}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500 font-medium">
                        {activity.time}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-none border",
                          activity.status === 'Approved' || activity.status === 'Completed' 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {activity.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Health / Quick Stats */}
        <div className="space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-black font-meta uppercase tracking-widest">Platform Integrity</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-tight">Database Sync</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">Stable</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-tight">Pending Verifications</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600">14 Active</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full h-14 bg-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:opacity-90 text-white font-black font-meta uppercase tracking-widest rounded-none shadow-xl shadow-brand-red/20"
          >
            Generate Regional Audit
          </Button>
        </div>
      </div>
    </div>
  )
}
