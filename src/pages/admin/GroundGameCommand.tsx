import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Users, 
  Car, 
  Vote, 
  ClipboardList,
  Crosshair,
  TrendingUp,
  Map as MapIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { VoterRegistration, CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function GroundGameCommand() {
  const [voterRegs, setVoterRegs] = useState<VoterRegistration[]>([])
  const [campaigns, setCampaigns] = useState<CanvassingCampaign[]>([])
  const [transportReqs, setTransportReqs] = useState<GOTVTransportRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroundGameIntelligence()
  }, [])

  const fetchGroundGameIntelligence = async () => {
    setLoading(true)
    try {
      const [voterData, campData, transData] = await Promise.all([
        adminService.getVoterRegistrations(),
        adminService.getCanvassingCampaigns(),
        adminService.getGOTVTransportRequests()
      ])
      setVoterRegs(voterData)
      setCampaigns(campData)
      setTransportReqs(transData)
    } catch (error) {
      console.error('[GROUND_GAME] Failed to fetch intelligence:', error)
      toast.error('Failed to synchronize with Ground Game servers.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <MapPin className="w-12 h-12 text-[var(--brand-green)] animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Initializing Ground Game Protocols...</p>
        </div>
      </div>
    )
  }

  const verifiedVoters = voterRegs.filter(v => v.registration_status === 'VERIFIED_VOTER').length
  const totalContacts = campaigns.reduce((acc, curr) => acc + (curr.goal_contacts || 0), 0) // Placeholder logic

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* 🗳️ Ground Game Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-200 bg-white p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-12 tactical-gradient-green" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-green)]">Operation Ground Game</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-stone-900 font-meta italic uppercase flex items-center gap-4">
            Ground <span className="text-stone-400">Command</span>
            <MapPin className="w-12 h-12 text-[var(--brand-green)] animate-bounce" />
          </h1>
          <p className="text-stone-500 text-sm font-medium tracking-wide max-w-2xl mt-3 leading-relaxed">
            Election Day logistics, voter registration tracking, and door-to-door canvassing command. Mobilizing the grassroots with precision.
          </p>
        </div>
        <div className="flex flex-col items-end relative z-10">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2">Verified Patriots</span>
          <div className="flex items-center gap-5 bg-stone-50 p-4 border border-stone-100 shadow-inner">
            <div className="text-right">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Registered Voters</span>
              <span className="text-4xl font-black italic tracking-tighter text-[var(--brand-green)]">
                {verifiedVoters.toLocaleString()}
              </span>
            </div>
            <div className="h-10 w-[2px] bg-stone-200" />
            <Vote className="w-8 h-8 text-[var(--brand-green)]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📋 Active Canvassing Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[var(--brand-green)]" /> Active Canvassing
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Door-to-door outreach missions</CardDescription>
                </div>
                <Button className="h-8 rounded-none text-[9px] font-black uppercase tracking-widest bg-[var(--brand-green)] text-white hover:bg-green-700">
                  <Crosshair className="w-3 h-3 mr-1" /> Deploy Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100">
                {campaigns.length === 0 ? (
                  <div className="p-12 text-center">
                    <MapIcon className="w-8 h-8 text-stone-200 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No active campaigns. Awaiting deployment.</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 hover:bg-stone-50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 text-[9px] font-black uppercase tracking-widest",
                            campaign.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-500"
                          )}>
                            {campaign.status}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{campaign.target_constituency}</span>
                        </div>
                        <span className="text-[9px] font-bold text-stone-400">Target: {campaign.goal_contacts} Doors</span>
                      </div>
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight mb-2">{campaign.title}</h3>
                      <p className="text-sm text-stone-600 font-medium leading-relaxed mb-4">{campaign.description}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <TrendingUp className="w-4 h-4 text-stone-300" />
                        <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--brand-green)]" style={{ width: '45%' }} /> {/* Placeholder progress */}
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest w-12 text-right">45%</span>
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
          <Card className="rounded-none border-stone-200 shadow-sm bg-white overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-tight font-meta italic flex items-center gap-2">
                    <Car className="w-4 h-4 text-[var(--brand-green)]" /> Transport Logistics
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Election Day GOTV</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                {transportReqs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No transport requests.</p>
                  </div>
                ) : (
                  transportReqs.map((req) => (
                    <div key={req.id} className="p-5 hover:bg-stone-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5",
                          req.status === 'PENDING' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {req.status}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">
                          {format(new Date(req.requested_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-stone-600">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span className="truncate">{req.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-stone-900">
                          <Vote className="w-3 h-3 text-[var(--brand-green)]" />
                          <span className="uppercase tracking-tight truncate">Polling Station: {req.polling_station_id}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-stone-100">
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                          <Users className="w-3 h-3 inline mr-1" /> {req.passengers} Pax
                        </span>
                        {req.status === 'PENDING' && (
                          <Button className="h-6 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-none text-[8px] font-black uppercase tracking-widest">
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
        </div>

      </div>
    </div>
  )
}
