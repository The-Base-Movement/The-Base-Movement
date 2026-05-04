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
import type { RapidResponseDirective, CrisisIncident, MediaCounterNarrative } from '@/services/adminService'
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
      case 'DEFCON1': return 'bg-red-600 text-white animate-pulse'
      case 'SEVERE': return 'bg-orange-500 text-white'
      case 'MODERATE': return 'bg-yellow-500 text-white'
      default: return 'bg-blue-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="flex flex-col items-center gap-4">
          <Siren className="w-12 h-12 text-red-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 animate-pulse">Initializing War Room Protocols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* ⚔️ War Room Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-800 carbon-fiber p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-12 tactical-gradient-red" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-red)] animate-pulse">DEFCON Systems Active</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white font-meta italic uppercase flex items-center gap-4">
            War <span className="text-stone-500">Room</span>
            <ShieldAlert className="w-12 h-12 text-[var(--brand-red)] animate-pulse" />
          </h1>
          <p className="text-stone-400 text-sm font-medium tracking-wide max-w-2xl mt-3 leading-relaxed">
            Real-time movement intelligence, rapid response dispatch, and institutional threat neutralization. Integrated DEFCON monitoring engaged.
          </p>
        </div>
        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Operational Readiness</span>
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 border border-white/5">
            <div className="text-right">
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest block">Strategic Level</span>
              <span className="text-3xl font-black italic tracking-tighter text-[var(--brand-red)]">LEVEL 2</span>
            </div>
            <div className="h-10 w-[2px] bg-stone-800" />
            <Zap className="w-8 h-8 text-[var(--brand-gold)] animate-bounce" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🚨 Active Crisis Incidents */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Active Crisis Incidents
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Localized resistance and PR threats</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100">
                {incidents.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No Active Incidents. All Sectors Secure.</p>
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <div key={incident.id} className="p-6 hover:bg-stone-50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest", getSeverityColor(incident.severity))}>
                            {incident.severity}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{incident.region}</span>
                        </div>
                        <span className="text-[9px] font-bold text-stone-400">{format(new Date(incident.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight mb-2">{incident.incident_type.replace('_', ' ')}</h3>
                      <p className="text-sm text-stone-600 font-medium leading-relaxed mb-4">{incident.description}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-1",
                          incident.status === 'INVESTIGATING' ? 'bg-orange-100 text-orange-600' : 
                          incident.status === 'CONTAINED' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                        )}>
                          {incident.status}
                        </span>
                        <Button variant="outline" className="h-8 rounded-none text-[9px] font-black uppercase tracking-widest border-stone-200">
                          Update Status
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 📱 Media Counter-Narratives */}
          <Card className="rounded-none border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-stone-800 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic text-white flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-blue-400" /> Digital Strike Directives
                </CardTitle>
                <Radio className="w-4 h-4 text-stone-500" />
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-stone-800">
                {narratives.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">No active media campaigns.</p>
                  </div>
                ) : (
                  narratives.map((nar) => (
                    <div key={nar.id} className="p-5 hover:bg-stone-800/50 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{nar.target_platform}</span>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5",
                          nar.dispatch_status === 'DEPLOYED' ? "bg-emerald-900/50 text-emerald-400" : "bg-orange-900/50 text-orange-400"
                        )}>
                          {nar.dispatch_status}
                        </span>
                      </div>
                      <p className="text-sm text-stone-300 italic mb-3">"{nar.approved_messaging}"</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{nar.hashtags}</p>
                        {nar.dispatch_status === 'PENDING' && (
                          <Button className="h-7 px-3 bg-blue-600 hover:bg-blue-700 rounded-none text-[8px] font-black uppercase tracking-widest">
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
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-600" /> Rapid Directives
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100 max-h-[800px] overflow-y-auto">
                {directives.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No active directives.</p>
                  </div>
                ) : (
                  directives.map((dir) => (
                    <div key={dir.id} className={cn(
                      "p-5 transition-colors border-l-4",
                      dir.priority === 'CRITICAL' ? 'border-red-600 bg-red-50/30' : 'border-stone-200 hover:bg-stone-50'
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em]",
                          dir.priority === 'CRITICAL' ? 'text-red-600 animate-pulse' : 'text-stone-500'
                        )}>
                          {dir.priority}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">{dir.target_region}</span>
                      </div>
                      <h4 className="text-xs font-black text-stone-900 uppercase tracking-tight mb-1">{dir.title}</h4>
                      <p className="text-[10px] text-stone-500 font-medium mb-3">{dir.action_type.replace('_', ' ')}</p>
                      
                      <div className="flex justify-between items-center">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2 py-0.5",
                          dir.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-500"
                        )}>
                          {dir.status}
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
