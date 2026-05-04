import { useState, useEffect, useCallback } from 'react'
import { 
  Megaphone, 
  Send, 
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { adminService } from '@/services/adminService'
import type { Broadcast, RegionalStat } from '@/services/adminService'
import { cn } from "@/lib/utils"

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [regions, setRegions] = useState<RegionalStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcastMetrics, setBroadcastMetrics] = useState<Record<string, { total: number, read: number }>>({})

  const [newBroadcast, setNewBroadcast] = useState<Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>>({
    title: '',
    content: '',
    target_type: 'ALL',
    target_value: '',
    priority: 'Normal',
    status: 'Sent'
  })

  const fetchMetrics = useCallback(async (id: string) => {
    if (broadcastMetrics[id]) return
    try {
      const metrics = await adminService.getBroadcastMetrics(id)
      setBroadcastMetrics(prev => ({ ...prev, [id]: metrics }))
    } catch (error) {
      console.error('Error fetching broadcast metrics:', error)
    }
  }, [broadcastMetrics])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [bData, rData] = await Promise.all([
        adminService.getBroadcasts(),
        adminService.getRegionalStats()
      ])
      setBroadcasts(bData)
      setRegions(rData)
      
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

  const handleSend = async () => {
    if (!newBroadcast.title || !newBroadcast.content) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSending(true)
    try {
      const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
      const payload = { ...newBroadcast, sender_id: adminId }
      
      const success = await adminService.sendBroadcast(payload)
      if (success) {
        toast.success("Broadcast deployed to the field successfully")
        setIsModalOpen(false)
        setNewBroadcast({
          title: '',
          content: '',
          target_type: 'ALL',
          target_value: '',
          priority: 'Normal',
          status: 'Sent'
        })
        fetchData()
      } else {
        toast.error("Failed to deploy broadcast")
      }
    } catch {
      toast.error("Critical failure in mobilization dispatch")
    } finally {
      setIsSending(false)
    }
  }

  const filteredBroadcasts = broadcasts.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500 text-white'
      case 'High': return 'bg-orange-500 text-white'
      default: return 'bg-stone-500 text-white'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Communication Hub</h1>
          <p className="text-stone-500 text-sm mt-1">Direct HQ-to-Field mobilization and regional directives.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--brand-black)] hover:bg-stone-800 text-white rounded-none h-12 px-8 font-black uppercase tracking-widest text-xs shadow-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> New Broadcast
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Megaphone className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">Total</Badge>
            </div>
            <div className="text-3xl font-black text-[var(--brand-black)]">{broadcasts.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mt-1">Deployments</div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-red-100 text-red-600">Urgent</Badge>
            </div>
            <div className="text-3xl font-black text-red-600">{broadcasts.filter(b => b.priority === 'Urgent').length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mt-1">Critical Alerts</div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">Reach</Badge>
            </div>
            <div className="text-3xl font-black text-[var(--brand-black)]">100%</div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mt-1">Field Saturation</div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">Uptime</Badge>
            </div>
            <div className="text-3xl font-black text-[var(--brand-black)]">24/7</div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-widest mt-1">Direct Connection</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Previous Broadcasts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black font-meta uppercase tracking-tighter flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Deployment History
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <Input 
                    placeholder="Search directives..." 
                    className="pl-9 h-8 text-xs rounded-none border-stone-200 focus:ring-0 focus:border-stone-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-300 mb-4" />
                  <p className="text-xs text-stone-500 uppercase font-black tracking-widest">Retrieving Secure Comm Logs...</p>
                </div>
              ) : filteredBroadcasts.length === 0 ? (
                <div className="p-12 text-center">
                  <Megaphone className="w-8 h-8 mx-auto text-stone-200 mb-4" />
                  <p className="text-xs text-stone-500 uppercase font-black tracking-widest">No active deployments found</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredBroadcasts.map((broadcast: Broadcast) => (
                    <div key={broadcast.id} className="p-6 hover:bg-stone-50/50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-[8px] font-black uppercase tracking-[0.2em] rounded-none px-2", getPriorityColor(broadcast.priority))}>
                              {broadcast.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest text-stone-400 rounded-none border-stone-200">
                              {broadcast.target_type === 'ALL' ? 'National' : broadcast.target_value}
                            </Badge>
                          </div>
                          <h3 className="font-black font-meta text-lg uppercase tracking-tight text-[var(--brand-black)] group-hover:text-[var(--brand-red)] transition-colors">
                            {broadcast.title}
                          </h3>
                          <p className="text-stone-600 text-sm leading-relaxed max-w-2xl">
                            {broadcast.content}
                          </p>
                          <div className="flex items-center gap-4 mt-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" /> {new Date(broadcast.created_at).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> Confirmed
                            </span>
                            {broadcastMetrics[broadcast.id] && (
                              <div className="flex items-center gap-4 ml-2">
                                <div className="flex items-center gap-1.5">
                                  <Users className="w-3 h-3 text-stone-400" /> 
                                  <span>{broadcastMetrics[broadcast.id].read} / {broadcastMetrics[broadcast.id].total} Read</span>
                                </div>
                                <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[var(--brand-green)] transition-all duration-1000"
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-none border border-stone-200 h-8"
                          onClick={() => fetchMetrics(broadcast.id)}
                        >
                          Refresh Stats
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
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <CardTitle className="text-sm font-black font-meta uppercase tracking-widest">Mobilization Presets</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { title: "National Membership Drive", type: "ALL", priority: "High", content: "All chapters are directed to initiate regional registration drives this weekend. Goal: 10,000 new verified members." },
                { title: "Regional Strategic Briefing", type: "REGION", priority: "Normal", content: "Regional leaders are required to submit their mobilization reports by Friday 18:00 GMT." },
                { title: "Level Red Emergency Alert", type: "ALL", priority: "Urgent", content: "IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates." },
                { title: "Constituency Outreach", type: "CONSTITUENCY", priority: "Normal", content: "Local chapter engagement initiative starting in your area. Please coordinate with regional leads." }
              ].map((template, idx) => (
                <div 
                  key={idx}
                  className="p-3 border border-stone-100 hover:border-stone-300 cursor-pointer transition-colors group"
                  onClick={() => {
                    setNewBroadcast({
                      ...newBroadcast,
                      title: template.title,
                      content: template.content,
                      target_type: template.type as 'ALL' | 'REGION' | 'CONSTITUENCY',
                      priority: template.priority as 'Normal' | 'High' | 'Urgent'
                    })
                    setIsModalOpen(true)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-black)]">{template.title}</span>
                    <Plus className="w-3 h-3 text-stone-300 group-hover:text-[var(--brand-black)]" />
                  </div>
                  <div className="text-[9px] text-stone-400 uppercase font-bold tracking-tighter">
                    {template.priority} • {template.type === 'ALL' ? 'National' : 'Segmented'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-none bg-[var(--brand-black)] text-white border-none shadow-xl overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <AlertOctagon className="w-8 h-8 text-[var(--brand-red)] mb-4" />
              <h4 className="text-lg font-black font-meta uppercase tracking-tighter mb-2">Protocol Red</h4>
              <p className="text-xs text-stone-400 leading-relaxed mb-6">
                Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical directives.
              </p>
              <Button className="w-full bg-[var(--brand-red)] hover:bg-red-700 text-white rounded-none font-black uppercase tracking-widest text-[10px] h-10 border-none">
                Emergency Alert
              </Button>
            </CardContent>
            <Megaphone className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
          </Card>
        </div>
      </div>

      {/* New Broadcast Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-none border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-meta uppercase tracking-tighter">New Directive Deployment</DialogTitle>
            <DialogDescription className="text-xs text-stone-500 uppercase font-bold tracking-widest">
              Deploying a movement-wide communication to the field.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directive Title</label>
              <Input 
                placeholder="e.g. NATIONAL REGISTRATION WAVE" 
                className="rounded-none border-stone-200 h-11 text-sm font-bold placeholder:font-normal"
                value={newBroadcast.title}
                onChange={(e) => setNewBroadcast({...newBroadcast, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Target Segment</label>
                <Select 
                  value={newBroadcast.target_type}
                  onValueChange={(v: 'ALL' | 'REGION' | 'CONSTITUENCY') => setNewBroadcast({...newBroadcast, target_type: v, target_value: ''})}
                >
                  <SelectTrigger className="rounded-none border-stone-200 h-11 text-[10px] font-bold uppercase tracking-widest">
                    <SelectValue placeholder="Select Target" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-stone-200">
                    <SelectItem value="ALL" className="text-[10px] font-bold uppercase tracking-widest">National (All)</SelectItem>
                    <SelectItem value="REGION" className="text-[10px] font-bold uppercase tracking-widest">Regional</SelectItem>
                    <SelectItem value="CONSTITUENCY" className="text-[10px] font-bold uppercase tracking-widest">Constituency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Priority Level</label>
                <Select 
                  value={newBroadcast.priority}
                  onValueChange={(v: 'Normal' | 'High' | 'Urgent') => setNewBroadcast({...newBroadcast, priority: v})}
                >
                  <SelectTrigger className={cn(
                    "rounded-none border-stone-200 h-11 text-[10px] font-bold uppercase tracking-widest",
                    newBroadcast.priority === 'Urgent' ? "text-red-600 border-red-200" : ""
                  )}>
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-stone-200">
                    <SelectItem value="Normal" className="text-[10px] font-bold uppercase tracking-widest">Normal</SelectItem>
                    <SelectItem value="High" className="text-[10px] font-bold uppercase tracking-widest text-orange-600">High Priority</SelectItem>
                    <SelectItem value="Urgent" className="text-[10px] font-bold uppercase tracking-widest text-red-600">Urgent (Level Red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newBroadcast.target_type !== 'ALL' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  {newBroadcast.target_type === 'REGION' ? 'Select Region' : 'Constituency Name'}
                </label>
                {newBroadcast.target_type === 'REGION' ? (
                  <Select 
                    value={newBroadcast.target_value}
                    onValueChange={(v) => setNewBroadcast({...newBroadcast, target_value: v})}
                  >
                    <SelectTrigger className="rounded-none border-stone-200 h-11 text-[10px] font-bold uppercase tracking-widest">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-stone-200">
                      {regions.map((r: RegionalStat) => (
                        <SelectItem key={r.region} value={r.region} className="text-[10px] font-bold uppercase tracking-widest">{r.region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder="Enter Constituency Name" 
                    className="rounded-none border-stone-200 h-11 text-sm font-bold"
                    value={newBroadcast.target_value}
                    onChange={(e) => setNewBroadcast({...newBroadcast, target_value: e.target.value})}
                  />
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Directive Content</label>
              <Textarea 
                placeholder="Detailed instructions for the field..." 
                className="rounded-none border-stone-200 min-h-[120px] text-sm font-bold placeholder:font-normal leading-relaxed"
                value={newBroadcast.content}
                onChange={(e) => setNewBroadcast({...newBroadcast, content: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="border-t border-stone-100 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              className="rounded-none h-11 px-6 text-[10px] font-black uppercase tracking-widest border-stone-200"
            >
              Cancel
            </Button>
            <Button 
              disabled={isSending}
              onClick={handleSend}
              className="rounded-none h-11 px-8 text-[10px] font-black uppercase tracking-widest bg-[var(--brand-black)] hover:bg-stone-800 text-white min-w-[140px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Deploying...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-2" /> Deploy Directive
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
