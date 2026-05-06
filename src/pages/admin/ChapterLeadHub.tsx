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
import { Button } from '@/components/ui/neon-button'
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
        <Activity className="w-12 h-12 text-muted-foreground/20 animate-pulse" />
        <p className="text-[10px] font-bold normal-case text-muted-foreground/40">Synchronizing chapter hub...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Hub Header */}
      {/* 🏛️ Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-on-surface" />
            {chapterName} hub
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Empowering regional autonomy through tactical coordination.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-[10px] px-8 font-black uppercase tracking-[0.2em] hover:bg-stone-100 h-10 transition-all active:scale-95"
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Local Telemetry
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-[10px] uppercase tracking-[0.3em] px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> New Field Event
          </Button>
        </div>
      </div>

      {/* 📊 Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Mobilization strength', value: `${stats.mobilizationStrength}%`, icon: Activity, color: 'text-destructive', bg: 'bg-destructive/5' },
          { label: 'Active patriots', value: stats.activeMembers.toLocaleString(), icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Operations budget', value: `GH₵${stats.availableBudget.toLocaleString()}`, icon: DollarSign, color: 'text-accent', bg: 'bg-accent/5' },
          { label: 'Planned events', value: stats.totalEvents.toString(), icon: Calendar, color: 'text-on-surface/60', bg: 'bg-muted/5' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-sm border-border/60 shadow-sm group hover:border-on-surface transition-colors overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-bold normal-case text-muted-foreground/40 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black font-meta text-on-surface tracking-tighter">{stat.value}</h3>
                </div>
                <div className={cn("w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 rounded-lg", stat.bg)}>
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
            <h2 className="text-lg font-black normal-case tracking-tight font-meta flex items-center gap-2">
              <MapPin className="w-5 h-5 text-destructive" /> Upcoming field operations
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input type="text" placeholder="Filter events..." className="pl-9 pr-4 py-2 bg-muted/5 border-none text-[10px] font-bold normal-case rounded-lg focus:ring-1 focus:ring-on-surface w-48 shadow-inner" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.length > 0 ? events.map((event) => (
              <Card key={event.id} className="rounded-sm border-border/60 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                <div className="h-1.5 w-full bg-muted/5 relative overflow-hidden">
                  <div className={cn(
                    "h-full transition-all duration-1000",
                    event.status === 'Completed' ? "bg-primary" : 
                    event.status === 'In Progress' ? "bg-accent" : "bg-destructive"
                  )} style={{ width: `${(event.budget_spent / event.budget_allocated) * 100}%` }} />
                </div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-bold normal-case text-muted-foreground/40">{event.type}</span>
                    <div className={cn(
                      "px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full",
                      event.status === 'Completed' ? "bg-primary/10 text-primary border-primary/20" :
                      event.status === 'In Progress' ? "bg-accent/10 text-accent border-accent/20" :
                      "bg-muted/5 text-muted-foreground/60 border-border/10"
                    )}>
                      {event.status.toLowerCase()}
                    </div>
                  </div>
                  <CardTitle className="text-base font-black normal-case tracking-tight text-on-surface leading-tight group-hover:text-destructive transition-colors">
                    {event.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-4 space-y-4">
                  <div className="flex items-center gap-4 text-muted-foreground/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold normal-case">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold normal-case truncate max-w-[120px]">{event.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/10">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-muted/10 flex items-center justify-center text-[8px] font-black overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="attendee" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-on-surface flex items-center justify-center text-[8px] font-black text-white">
                        +{event.attendees_expected - 3}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="h-9 px-4 text-[9px] font-black uppercase tracking-widest hover:bg-muted/5 group-hover:text-destructive rounded-sm active:scale-95"
                    >
                      Logistics Hub <ChevronRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 border-2 border-dashed border-border/60 rounded-sm p-12 flex flex-col items-center justify-center text-muted-foreground/40 bg-muted/5">
                <Calendar className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-[10px] font-bold normal-case">No field operations scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* 💳 Mobilization Ledger */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden flex flex-col h-full relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <CardHeader className="p-8 border-b border-white/5 bg-white/5 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-sm font-bold normal-case flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-accent" /> Regional ledger
              </CardTitle>
              <Activity className="w-4 h-4 text-white/20" />
            </div>
            <CardDescription className="text-white/40 text-[10px] font-bold normal-case">Real-time mobilization expenditures.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] sidebar-scroll relative z-10">
            {ledger.length > 0 ? ledger.map((item, i) => (
              <div key={item.id} className={cn(
                "p-6 border-b border-white/5 hover:bg-white/5 transition-colors group",
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold normal-case text-accent opacity-70">{item.category}</p>
                    <p className="text-xs font-bold leading-tight">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black font-meta",
                      item.transaction_type === 'Allocation' ? "text-primary" : "text-destructive"
                    )}>
                      {item.transaction_type === 'Allocation' ? '+' : '-'} GH₵{item.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-bold text-white/30 normal-case">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-white/20">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-bold normal-case">Ledger manifest empty.</p>
              </div>
            )}
          </CardContent>
          <div className="p-8 mt-auto border-t border-white/5 bg-white/5 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[9px] font-bold normal-case text-white/40">Total allocation</span>
              <span className="text-lg font-black font-meta text-primary">GH₵{ledger.filter(l => l.transaction_type === 'Allocation').reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
            </div>
            <Button 
              variant="outline" 
              className="w-full h-12 border-white/20 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 rounded-sm transition-all active:scale-95"
            >
              Request Additional Funds
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
