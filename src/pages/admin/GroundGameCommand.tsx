import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MapPin, 
  Users, 
  Car, 
  Vote, 
  ClipboardList,
  Crosshair,
  Activity,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Map as MapIcon,
  TrendingUp
} from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { VoterRegistration, CanvassingCampaign, CanvasserLog, GOTVTransportRequest } from '@/types/admin'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function GroundGameCommand() {
  const navigate = useNavigate()
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
          <p className="text-[10px] font-bold text-primary">Initializing ground game protocols...</p>
        </div>
      </div>
    )
  }

  const handleDispatchAsset = async (requestId: string) => {
    const success = await adminService.updateTransportRequest(requestId, 'DISPATCHED')
    if (success) {
      toast.success('Logistics asset dispatched to pickup location.')
      setTransportReqs(prev => prev.map(r => r.id === requestId ? { ...r, status: 'DISPATCHED' } : r))
    } else {
      toast.error('Failed to initialize dispatch protocol.')
    }
  }

  const handleDeployMission = () => {
    navigate('/admin/ground-game/deploy')
  }

  const verifiedVoters = voterRegs.filter(v => v.registration_status === 'VERIFIED_VOTER').length
  const totalContacts = campaigns.reduce((acc, curr) => acc + (curr.goal_contacts || 0), 0)

  // 📊 Process Registration Trends (Last 7 days)
  const regTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().slice(0, 10)
    return {
      date: format(date, 'MMM dd'),
      count: voterRegs.filter(v => v.created_at?.slice(0, 10) === dateStr).length
    }
  })

  // 🎯 Process Canvassing Sentiment
  const sentimentData = [
    { name: 'Strong Support', value: fieldLogs.filter(l => l.interaction_result === 'STRONG_SUPPORT').length, color: 'var(--brand-green)' },
    { name: 'Leaning', value: fieldLogs.filter(l => l.interaction_result === 'LEANING').length, color: '#3b82f6' },
    { name: 'Undecided', value: fieldLogs.filter(l => l.interaction_result === 'UNDECIDED').length, color: '#f59e0b' },
    { name: 'Hostile', value: fieldLogs.filter(l => l.interaction_result === 'HOSTILE').length, color: '#ef4444' }
  ].filter(d => d.value > 0)

  return (
    <div className="admin-page-container animate-in fade-in duration-700">
      <div className="flex-columns items-center flex-between" style={{ '--column-gap': '2rem' } as React.CSSProperties}>
        <div className="flow" style={{ '--flow-space': '0.5rem' } as React.CSSProperties}>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta m-0">
            <MapPin className="w-8 h-8 text-on-surface" />
            Ground command
          </h1>
          <BrandLine />
          <p className="text-muted-foreground/80 text-sm mb-0 prose-standard">Election day logistics, voter registration tracking, and canvassing command.</p>
        </div>
      </div>

      <div className="flex-columns items-stretch mb-8" style={{ '--column-gap': '1.5rem', '--column-min-width': '24ch' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
              <p className="text-[10px] font-bold text-muted-foreground/40 mb-0">Registered voters</p>
              <h3 className="text-3xl font-bold text-primary tracking-tight m-0">{verifiedVoters.toLocaleString()}</h3>
            </div>
            <Vote className="w-8 h-8 text-muted-foreground/20" />
          </CardContent>
        </Card>
        
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
              <p className="text-[10px] font-bold text-muted-foreground/40 mb-0">Campaign outreach</p>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight m-0">{totalContacts.toLocaleString()} <span className="text-sm font-normal text-muted-foreground/40">doors</span></h3>
            </div>
            <ClipboardList className="w-8 h-8 text-muted-foreground/20" />
          </CardContent>
        </Card>
      </div>

      <div className="flex-columns items-stretch mb-8" style={{ '--column-gap': '2rem', '--column-breakpoint': '90ch' } as React.CSSProperties}>
        {/* 📈 Registration Velocity Chart */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-white p-6 min-h-[350px]">
          <CardHeader className="p-0 mb-6">
            <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
              <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2 m-0">
                <Activity className="w-4 h-4 text-primary" /> Registration velocity
              </CardTitle>
              <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-0">7-day mobilization trend</CardDescription>
            </div>
          </CardHeader>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={regTrends}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-green)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--brand-green)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}
                  labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--brand-green)" fillOpacity={1} fill="url(#colorReg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 🥧 Field Sentiment Distribution */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-white p-6 min-h-[350px]">
          <CardHeader className="p-0 mb-6">
            <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
              <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2 m-0">
                <PieIcon className="w-4 h-4 text-primary" /> Field sentiment breakdown
              </CardTitle>
              <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-0">Canvassing interaction intelligence</CardDescription>
            </div>
          </CardHeader>
          <div className="h-[240px] w-full flex items-center justify-center">
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}
                    labelStyle={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <BarIcon className="w-8 h-8 text-muted-foreground/10 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-muted-foreground/20 normal-case">Awaiting canvassing data...</p>
              </div>
            )}
          </div>
        </Card>
          <div className="flex-columns items-start" style={{ '--column-gap': '2rem', '--column-breakpoint': '120ch' } as React.CSSProperties}>
        
        {/* 📋 Active Canvassing Campaigns */}
        <div className="flex-[2] min-w-0 flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5 flex-columns items-center" style={{ '--column-gap': '1rem' } as React.CSSProperties}>
              <div className="flex-1 flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2 m-0">
                  <ClipboardList className="w-4 h-4 text-primary" /> Active canvassing
                </CardTitle>
                <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-0">Door-to-door outreach missions</CardDescription>
              </div>
              <Button 
                variant="primary"
                onClick={handleDeployMission}
                className="h-11 px-8 rounded-sm text-[10px] font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Crosshair className="w-4 h-4 mr-2" /> Deploy Mission
              </Button>
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
                    <div key={campaign.id} className="p-6 hover:bg-muted/5 transition-colors flow" style={{ '--flow-space': '1rem' } as React.CSSProperties}>
                      <div className="flex justify-between items-start gap-4">
                         <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 text-[9px] font-bold normal-case rounded-full",
                            campaign.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
                          )}>
                            {campaign.status.toLowerCase()}
                          </span>
                          <span className="text-[10px] font-bold text-on-surface/60 normal-case">{campaign.target_constituency}</span>
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground/40 shrink-0">Target: {campaign.goal_contacts} doors</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface normal-case m-0">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed mb-0 prose-standard">{campaign.description}</p>
                      
                      <div className="flex items-center gap-2 pt-2">
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
        <div className="flex-1 min-w-0 flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
                <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2 m-0">
                  <Car className="w-4 h-4 text-primary" /> Transport logistics
                </CardTitle>
                <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40 mb-0">Election day GOTV</CardDescription>
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
                    <div key={req.id} className="p-5 hover:bg-muted/5 transition-colors flow" style={{ '--flow-space': '0.75rem' } as React.CSSProperties}>
                      <div className="flex justify-between items-start gap-4">
                        <span className={cn(
                          "text-[8px] font-bold normal-case px-2 py-0.5 rounded-full",
                          req.status === 'PENDING' ? "bg-orange-500/10 text-orange-600" : "bg-primary/10 text-primary"
                        )}>
                          {req.status.toLowerCase()}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/40 shrink-0">
                          {format(new Date(req.requested_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flow" style={{ '--flow-space': '0.25rem' } as React.CSSProperties}>
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
                          <Button 
                            variant="primary"
                            onClick={() => handleDispatchAsset(req.id)}
                            className="h-10 px-6 rounded-sm text-[10px] font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                          >
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
          <Card className="rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-6 border-b border-white/10 relative z-10">
              <CardTitle className="text-xs font-bold normal-case font-meta text-white flex items-center gap-2 m-0">
                <Activity className="w-4 h-4 text-primary" /> Live field ops
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto sidebar-scroll">
                {fieldLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-[10px] font-bold text-white/20 normal-case mb-0">Awaiting field intelligence...</p>
                  </div>
                ) : (
                  fieldLogs.map((log) => (
                    <div key={log.id} className="p-5 hover:bg-white/5 transition-colors flow" style={{ '--flow-space': '0.5rem' } as React.CSSProperties}>
                      <div className="flex justify-between items-center">
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
                        <span className="text-[9px] font-bold text-white/20 shrink-0">{format(new Date(log.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-[11px] text-white/80 m-0">"{log.address_notes || 'No notes provided'}"</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/20" />
                        <span className="text-[9px] font-bold text-white/40">Sector {log.canvasser_id.substring(0, 4)}</span>
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
    </div>
  )
}
