import { useState, useEffect } from 'react'
import { 
  Target, 
  Send,
  Eye, 
  CheckCircle, 
  XCircle, 
  Camera, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Plus,
  Shield,
  Layers,
  Filter,
  BarChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { FieldDirective, FieldReport } from '@/services/adminService'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function FieldDirectives() {
  const [directives, setDirectives] = useState<FieldDirective[]>([])
  const [reports, setReports] = useState<FieldReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [directivesData, reportsData] = await Promise.all([
          adminService.getFieldDirectives(),
          adminService.getFieldReports()
        ])
        setDirectives(directivesData)
        setReports(reportsData)
      } catch (err) {
        console.error('Failed to load tactical data:', err)
        toast.error('Tactical synchronization failed.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleVerify = async (reportId: string, status: 'Verified' | 'Rejected') => {
    const success = await adminService.verifyFieldReport(reportId, status)
    if (success) {
      toast.success(`Report ${status.toLowerCase()} successfully.`)
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
    }
  }

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20">
        <Target className="w-12 h-12 text-stone-200 animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">Establishing Tactical Feed...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🎯 Tactical Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-stone-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[var(--brand-red)] rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Tactical Command Center</span>
          </div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">
            Field <span className="text-stone-300">Directives</span>
          </h1>
          <p className="text-stone-500 text-sm mt-2 font-medium italic">Deploying decentralized tactical objectives across the movement.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-none border-stone-200 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all">
            <BarChart className="w-4 h-4 mr-2" /> Tactical Analytics
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setIsCreating(true)}
            className="h-12 px-6 rounded-none bg-[var(--brand-black)] text-white font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" /> Issue New Directive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📋 Directive List */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-lg font-black uppercase tracking-tight font-meta flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--brand-red)]" /> Active Directives
          </h2>
          
          <div className="space-y-4">
            {directives.length > 0 ? directives.map((directive) => (
              <Card key={directive.id} className="rounded-none border-stone-200 shadow-sm hover:border-[var(--brand-black)] transition-colors group">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                      directive.priority === 'Urgent' ? "bg-red-50 text-red-600 border-red-100" :
                      directive.priority === 'High' ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-stone-50 text-stone-500 border-stone-100"
                    )}>
                      {directive.priority} Priority
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{directive.target_type}</span>
                  </div>
                  <CardTitle className="text-base font-black uppercase tracking-tight text-[var(--brand-black)] leading-tight">
                    {directive.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <p className="text-xs text-stone-500 line-clamp-2">{directive.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold uppercase">{directive.deadline ? new Date(directive.deadline).toLocaleDateString() : 'No Deadline'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--brand-gold)]">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black">{directive.points_awarded} pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="border-2 border-dashed border-stone-200 p-12 text-center text-stone-300">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">No active directives.</p>
              </div>
            )}
          </div>
        </div>

        {/* 📡 Situational Feed (Reports) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight font-meta flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--brand-red)]" /> Situational Awareness Feed
            </h2>
            <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest hover:bg-stone-50">
              <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter Feed
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.length > 0 ? reports.map((report) => (
              <Card key={report.id} className="rounded-none border-stone-200 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-video bg-stone-100 relative group overflow-hidden">
                  {report.media_url ? (
                    <img src={report.media_url} alt="Field verification" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                      <Camera className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-[8px] font-black uppercase tracking-widest">No Media verification</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <div className={cn(
                      "px-2 py-1 text-[8px] font-black uppercase tracking-widest shadow-xl border",
                      report.status === 'Verified' ? "bg-emerald-500 text-white border-emerald-400" :
                      report.status === 'Rejected' ? "bg-red-500 text-white border-red-400" :
                      "bg-white/90 text-stone-900 border-white"
                    )}>
                      {report.status}
                    </div>
                  </div>
                  {report.location_lat && (
                    <div className="absolute bottom-4 left-4">
                      <div className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-full border border-white/10">
                        <MapPin className="w-2.5 h-2.5 text-[var(--brand-red)]" /> Verified Location
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden border border-stone-200">
                        <img src={`https://i.pravatar.cc/100?u=${report.member_id}`} alt="Patriot" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight leading-none mb-1">Patriot #{report.member_id.slice(0, 5)}</p>
                        <p className="text-[8px] font-bold text-stone-400 uppercase">{new Date(report.created_at).toLocaleTimeString()} - {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed italic">"{report.report_text || 'Completed tactical directive as requested. Awaiting point verification.'}"</p>
                  
                  {report.status === 'Pending' && (
                    <div className="pt-4 mt-auto grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => handleVerify(report.id, 'Rejected')}
                        className="h-9 border-stone-200 text-red-600 hover:bg-red-50 rounded-none text-[9px] font-black uppercase tracking-widest"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => handleVerify(report.id, 'Verified')}
                        className="h-9 bg-[var(--brand-black)] text-white hover:bg-stone-800 rounded-none text-[9px] font-black uppercase tracking-widest shadow-lg shadow-black/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Verify
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 border-2 border-dashed border-stone-200 p-12 flex flex-col items-center justify-center text-stone-300">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Situational feed currently quiet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📝 New Directive Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl rounded-none border-stone-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight font-meta">Issue New Directive</CardTitle>
                  <CardDescription className="text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1">Deploy tactical objectives to the field.</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="h-8 w-8 p-0 rounded-none hover:bg-stone-200">
                  <XCircle className="w-5 h-5 text-stone-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Directive Title</label>
                    <input type="text" placeholder="e.g. Regional Flyer Blitz" className="w-full h-11 bg-stone-50 border-stone-200 text-xs font-bold px-4 focus:ring-1 focus:ring-black outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Target Level</label>
                    <select className="w-full h-11 bg-stone-50 border-stone-200 text-xs font-bold px-4 focus:ring-1 focus:ring-black outline-none">
                      <option>Regional</option>
                      <option>Chapter</option>
                      <option>Global</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Objective Description</label>
                  <textarea rows={3} placeholder="Describe the tactical goal..." className="w-full bg-stone-50 border-stone-200 text-xs font-bold p-4 focus:ring-1 focus:ring-black outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Points Awarded</label>
                    <input type="number" defaultValue={50} className="w-full h-11 bg-stone-50 border-stone-200 text-xs font-bold px-4 focus:ring-1 focus:ring-black outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400">Priority</label>
                    <select className="w-full h-11 bg-stone-50 border-stone-200 text-xs font-bold px-4 focus:ring-1 focus:ring-black outline-none">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-none border-stone-200 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50">
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1 h-12 rounded-none bg-[var(--brand-black)] text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-black/10">
                  <Send className="w-4 h-4 mr-2" /> Deploy Directive
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
