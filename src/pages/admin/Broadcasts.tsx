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
      case 'Urgent': return 'bg-red-500 text-white'
      case 'High': return 'bg-orange-500 text-white'
      default: return 'bg-stone-500 text-white'
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-stone-900" />
            Communication hub
          </h1>
          <p className="text-stone-500 text-sm mt-1">Direct HQ-to-field mobilization and broadcast history.</p>
        </div>
        <Button 
          onClick={() => navigate('/admin/broadcasts/new')}
          className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" /> New broadcast
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Megaphone className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Total</Badge>
            </div>
            <div className="text-3xl font-bold text-stone-900">{broadcasts.length}</div>
            <div className="text-[10px] text-stone-500 font-bold normal-case mt-1">Total broadcasts</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case border-red-100 text-red-600">Urgent</Badge>
            </div>
            <div className="text-3xl font-bold text-red-600">{broadcasts.filter(b => b.priority === 'Urgent').length}</div>
            <div className="text-[10px] text-stone-500 font-bold normal-case mt-1">Critical alerts</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Reach</Badge>
            </div>
            <div className="text-3xl font-bold text-stone-900">100%</div>
            <div className="text-[10px] text-stone-500 font-bold normal-case mt-1">Field saturation</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden relative group hover:border-[var(--brand-red)] transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <Badge variant="outline" className="text-[10px] font-bold normal-case">Uptime</Badge>
            </div>
            <div className="text-3xl font-bold text-stone-900">24/7</div>
            <div className="text-[10px] text-stone-500 font-bold normal-case mt-1">Direct connection</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Previous Broadcasts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border-stone-200 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Broadcast history
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <Input 
                    placeholder="Search broadcasts..." 
                    className="pl-9 h-8 text-xs rounded-lg border-stone-200 focus:ring-0 focus:border-stone-400"
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
                  <p className="text-xs text-stone-500 font-bold normal-case">Retrieving secure comm logs...</p>
                </div>
              ) : filteredBroadcasts.length === 0 ? (
                <div className="p-12 text-center">
                  <Megaphone className="w-8 h-8 mx-auto text-stone-200 mb-4" />
                  <p className="text-xs text-stone-500 font-bold normal-case">No active deployments found</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredBroadcasts.map((broadcast: Broadcast) => (
                    <div key={broadcast.id} className="p-6 hover:bg-stone-50/50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-[8px] font-bold normal-case rounded-full px-2", getPriorityColor(broadcast.priority))}>
                              {broadcast.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[8px] font-bold normal-case text-stone-400 rounded-full border-stone-200">
                              {broadcast.target_type === 'ALL' ? 'National' : broadcast.target_value}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg tracking-tight text-stone-900 group-hover:text-red-600 transition-colors">
                            {broadcast.title}
                          </h3>
                          <p className="text-stone-600 text-sm leading-relaxed max-w-2xl">
                            {broadcast.content}
                          </p>
                          <div className="flex items-center gap-4 mt-4 text-[10px] text-stone-400 font-bold normal-case">
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border border-stone-200 h-8 normal-case"
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
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-stone-100 bg-stone-50/50">
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
                  className="p-3 border border-stone-100 hover:border-stone-300 cursor-pointer transition-colors group"
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
                    <span className="text-[10px] font-bold normal-case text-[var(--brand-black)]">{template.title}</span>
                    <Plus className="w-3 h-3 text-stone-300 group-hover:text-[var(--brand-black)]" />
                  </div>
                  <div className="text-[9px] text-stone-400 font-bold normal-case">
                    {template.priority} • {template.type === 'ALL' ? 'National' : 'Segmented'}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl bg-stone-900 text-white border-none shadow-xl overflow-hidden relative">
            <CardContent className="p-6 relative z-10">
              <AlertOctagon className="w-8 h-8 text-[var(--brand-red)] mb-4" />
              <h4 className="text-lg font-bold tracking-tight mb-2">Protocol red</h4>
              <p className="text-xs text-stone-400 leading-relaxed mb-6 font-medium">
                Urgent mobilization triggers immediate notifications to all connected field assets. Use only for critical broadcasts.
              </p>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] h-10 border-none shadow-lg">
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
