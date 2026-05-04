import { useState, useEffect } from 'react'
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Plus, 
  TrendingUp, 
  Activity, 
  ChevronRight,
  Clock,
  BarChart3,
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { FieldEvent, MobilizationLedger } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ChapterLeadHub() {
  const [events, setEvents] = useState<FieldEvent[]>([])
  const [ledger, setLedger] = useState<MobilizationLedger[]>([])
  const [loading, setLoading] = useState(true)
  const [chapterName, setChapterName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // In a real scenario, we'd get the chapter from the user's admin profile
        const user = adminService.getCurrentUser()
        const chapter = user?.chapter || 'Greater Accra Central'
        setChapterName(chapter)

        const [eventsData, ledgerData] = await Promise.all([
          adminService.getFieldEvents(chapter),
          adminService.getMobilizationLedger(chapter)
        ])
        setEvents(eventsData)
        setLedger(ledgerData)
      } catch (err) {
        console.error('Failed to load hub data:', err)
        toast.error('Failed to load regional hub data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats = {
    totalEvents: events.length,
    activeMembers: 1240, // Mocked for now
    availableBudget: ledger.reduce((acc, curr) => 
      curr.transaction_type === 'Allocation' ? acc + curr.amount : acc - curr.amount, 0
    ),
    mobilizationStrength: 88 // Percentage
  }

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20 space-y-4">
        <Activity className="w-12 h-12 text-stone-200 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Synchronizing Chapter Hub...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Hub Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[var(--brand-red)] rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Chapter Command Center</span>
          </div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">
            {chapterName} <span className="text-stone-300">Hub</span>
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-medium italic">Empowering regional autonomy through tactical coordination.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-none border-stone-200 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all">
            <BarChart3 className="w-4 h-4 mr-2" /> Local Telemetry
          </Button>
          <Button variant="primary" className="h-12 px-6 rounded-none bg-[var(--brand-black)] text-white font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 mr-2" /> New Field Event
          </Button>
        </div>
      </div>

      {/* 📊 Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Mobilization Strength', value: `${stats.mobilizationStrength}%`, icon: Activity, color: 'text-[var(--brand-red)]', bg: 'bg-red-50' },
          { label: 'Active Patriots', value: stats.activeMembers.toLocaleString(), icon: Users, color: 'text-[var(--brand-green)]', bg: 'bg-emerald-50' },
          { label: 'Operations Budget', value: `GH₵${stats.availableBudget.toLocaleString()}`, icon: DollarSign, color: 'text-[var(--brand-gold)]', bg: 'bg-amber-50' },
          { label: 'Planned Events', value: stats.totalEvents.toString(), icon: Calendar, color: 'text-stone-600', bg: 'bg-stone-100' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-none border-stone-200 shadow-sm group hover:border-[var(--brand-black)] transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black font-meta text-[var(--brand-black)] tracking-tighter">{stat.value}</h3>
                </div>
                <div className={cn("w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📅 Field Operations (Events) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight font-meta flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--brand-red)]" /> Upcoming Field Operations
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input type="text" placeholder="Filter events..." className="pl-9 pr-4 py-2 bg-stone-100 border-none text-[10px] font-bold uppercase tracking-widest focus:ring-1 focus:ring-black w-48" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.length > 0 ? events.map((event) => (
              <Card key={event.id} className="rounded-none border-stone-200 shadow-sm overflow-hidden group">
                <div className="h-1.5 w-full bg-stone-100 relative overflow-hidden">
                  <div className={cn(
                    "h-full transition-all duration-1000",
                    event.status === 'Completed' ? "bg-[var(--brand-green)]" : 
                    event.status === 'In Progress' ? "bg-[var(--brand-gold)]" : "bg-[var(--brand-red)]"
                  )} style={{ width: `${(event.budget_spent / event.budget_allocated) * 100}%` }} />
                </div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{event.type}</span>
                    <div className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                      event.status === 'Completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      event.status === 'In Progress' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-stone-50 text-stone-500 border-stone-100"
                    )}>
                      {event.status}
                    </div>
                  </div>
                  <CardTitle className="text-base font-black uppercase tracking-tight text-[var(--brand-black)] leading-tight group-hover:text-[var(--brand-red)] transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-4 space-y-4">
                  <div className="flex items-center gap-4 text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase truncate max-w-[120px]">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-stone-200 flex items-center justify-center text-[8px] font-black overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="attendee" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-[var(--brand-black)] flex items-center justify-center text-[8px] font-black text-white">
                        +{event.attendees_expected - 3}
                      </div>
                    </div>
                    <Button variant="ghost" className="h-8 text-[8px] font-black uppercase tracking-widest hover:bg-stone-50 group-hover:text-[var(--brand-red)]">
                      Logistics Hub <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 border-2 border-dashed border-stone-200 p-12 flex flex-col items-center justify-center text-stone-400">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No field operations scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* 💳 Mobilization Ledger */}
        <Card className="rounded-none border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden flex flex-col h-full">
          <CardHeader className="p-8 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--brand-gold)]" /> Regional Ledger
              </CardTitle>
              <Activity className="w-4 h-4 text-white/20" />
            </div>
            <CardDescription className="text-white/40 text-[10px] font-bold uppercase tracking-tight">Real-time mobilization expenditures.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
            {ledger.length > 0 ? ledger.map((item, i) => (
              <div key={item.id} className={cn(
                "p-6 border-b border-white/5 hover:bg-white/5 transition-colors group",
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[var(--brand-gold)] opacity-70">{item.category}</p>
                    <p className="text-xs font-bold leading-tight">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black font-meta",
                      item.transaction_type === 'Allocation' ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
                    )}>
                      {item.transaction_type === 'Allocation' ? '+' : '-'} GH₵{item.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-tighter">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-white/20">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Ledger manifest empty.</p>
              </div>
            )}
          </CardContent>
          <div className="p-8 mt-auto border-t border-white/5 bg-white/5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Total Allocation</span>
              <span className="text-lg font-black font-meta text-[var(--brand-green)]">GH₵{ledger.filter(l => l.transaction_type === 'Allocation').reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
            </div>
            <Button variant="outline" className="w-full h-11 border-white/10 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/10 rounded-none transition-all">
              Request Additional Funds
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
