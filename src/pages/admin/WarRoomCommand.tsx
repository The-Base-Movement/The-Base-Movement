import { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  Siren, 
  Radio, 
  MessageSquareWarning, 
  AlertTriangle,
  Send,
  CheckCircle2,
  Activity,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { RapidResponseDirective, CrisisIncident, MediaCounterNarrative } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function WarRoomCommand() {
  const [directives, setDirectives] = useState<RapidResponseDirective[]>([])
  const [incidents, setIncidents] = useState<CrisisIncident[]>([])
  const [narratives, setNarratives] = useState<MediaCounterNarrative[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWarRoomIntelligence()
  }, [])

  const fetchWarRoomIntelligence = async () => {
    setLoading(true)
    try {
      const [dirData, incData, narData] = await Promise.all([
        adminService.getRapidResponseDirectives(),
        adminService.getCrisisIncidents(),
        adminService.getMediaCounterNarratives()
      ])
      setDirectives(dirData)
      setIncidents(incData)
      setNarratives(narData)
    } catch (error) {
      console.error('[WAR_ROOM] Failed to fetch intelligence:', error)
      toast.error('Failed to synchronize with War Room servers.')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'DEFCON1': return 'bg-destructive text-white animate-pulse'
      case 'SEVERE': return 'bg-orange-500 text-white'
      case 'MODERATE': return 'bg-accent text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-on-surface">
        <div className="flex flex-col items-center gap-4">
          <Siren className="w-12 h-12 text-destructive animate-spin" />
          <p className="text-[10px] font-bold normal-case text-destructive animate-pulse">Initializing war room protocols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ⚔️ War room header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            War room
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Real-time intelligence, rapid response dispatch, and threat neutralization.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-xl border-border/40 shadow-sm bg-background">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-1">Operational readiness</p>
              <h3 className="text-3xl font-bold text-destructive tracking-tight">Level 2</h3>
            </div>
            <Zap className="w-8 h-8 text-accent" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🚨 Active Crisis Incidents */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-border/40 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Active crisis incidents
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mt-1">Localized resistance and PR threats</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {incidents.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-muted-foreground/40 normal-case">No active incidents. All sectors secure.</p>
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <div key={incident.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className={cn("px-3 py-1 text-[9px] font-bold normal-case rounded-full", getSeverityColor(incident.severity))}>
                            {incident.severity.toLowerCase()}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface/80 normal-case">{incident.region}</span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/40">{format(new Date(incident.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface normal-case mb-2">{incident.incident_type.replace('_', ' ').toLowerCase()}</h3>
                      <p className="text-sm text-on-surface/80 font-medium leading-relaxed mb-4">{incident.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border/40">
                        <span className={cn(
                          "text-[9px] font-bold normal-case px-2 py-1 rounded-full",
                          incident.status === 'INVESTIGATING' ? 'bg-orange-100 text-orange-600' : 
                          incident.status === 'CONTAINED' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'
                        )}>
                          {incident.status.toLowerCase()}
                        </span>
                        <Button variant="outline" className="h-8 rounded-lg text-[9px] font-bold normal-case border-border/60">
                          Update status
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 📱 Media Counter-Narratives */}
          <Card className="rounded-xl border-on-surface shadow-sm bg-on-surface text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-white/10 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta text-white flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-blue-400" /> Digital strike directives
                </CardTitle>
                <Radio className="w-4 h-4 text-white/40" />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-white/10">
                {narratives.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-white/40 normal-case">No active media campaigns.</p>
                  </div>
                ) : (
                  narratives.map((nar) => (
                    <div key={nar.id} className="p-5 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-blue-400 normal-case">{nar.target_platform}</span>
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          nar.dispatch_status === 'DEPLOYED' ? "bg-emerald-900/50 text-emerald-400" : "bg-orange-900/50 text-orange-400"
                        )}>
                          {nar.dispatch_status.toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 mb-3">"{nar.approved_messaging}"</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-white/40 normal-case">{nar.hashtags}</p>
                        {nar.dispatch_status === 'PENDING' && (
                          <Button className="h-7 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-[8px] font-bold normal-case shadow-sm">
                            <Send className="w-3 h-3 mr-1" /> Dispatch
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ⚡ Rapid Response Directives (Sidebar) */}
        <div className="lg:col-span-1">
          <Card className="rounded-xl border-border/40 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <Activity className="w-4 h-4 text-destructive" /> Rapid directives
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-[800px] overflow-y-auto">
                {directives.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 normal-case">No active directives.</p>
                  </div>
                ) : (
                  directives.map((dir) => (
                    <div key={dir.id} className={cn(
                      "p-5 transition-colors border-l-4",
                      dir.priority === 'CRITICAL' ? 'border-destructive bg-destructive/5' : 'border-border/40 hover:bg-muted/10'
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-bold normal-case",
                          dir.priority === 'CRITICAL' ? 'text-destructive animate-pulse' : 'text-on-surface/80'
                        )}>
                          {dir.priority.toLowerCase()}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/40">{dir.target_region}</span>
                      </div>
                      <h4 className="text-xs font-bold text-on-surface normal-case mb-1">{dir.title}</h4>
                      <p className="text-[10px] text-muted-foreground/80 font-medium mb-3">{dir.action_type.replace('_', ' ').toLowerCase()}</p>
                      
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          dir.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-muted/30 text-on-surface/40"
                        )}>
                          {dir.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
