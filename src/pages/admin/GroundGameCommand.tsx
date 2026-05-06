import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Users, 
  Car, 
  Vote, 
  ClipboardList,
  Crosshair,
  TrendingUp,
  Map as MapIcon,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { VoterRegistration, CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function GroundGameCommand() {
  const [voterRegs, setVoterRegs] = useState<VoterRegistration[]>([])
  const [campaigns, setCampaigns] = useState<CanvassingCampaign[]>([])
  const [transportReqs, setTransportReqs] = useState<GOTVTransportRequest[]>([])
  const [fieldLogs, setFieldLogs] = useState<CanvasserLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroundGameIntelligence()
  }, [])

  const fetchGroundGameIntelligence = async () => {
    setLoading(true)
    try {
      const [voterData, campData, transData, logData] = await Promise.all([
        adminService.getVoterRegistrations(),
        adminService.getCanvassingCampaigns(),
        adminService.getGOTVTransportRequests(),
        adminService.getCanvasserLogs()
      ])
      setVoterRegs(voterData)
      setCampaigns(campData)
      setTransportReqs(transData)
      setFieldLogs(logData)
    } catch (error) {
      console.error('[GROUND_GAME] Failed to fetch intelligence:', error)
      toast.error('Failed to synchronize with Ground Game servers.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <MapPin className="w-12 h-12 text-primary animate-bounce" />
          <p className="text-[10px] font-bold normal-case text-primary">Initializing ground game protocols...</p>
        </div>
      </div>
    )
  }

  const verifiedVoters = voterRegs.filter(v => v.registration_status === 'VERIFIED_VOTER').length
  const totalContacts = campaigns.reduce((acc, curr) => acc + (curr.goal_contacts || 0), 0) // Placeholder logic

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 🗳️ Ground game header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-on-surface" />
            Ground command
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Election day logistics, voter registration tracking, and canvassing command.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-1">Registered voters</p>
              <h3 className="text-3xl font-bold text-primary tracking-tight">{verifiedVoters.toLocaleString()}</h3>
            </div>
            <Vote className="w-8 h-8 text-muted-foreground/20" />
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-1">Campaign outreach</p>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight">{totalContacts.toLocaleString()} <span className="text-sm font-normal text-muted-foreground/40">doors</span></h3>
            </div>
            <ClipboardList className="w-8 h-8 text-muted-foreground/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📋 Active Canvassing Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-border/60 shadow-sm bg-background overflow-hidden">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Active canvassing
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mt-1">Door-to-door outreach missions</CardDescription>
                </div>
                <Button className="h-8 rounded-lg text-[9px] font-bold normal-case bg-primary text-white hover:bg-primary/90 shadow-sm">
                  <Crosshair className="w-3 h-3 mr-1" /> Deploy campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/10">
                {campaigns.length === 0 ? (
                  <div className="p-12 text-center">
                    <MapIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-muted-foreground/40 normal-case">No active campaigns. Awaiting deployment.</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 hover:bg-muted/5 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 text-[9px] font-bold normal-case rounded-full",
                            campaign.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
                          )}>
                            {campaign.status.toLowerCase()}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface/60 normal-case">{campaign.target_constituency}</span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/40">Target: {campaign.goal_contacts} doors</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface normal-case mb-2">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed mb-4">{campaign.description}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <TrendingUp className="w-4 h-4 text-muted-foreground/20" />
                        <div className="h-2 w-full bg-muted/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '45%' }} /> {/* Placeholder progress */}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground/40 normal-case w-12 text-right">45%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🚗 GOTV Transport Logistics (Sidebar) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-xl border-border/60 shadow-sm bg-background overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" /> Transport logistics
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mt-1">Election day GOTV</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/10 max-h-[600px] overflow-y-auto">
                {transportReqs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 normal-case">No transport requests.</p>
                  </div>
                ) : (
                  transportReqs.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-muted/5 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          req.status === 'PENDING' ? "bg-orange-500/10 text-orange-600" : "bg-primary/10 text-primary"
                        )}>
                          {req.status.toLowerCase()}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/40">
                          {format(new Date(req.requested_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-on-surface/60">
                          <MapPin className="w-3 h-3 text-muted-foreground/40" />
                          <span className="truncate">{req.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface">
                          <Vote className="w-3 h-3 text-primary" />
                          <span className="normal-case truncate">Polling station: {req.polling_station_id}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-border/10">
                        <span className="text-[9px] font-bold text-muted-foreground/40 normal-case">
                          <Users className="w-3 h-3 inline mr-1" /> {req.passengers} pax
                        </span>
                        {req.status === 'PENDING' && (
                          <Button className="h-6 px-3 bg-on-surface hover:bg-on-surface/90 text-white rounded-lg text-[8px] font-bold normal-case shadow-sm">
                            Dispatch
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 📡 Live Field Activity */}
          <Card className="rounded-xl border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-white/10 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold normal-case font-meta text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Live field ops
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto sidebar-scroll">
                {fieldLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-white/20 normal-case">Awaiting field intelligence...</p>
                  </div>
                ) : (
                  fieldLogs.map((log) => (
                    <div key={log.id} className="p-5 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          log.interaction_result === 'STRONG_SUPPORT' ? "bg-primary/20 text-primary" :
                          log.interaction_result === 'LEANING' ? "bg-blue-500/20 text-blue-400" :
                          log.interaction_result === 'UNDECIDED' ? "bg-accent/20 text-accent" :
                          log.interaction_result === 'HOSTILE' ? "bg-destructive/20 text-destructive" :
                          "bg-white/10 text-white/40"
                        )}>
                          {log.interaction_result.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="text-[9px] font-bold text-white/20">{format(new Date(log.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-[11px] text-white/80 mb-2">"{log.address_notes || 'No notes provided'}"</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/20" />
                        <span className="text-[9px] font-bold text-white/40 normal-case">Sector {log.canvasser_id.substring(0, 4)}</span>
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
