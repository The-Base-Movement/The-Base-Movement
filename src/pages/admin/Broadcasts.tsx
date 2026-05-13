import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Broadcast } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { BrandLine } from '@/components/admin/BrandLine'
import { 
  Megaphone, 
  Plus, 
  Search, 
  Hourglass, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle,
  BarChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'

export default function Broadcasts() {
  const navigate = useNavigate()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcastMetrics, setBroadcastMetrics] = useState<Record<string, { total: number; read: number }>>({})

  const fetchMetrics = useCallback(async (id: string) => {
    try {
      const stats = await adminService.getBroadcastMetrics(id)
      setBroadcastMetrics(prev => ({ ...prev, [id]: stats }))
    } catch {
      // fail silently
    }
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const bData = await adminService.getBroadcasts()
      setBroadcasts(bData)
      bData.slice(0, 5).forEach(b => fetchMetrics(b.id))
    } catch {
      toast.error('Failed to load broadcast history.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchMetrics])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredBroadcasts = broadcasts.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const priorityPill = (p: string) => {
    if (p === 'Urgent') return 'bg-destructive/10 text-destructive border-destructive/20'
    if (p === 'High') return 'bg-accent/10 text-accent border-accent/20'
    return 'bg-muted/10 text-muted-foreground/60 border-border/20'
  }

  const targetLabel = (type: string, value?: string) =>
    type === 'ALL' ? 'National' : value ?? type

  const templates = [
    { title: 'National Membership Drive', type: 'ALL', priority: 'High', content: 'All chapters are invited to initiate regional registration drives this weekend. Goal: 10,000 new verified members.' },
    { title: 'Regional Strategic Briefing', type: 'REGION', priority: 'Normal', content: 'Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT.' },
    { title: 'Level Red Emergency Alert', type: 'ALL', priority: 'Urgent', content: 'IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates.' },
    { title: 'Constituency Outreach', type: 'CONSTITUENCY', priority: 'Normal', content: 'Local chapter engagement initiative starting in your area. Please coordinate with regional leads.' },
  ]

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Communication Header */}
      <div className="flex-columns items-center flex-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 m-0">
            <Megaphone className="w-8 h-8 text-on-surface" />
            Communication hub
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-2 mb-0">Platform-wide transmission and regional mobilization protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
            onClick={() => navigate('/admin/broadcasts/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Broadcast
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <TacticalKPI 
          label="Communication"
          value={isLoading ? '—' : broadcasts.length}
          description="Total deployments"
          trend={{ direction: 'neutral', value: 'Vault' }}
        />
        <TacticalKPI 
          label="Priority"
          value={isLoading ? '—' : broadcasts.filter(b => b.priority === 'Urgent').length}
          description="Urgent alerts"
          trend={{ direction: 'down', value: 'Critical' }}
        />
        <TacticalKPI 
          label="Saturation"
          value="100%"
          description="Member reach"
          trend={{ direction: 'up', value: 'Pulse' }}
        />
        <TacticalKPI 
          label="HQ Connection"
          value="24/7"
          description="Direct uplink"
          trend={{ direction: 'up', value: 'Online' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📡 Broadcast History */}
        <div className="xl:col-span-2">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Broadcast history</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">HQ-to-field transmission log</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search broadcasts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 h-10 pl-10 pr-4 bg-white border border-border/40 rounded-sm text-xs font-bold text-on-surface focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="px-6 py-20 text-center space-y-4">
                  <Hourglass className="w-12 h-12 text-muted-foreground/10 animate-pulse" />
                  <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">Retrieving comm logs...</p>
                </div>
              ) : filteredBroadcasts.length === 0 ? (
                <div className="px-6 py-20 text-center space-y-4">
                  <Megaphone className="w-12 h-12 text-muted-foreground/10" />
                  <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">No broadcasts found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[800px] overflow-y-auto custom-scrollbar">
                  {filteredBroadcasts.map((b) => {
                    const metrics = broadcastMetrics[b.id]
                    const readPct = metrics && metrics.total > 0 ? Math.round((metrics.read / metrics.total) * 100) : null
                    return (
                      <div key={b.id} className="p-6 hover:bg-muted/30 transition-colors space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={cn(
                            "px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-md",
                            priorityPill(b.priority)
                          )}>
                            {b.priority}
                          </span>
                          <span className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border border-border/20 bg-muted/10 text-muted-foreground/60 rounded-md">
                            {targetLabel(b.target_type, b.target_value)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface m-0">{b.title}</h4>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2 font-medium">{b.content}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(b.created_at).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-micro font-bold text-primary uppercase tracking-tighter">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Confirmed
                            </div>
                            {metrics && readPct !== null && (
                              <div className="flex items-center gap-3">
                                <span className="text-micro font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                  {metrics.read}/{metrics.total} Read
                                </span>
                                <div className="w-16 h-1 bg-muted/40 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-1000" 
                                    style={{ width: `${readPct}%` }} 
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-micro font-bold capitalize tracking-tight px-4 bg-transparent border-border/20 text-muted-foreground/60 hover:bg-muted/40"
                            onClick={() => fetchMetrics(b.id)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1.5" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 🛠️ Sidebar Protocols */}
        <div className="xl:col-span-1 space-y-8">
          {/* Mobilization Presets */}
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Mobilization presets</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Quick-start protocols</p>
              </div>
              <BarChart className="w-5 h-5 text-muted-foreground/40" />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {templates.map((t, i) => (
                <div
                  key={i}
                  className="p-4 border border-border/40 rounded-sm cursor-pointer hover:border-primary hover:bg-muted/10 transition-all group space-y-3"
                  onClick={() => navigate('/admin/broadcasts/new', { state: { template: t } })}
                >
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border rounded-sm",
                      priorityPill(t.priority)
                    )}>
                      {t.priority}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{t.type}</span>
                  </div>
                  <h5 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors m-0">{t.title}</h5>
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium line-clamp-2 m-0">{t.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Protocol Red */}
          <Card className="rounded-sm border-t-4 border-t-destructive bg-on-surface text-white overflow-hidden relative shadow-xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <Megaphone style={{ fontSize: 160 }} />
            </div>
            <CardContent className="p-8 relative z-10 space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight m-0">Protocol Red</h3>
                <p className="text-xs text-white/40 leading-relaxed font-medium normal-case">
                  Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full h-12 text-micro font-bold uppercase tracking-widest bg-destructive hover:bg-destructive/80 text-white shadow-lg shadow-destructive/20"
                onClick={() => navigate('/admin/broadcasts/new', { state: { template: templates[2] } })}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Trigger Tactical Alert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
