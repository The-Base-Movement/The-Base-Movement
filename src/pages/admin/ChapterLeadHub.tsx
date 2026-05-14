import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { FieldEvent, MobilizationLedger } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

export default function ChapterLeadHub() {
  const [events, setEvents] = useState<FieldEvent[]>([])
  const [ledger, setLedger] = useState<MobilizationLedger[]>([])
  const [loading, setLoading] = useState(true)
  const [chapterName, setChapterName] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const user = adminService.getCurrentUser()
        const chapter = user?.chapter || 'Greater Accra Central'
        setChapterName(chapter)

        const [eventsData, ledgerData] = await Promise.all([
          adminService.getFieldEvents(chapter),
          adminService.getChapterMobilizationLedger(chapter)
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
    activeMembers: 1240,
    availableBudget: ledger.reduce((acc, curr) => 
      curr.transaction_type === 'Allocation' ? acc + curr.amount : acc - curr.amount, 0
    ),
    mobilizationStrength: 88
  }

  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 40, animation: 'spin 1.5s linear infinite' }}>sync</span>
        <p style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--on-surface-muted))' }}>Synchronizing chapter hub...</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Hub Header */}
      <div className="flex-columns items-center">
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>location_on</span>
            {chapterName} hub
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Empowering regional autonomy through tactical coordination.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" style={{ height: 40, padding: '0 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bar_chart</span> Operational metrics
          </button>
          <button className="btn btn-primary" style={{ height: 40, padding: '0 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> New Field Event
          </button>
        </div>
      </div>

      {/* 📊 Intelligence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[18px]">
        <TacticalKPI 
          label="Mobilization Strength"
          value={`${stats.mobilizationStrength}%`}
          variant="red"
          description="Tactical efficiency score for regional deployment"
          delta="▲ Strong"
        />
        <TacticalKPI 
          label="Active Patriots"
          value={stats.activeMembers.toLocaleString()}
          variant="black"
          description="Verified citizens currently active in this chapter"
          delta="+4 today"
        />
        <TacticalKPI 
          label="Operations Budget"
          value={`GH₵${stats.availableBudget.toLocaleString()}`}
          variant="gold"
          description="Available liquidity for regional field operations"
          delta="Stable"
        />
        <TacticalKPI 
          label="Planned Events"
          value={stats.totalEvents.toString()}
          variant="green"
          description="Upcoming tactical field operations and rallies"
          delta="Upcoming"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📅 Field Operations (Events) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <span className="material-symbols-outlined text-destructive" style={{ fontSize: 20 }}>location_on</span> Upcoming field operations
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', opacity: 0.4 }}>search</span>
                <input type="text" placeholder="Filter events..." style={{ width: 200, height: 36, paddingLeft: 36, paddingRight: 12, background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 12, fontWeight: 700, outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {events.length > 0 ? events.map((event) => (
              <div key={event.id} className="panel" style={{ overflow: 'hidden' }}>
                <div className="h-1.5 w-full bg-muted/5 relative overflow-hidden">
                  <div className={cn(
                    "h-full transition-all duration-1000",
                    event.status === 'Completed' ? "bg-primary" : 
                    event.status === 'In Progress' ? "bg-accent" : "bg-destructive"
                  )} style={{ width: `${(event.budget_spent / event.budget_allocated) * 100}%` }} />
                </div>
                <div style={{ padding: 24, paddingBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))' }}>{event.type}</span>
                    <span className={cn("pill", 
                      event.status === 'Completed' ? "pill-ok" : 
                      event.status === 'In Progress' ? "pill-warn" : ""
                    )} style={{ fontSize: 8 }}>
                      {event.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0 }}>{event.title}</h3>
                </div>
                <div style={{ padding: 24, paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'hsl(var(--on-surface-muted))', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_today</span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                      <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{event.location}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid hsl(var(--border))', opacity: 0.2 }}>
                    <div style={{ display: 'flex', marginLeft: 8 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', background: 'hsl(var(--container-low))', marginLeft: -8, overflow: 'hidden' }}>
                          <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="attendee" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', background: 'hsl(var(--on-surface))', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>
                        +{event.attendees_expected - 3}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '0 12px' }}>
                      Logistics Hub <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ gridColumn: 'span 2', padding: 48, border: '2px dashed hsl(var(--border))', borderRadius: 4, textAlign: 'center', background: 'hsl(var(--container-low))', opacity: 0.5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', marginBottom: 16 }}>calendar_today</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>No field operations scheduled.</p>
              </div>
            )}
          </div>
        </div>

        {/* 💳 Mobilization Ledger */}
        <div className="panel" style={{ background: 'hsl(var(--on-surface))', color: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <span className="material-symbols-outlined text-accent" style={{ fontSize: 20 }}>payments</span> Regional ledger
              </h3>
              <span className="material-symbols-outlined" style={{ fontSize: 20, opacity: 0.3 }}>activity</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Real-time mobilization expenditures.</p>
          </div>
          <div style={{ padding: 0, flex: 1, overflowY: 'auto', maxHeight: 600 }}>
            {ledger.length > 0 ? ledger.map((item, i) => (
              <div key={item.id} className={cn(
                "p-6 border-b border-white/5 hover:bg-white/5 transition-colors group",
                i % 2 === 0 ? "bg-white/[0.02]" : ""
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <p className="text-micro font-bold normal-case text-accent opacity-70">{item.category}</p>
                    <p className="text-xs font-bold leading-tight">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold font-meta",
                      item.transaction_type === 'Allocation' ? "text-primary" : "text-destructive"
                    )}>
                      {item.transaction_type === 'Allocation' ? '+' : '-'} GH₵{item.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] font-bold text-white/30 normal-case">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: 48, textAlign: 'center', opacity: 0.2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>trending_up</span>
                <p style={{ fontSize: 12, fontWeight: 700 }}>Ledger manifest empty.</p>
              </div>
            )}
          </div>
          <div style={{ padding: 32, borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Total allocation</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'hsl(var(--primary))' }}>GH₵{ledger.filter(l => l.transaction_type === 'Allocation').reduce((a, b) => a + b.amount, 0).toLocaleString()}</span>
            </div>
            <button className="btn btn-outline" style={{ width: '100%', height: 48, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              Request Additional Funds
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
