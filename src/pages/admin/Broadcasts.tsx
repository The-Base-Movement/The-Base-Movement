import { useState, useEffect, useCallback } from 'react'
import { 
  Megaphone, 
  Users, 
  AlertOctagon, 
  Clock, 
  CheckCircle2,
  Plus,
  Loader2,
  Search,
  Shield
} from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { adminService } from '@/services/adminService'
import type { Broadcast } from '@/services/adminService'
import { cn } from "@/lib/utils"
import { useNavigate } from 'react-router-dom'

export default function Broadcasts() {
  const navigate = useNavigate()
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcastMetrics, setBroadcastMetrics] = useState<Record<string, { total: number, read: number }>>({})

  const fetchMetrics = useCallback(async (id: string) => {
    try {
      const stats = await adminService.getBroadcastMetrics(id)
      setBroadcastMetrics(prev => ({ ...prev, [id]: stats }))
    } catch {
      // Fail silently for metrics
    }
  }, [])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const bData = await adminService.getBroadcasts()
      setBroadcasts(bData)
      
      // Fetch metrics for recent broadcasts
      bData.slice(0, 5).forEach(b => fetchMetrics(b.id))
    } catch {
      toast.error("Failed to synchronize mobilization telemetry")
    } finally {
      setIsLoading(false)
    }
  }, [fetchMetrics])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-destructive text-white'
      case 'High': return 'bg-accent text-on-surface'
      default: return 'bg-muted-foreground text-white'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-on-surface" />
            Communication hub
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Direct HQ-to-field mobilization and broadcast history.</p>
        </div>
        <Button 
          onClick={() => navigate('/admin/broadcasts/new')}
          className="rounded-xl bg-on-surface text-white text-[10px] px-6 font-bold hover:bg-on-surface/90 shadow-sm h-10 transition-all flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> New broadcast
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden relative group hover:border-accent transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Megaphone className="w-4 h-4 text-muted-foreground/40" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Total</Badge>
            </div>
            <div className="text-3xl font-bold text-on-surface">{broadcasts.length}</div>
            <div className="text-[10px] text-muted-foreground/80 font-bold normal-case mt-1">Total broadcasts</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden relative group hover:border-destructive transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertOctagon className="w-4 h-4 text-destructive" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case border-destructive/20 text-destructive">Urgent</Badge>
            </div>
            <div className="text-3xl font-bold text-destructive">{broadcasts.filter(b => b.priority === 'Urgent').length}</div>
            <div className="text-[10px] text-muted-foreground/80 font-bold normal-case mt-1">Critical alerts</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden relative group hover:border-primary transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 text-muted-foreground/40" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Reach</Badge>
            </div>
            <div className="text-3xl font-bold text-on-surface">100%</div>
            <div className="text-[10px] text-muted-foreground/80 font-bold normal-case mt-1">Field saturation</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden relative group hover:border-on-surface transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-muted-foreground/40" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Uptime</Badge>
            </div>
            <div className="text-3xl font-bold text-on-surface">24/7</div>
            <div className="text-[10px] text-muted-foreground/80 font-bold normal-case mt-1">Direct connection</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Previous Broadcasts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-border/60 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-muted/5 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Broadcast history
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                  <Input 
                    placeholder="Search broadcasts..." 
                    className="pl-9 h-8 text-xs rounded-lg border-border/60 focus:ring-0 focus:border-on-surface"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-xs text-muted-foreground/80 font-bold normal-case">Retrieving secure comm logs...</p>
                </div>
              ) : filteredBroadcasts.length === 0 ? (
                <div className="p-12 text-center">
                  <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-xs text-muted-foreground/80 font-bold normal-case">No active deployments found</p>
                </div>
              ) : (
                <div className="divide-y divide-border/10">
                  {filteredBroadcasts.map((broadcast: Broadcast) => (
                    <div key={broadcast.id} className="p-6 hover:bg-muted/5 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-[8px] font-bold normal-case rounded-full px-2", getPriorityColor(broadcast.priority))}>
                              {broadcast.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[8px] font-bold normal-case text-muted-foreground/40 rounded-full border-border/60">
                              {broadcast.target_type === 'ALL' ? 'National' : broadcast.target_value}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg tracking-tight text-on-surface group-hover:text-primary transition-colors">
                            {broadcast.title}
                          </h3>
                          <p className="text-on-surface/80 text-sm leading-relaxed max-w-2xl">
                            {broadcast.content}
                          </p>
                          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground/40 font-bold normal-case">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> {new Date(broadcast.created_at).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-primary" /> Confirmed
                            </span>
                            {broadcastMetrics[broadcast.id] && (
                              <div className="flex items-center gap-4 ml-2">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3 h-3 text-muted-foreground/40" /> 
                                  <span>{broadcastMetrics[broadcast.id].read} / {broadcastMetrics[broadcast.id].total} Read</span>
                                </div>
                                <div className="w-24 h-1.5 bg-muted/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${(broadcastMetrics[broadcast.id].read / broadcastMetrics[broadcast.id].total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border border-border/60 h-8 normal-case"
                          onClick={() => fetchMetrics(broadcast.id)}
                        >
                          Refresh stats
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Mobilization Templates */}
        <div className="space-y-6">
          <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/10 bg-muted/5">
              <CardTitle className="text-sm font-bold normal-case">Mobilization presets</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { title: "National Membership Drive", type: "ALL", priority: "High", content: "All chapters are invited to initiate regional registration drives this weekend. Goal: 10,000 new verified members." },
                { title: "Regional Strategic Briefing", type: "REGION", priority: "Normal", content: "Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT." },
                { title: "Level Red Emergency Alert", type: "ALL", priority: "Urgent", content: "IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates." },
                { title: "Constituency Outreach", type: "CONSTITUENCY", priority: "Normal", content: "Local chapter engagement initiative starting in your area. Please coordinate with regional leads." }
              ].map((template, idx) => (
                <div 
                  key={idx}
                  className="p-3 border border-border/10 hover:border-border/60 cursor-pointer transition-colors group"
                  onClick={() => {
                    navigate('/admin/broadcasts/new', { 
                      state: { 
                        template: {
                          title: template.title,
                          content: template.content,
                          type: template.type,
                          priority: template.priority
                        } 
                      } 
                    })
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold normal-case text-on-surface">{template.title}</span>
                    <Plus className="w-3 h-3 text-muted-foreground/20 group-hover:text-on-surface" />
                  </div>
                  <div className="text-[9px] text-muted-foreground/40 font-bold normal-case">
                    {template.priority} • {template.type === 'ALL' ? 'National' : 'Segmented'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-on-surface text-white border-none shadow-xl overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <AlertOctagon className="w-8 h-8 text-destructive mb-4" />
              <h4 className="text-lg font-bold tracking-tight mb-2">Protocol red</h4>
              <p className="text-xs text-white/60 leading-relaxed mb-6 font-medium">
                Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts.
              </p>
              <Button className="w-full bg-destructive hover:bg-destructive/90 text-white rounded-lg font-bold text-[10px] h-10 border-none shadow-lg">
                Emergency alert
              </Button>
            </CardContent>
            <Megaphone className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
          </Card>
        </div>
      </div>
    </div>
  )
}
