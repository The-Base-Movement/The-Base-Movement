import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  ChevronRight, 
  Target, 
  Calendar, 
  Users, 
  MapPin, 
  Shield, 
  Flag, 
  ArrowLeft,
  Crosshair,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/types/admin'
import { toast } from 'sonner'

export default function DeployMission() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<{ id: string, name: string }[]>([])
  const [constituencies, setConstituencies] = useState<{ id: string, region_id: string, name: string }[]>([])
  const [filteredConstituencies, setFilteredConstituencies] = useState<{ id: string, region_id: string, name: string }[]>([])
  
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedConstituency, setSelectedConstituency] = useState<string>('')
  
  const [newCampaign, setNewCampaign] = useState<Partial<CanvassingCampaign>>({
    title: '',
    description: '',
    goal_contacts: 100,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  useEffect(() => {
    async function fetchData() {
      const [regionsData, constituenciesData] = await Promise.all([
        adminService.getGhanaRegions(),
        adminService.getGhanaConstituencies()
      ])
      setRegions(regionsData)
      setConstituencies(constituenciesData)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      const regionId = regions.find(r => r.name === selectedRegion)?.id
      if (regionId) {
        setFilteredConstituencies(constituencies.filter(c => c.region_id === regionId))
      } else {
        setFilteredConstituencies([])
      }
    } else {
      setFilteredConstituencies([])
    }
    setSelectedConstituency('')
  }, [selectedRegion, regions, constituencies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaign.title || !selectedRegion || !selectedConstituency) {
      toast.error('Please complete all mandatory tactical fields.')
      return
    }

    setLoading(true)
    try {
      const success = await adminService.createCanvassingCampaign({
        ...newCampaign,
        target_constituency: selectedConstituency,
        target_wards: [selectedRegion] // Store region in wards for now or adjust type if needed
      })

      if (success) {
        toast.success('Canvassing mission deployed to the field.')
        navigate('/admin/ground-game')
      } else {
        toast.error('Failed to initialize mobilization protocol.')
      }
    } catch (error) {
      console.error('[DEPLOY] Error:', error)
      toast.error('Operational error during deployment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🧭 Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold capitalize tracking-tight text-muted-foreground/60">
        <Link to="/admin/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
          <LayoutDashboard className="w-3 h-3" /> HQ
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/admin/ground-game" className="hover:text-primary transition-colors">Ground Game</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-on-surface">Deploy Mission</span>
      </nav>

      {/* 🏆 Header Section */}
      <div className="flex-columns items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Crosshair className="w-8 h-8 text-on-surface" />
            Deploy canvassing mission
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Initiate high-fidelity voter outreach protocols for specific jurisdictional targets.</p>
        </div>
        <Link to="/admin/ground-game">
          <Button variant="outline" className="rounded-sm text-[10px] font-bold tracking-tight px-8 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95">
            <ArrowLeft className="w-4 h-4 mr-2" /> Abort deployment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 📝 Deployment Form */}
        <div className="lg:col-span-8">
          <Card className="rounded-sm border-border/60 shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
              <div className="flex items-center gap-3 mb-1">
                <Flag className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold normal-case font-meta">Tactical deployment parameters</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold normal-case text-muted-foreground/40">Define the operational scope and objectives for this field mission.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Mission title <span className="text-primary">*</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Operation Doorstep Blitz - Central" 
                      className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Target region <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <select 
                        className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white appearance-none"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        required
                      >
                        <option value="">Select jurisdiction region</option>
                        {regions.map(r => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Target constituency <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <select 
                        className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white appearance-none disabled:opacity-50"
                        value={selectedConstituency}
                        onChange={(e) => setSelectedConstituency(e.target.value)}
                        disabled={!selectedRegion}
                        required
                      >
                        <option value="">Select constituency</option>
                        {filteredConstituencies.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Mission duration (Start) <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input 
                        type="date" 
                        className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white"
                        value={newCampaign.start_date}
                        onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Mission duration (End) <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input 
                        type="date" 
                        className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white"
                        value={newCampaign.end_date}
                        onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                      Contact goal <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                      <input 
                        type="number" 
                        className="w-full h-12 bg-muted/5 border-border/60 text-sm font-bold pl-12 pr-4 focus:ring-1 focus:ring-on-surface outline-none rounded-sm transition-all focus:bg-white"
                        value={newCampaign.goal_contacts}
                        onChange={(e) => setNewCampaign({ ...newCampaign, goal_contacts: Number(e.target.value) })}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold normal-case text-muted-foreground/60 flex items-center gap-2">
                    Mission objective & field instructions
                  </label>
                  <textarea 
                    rows={4} 
                    placeholder="Provide clear tactical objectives for canvassers..." 
                    className="w-full bg-muted/5 border-border/60 text-sm font-bold p-4 focus:ring-1 focus:ring-on-surface outline-none resize-none rounded-sm transition-all focus:bg-white"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-border/10 flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit"
                    variant="primary"
                    className="flex-1 h-14 rounded-sm font-bold text-xs capitalize tracking-tight shadow-xl shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95"
                    disabled={loading}
                  >
                    <Crosshair className="w-5 h-5 mr-3" /> {loading ? 'Initializing mission...' : 'Initiate tactical deployment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 📋 Deployment Intelligence (Sidebar) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="p-8 border-b border-white/10 relative z-10">
              <CardTitle className="text-xs font-bold normal-case font-meta text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Tactical guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white mb-1">Precise targeting</p>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">Ensure the target constituency aligns with the movement's current strategic priority areas.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white mb-1">Clear objectives</p>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">Field agents perform best with clear, concise mission objectives and measurable contact goals.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white mb-1">Data integrity</p>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">All field interactions must be logged in real-time through the canvasser clipboard protocol.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 bg-primary/5 -mx-8 -mb-8 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <p className="text-xs font-bold capitalize tracking-tight text-white">System Alert</p>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed font-bold normal-case">
                  Deployment protocols are irreversible once initiated. Ensure all tactical parameters have been verified by regional chapter leadership.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
