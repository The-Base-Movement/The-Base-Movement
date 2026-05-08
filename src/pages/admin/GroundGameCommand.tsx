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
          <p className="text-micro font-bold text-primary">Initializing ground game protocols...</p>
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
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <MapPin className="w-8 h-8 text-on-surface" />
            Ground command
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Election day logistics, voter registration tracking, and canvassing command.</p>
        </div>
      </div>

      {/* KPI Row - Balanced Grid */}
      <div className="grid-stats mb-12" style={{ '--grid-min-width': '220px' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-micro font-bold text-muted-foreground/60 mb-1 tracking-widest uppercase">Registered voters</p>
              <h3 className="text-3xl font-bold text-primary tracking-tight">{verifiedVoters.toLocaleString()}</h3>
              <p className="text-tiny text-muted-foreground/60 font-bold tracking-tight mt-1.5">Verified personnel</p>
            </div>
            <Vote className="w-8 h-8 text-muted-foreground/10" />
          </CardContent>
        </Card>
        
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-micro font-bold text-muted-foreground/60 mb-1 tracking-widest uppercase">Canvassing goal</p>
              <h3 className="text-3xl font-bold text-on-surface tracking-tight">{totalContacts.toLocaleString()} <span className="text-sm font-normal text-muted-foreground/70">doors</span></h3>
              <p className="text-tiny text-muted-foreground/60 font-bold tracking-tight mt-1.5">Active outreach target</p>
            </div>
            <Target className="w-8 h-8 text-muted-foreground/10" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 📈 Registration Velocity Chart */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-background p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Registration velocity
            </CardTitle>
            <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 mt-1">7-day mobilization trend</CardDescription>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(255,255,255,0.6)' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(255,255,255,0.6)' }}
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
        <Card className="rounded-sm border-border/60 shadow-sm bg-background p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-primary" /> Field sentiment breakdown
            </CardTitle>
            <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 mt-1">Canvassing interaction intelligence</CardDescription>
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
                <p className="text-micro font-bold text-muted-foreground/70 normal-case">Awaiting canvassing data...</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📋 Active Canvassing Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-sm border-border/60 shadow-sm bg-background overflow-hidden">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" /> Active canvassing
                  </CardTitle>
                  <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 mt-1">Door-to-door outreach missions</CardDescription>
                </div>
                <Button 
                  variant="primary"
                  onClick={handleDeployMission}
                  className="h-12 px-10 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <Crosshair className="w-4 h-4 mr-2" /> Deploy Mission
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/10">
                {campaigns.length === 0 ? (
                  <div className="p-12 text-center">
                    <MapIcon className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-micro font-bold text-muted-foreground/40 normal-case">No active campaigns. Awaiting deployment.</p>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-6 hover:bg-muted/5 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 text-micro font-bold normal-case rounded-full",
                            campaign.status === 'ACTIVE' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
                          )}>
                            {campaign.status.toLowerCase()}
                          </span>
                          <span className="text-micro font-bold text-on-surface/60 normal-case">{campaign.target_constituency}</span>
                        </div>
                        <span className="text-micro font-bold text-muted-foreground/80">Target: {campaign.goal_contacts} doors</span>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface normal-case mb-2">{campaign.title}</h3>
                      <p className="text-sm text-muted-foreground/80 font-medium leading-relaxed mb-4">{campaign.description}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        <TrendingUp className="w-4 h-4 text-muted-foreground/20" />
                        <div className="h-2 w-full bg-muted/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '45%' }} /> {/* Placeholder progress */}
                        </div>
                        <span className="text-micro font-bold text-muted-foreground/80 normal-case w-12 text-right">45%</span>
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
          <Card className="rounded-sm border-border/60 shadow-sm bg-background overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" /> Transport logistics
                  </CardTitle>
                  <CardDescription className="text-micro font-bold normal-case text-muted-foreground/80 mt-1">Election day GOTV</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/10 max-h-[600px] overflow-y-auto">
                {transportReqs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-micro font-bold text-muted-foreground/80 normal-case">No transport requests.</p>
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
                        <span className="text-micro font-bold text-muted-foreground/80">
                          {format(new Date(req.requested_time), 'HH:mm')}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-micro font-medium text-on-surface/60">
                          <MapPin className="w-3 h-3 text-muted-foreground/80" />
                          <span className="truncate">{req.pickup_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-micro font-bold text-on-surface">
                          <Vote className="w-3 h-3 text-primary" />
                          <span className="normal-case truncate">Polling station: {req.polling_station_id}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-border/10">
                        <span className="text-micro font-bold text-muted-foreground/80 normal-case">
                          <Users className="w-3 h-3 inline mr-1" /> {req.passengers} pax
                        </span>
                        {req.status === 'PENDING' && (
                          <Button 
                            variant="primary"
                            onClick={() => handleDispatchAsset(req.id)}
                            className="h-11 px-8 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                          >
                            Dispatch Asset
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
                    <p className="text-micro font-bold text-white/60">Awaiting field intelligence...</p>
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
                        <span className="text-micro font-bold text-white/60">{format(new Date(log.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-tiny text-white/80 mb-2">"{log.address_notes || 'No notes provided'}"</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-white/20" />
                        <span className="text-micro font-bold text-white/80">Sector {log.canvasser_id.substring(0, 4)}</span>
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
