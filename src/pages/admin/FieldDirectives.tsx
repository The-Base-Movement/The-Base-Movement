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
import { Button } from '@/components/ui/neon-button'
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
        <Target className="w-12 h-12 text-muted-foreground/20 animate-spin mb-4" />
        <p className="text-[10px] font-bold text-muted-foreground/40">Establishing tactical feed...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🎯 Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-on-surface" />
            Field directives
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Deploying decentralized tactical objectives across the movement.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="default" className="rounded-sm border-border/60 text-on-surface/60 text-[10px] px-6 font-bold hover:bg-muted/5 shadow-sm h-10 transition-all flex items-center gap-2">
            <BarChart className="w-3.5 h-3.5" /> Tactical analytics
          </Button>
          <Button 
            onClick={() => setIsCreating(true)}
            className="rounded-sm bg-on-surface text-white text-[10px] px-6 font-bold hover:bg-on-surface/90 shadow-sm h-10 transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Issue new directive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📋 Directive List */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-destructive" /> Active directives
          </h2>
          
          <div className="space-y-4">
            {directives.length > 0 ? directives.map((directive) => (
              <Card key={directive.id} className="rounded-sm border-border/60 shadow-sm hover:border-on-surface transition-colors group">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full",
                      directive.priority === 'Urgent' ? "bg-destructive/10 text-destructive border-destructive/20" :
                      directive.priority === 'High' ? "bg-accent/10 text-accent border-accent/20" :
                      "bg-muted/10 text-on-surface/60 border-border/10"
                    )}>
                      {directive.priority.toLowerCase()} priority
                    </span>
                    <span className="text-[9px] font-bold normal-case text-muted-foreground/40">{directive.target_type.toLowerCase()}</span>
                  </div>
                  <CardTitle className="text-base font-bold tracking-tight text-on-surface leading-tight">
                    {directive.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-4">
                  <p className="text-xs text-muted-foreground/80 line-clamp-2">{directive.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/10">
                    <div className="flex items-center gap-1.5 text-muted-foreground/40">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold normal-case">{directive.deadline ? new Date(directive.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{directive.points_awarded} pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="border-2 border-dashed border-border/40 p-12 text-center text-muted-foreground/20 rounded-sm">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-bold normal-case">No active directives.</p>
              </div>
            )}
          </div>
        </div>

        {/* 📡 Situational Feed (Reports) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-destructive" /> Situational awareness feed
            </h2>
            <Button variant="ghost" className="h-8 text-[9px] font-bold hover:bg-muted/5 rounded-lg">
              <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter feed
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.length > 0 ? reports.map((report) => (
              <Card key={report.id} className="rounded-sm border-border/60 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-video bg-muted/10 relative group overflow-hidden">
                  {report.media_url ? (
                    <img src={report.media_url} alt="Field verification" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"  decoding="async" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/20">
                      <Camera className="w-8 h-8 mb-2 opacity-20" />
                      <span className="text-[8px] font-bold normal-case">No media verification</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <div className={cn(
                      "px-2 py-1 text-[8px] font-bold normal-case shadow-xl border rounded-full",
                      report.status === 'Verified' ? "bg-primary text-white border-primary/20" :
                      report.status === 'Rejected' ? "bg-destructive text-white border-destructive/20" :
                      "bg-white/90 text-on-surface border-white"
                    )}>
                      {report.status.toLowerCase()}
                    </div>
                  </div>
                  {report.location_lat && (
                    <div className="absolute bottom-4 left-4">
                      <div className="px-2 py-1 bg-on-surface/60 backdrop-blur-md text-white text-[8px] font-bold normal-case flex items-center gap-1.5 rounded-full border border-white/10">
                        <MapPin className="w-2.5 h-2.5 text-destructive" /> Verified location
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center overflow-hidden border border-border/10">
                        <img src={`https://i.pravatar.cc/100?u=${report.member_id}`} alt="Patriot" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold normal-case tracking-tight leading-none mb-1">Patriot #{report.member_id.slice(0, 5)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground/40 normal-case">{new Date(report.created_at).toLocaleTimeString()} - {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface/80 leading-relaxed">"{report.report_text || 'Completed tactical directive as requested. Awaiting point verification.'}"</p>
                  
                  {report.status === 'Pending' && (
                    <div className="pt-4 mt-auto grid grid-cols-2 gap-3">
                      <Button 
                        variant="default" 
                        onClick={() => handleVerify(report.id, 'Rejected')}
                        className="h-9 border-border/60 text-destructive hover:bg-destructive/5 rounded-lg text-[9px] font-bold normal-case shadow-sm"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                      <Button 
                        variant="solid" 
                        onClick={() => handleVerify(report.id, 'Verified')}
                        className="h-9 bg-on-surface text-white hover:bg-on-surface/90 rounded-lg text-[9px] font-bold shadow-xl"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Verify
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 border-2 border-dashed border-border/40 p-12 flex flex-col items-center justify-center text-muted-foreground/20 rounded-sm">
                <AlertTriangle className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-[10px] font-bold normal-case">Situational feed currently quiet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📝 New Directive Modal */}
      {isCreating && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl rounded-sm border-border/60 shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold normal-case font-meta">Issue new directive</CardTitle>
                  <CardDescription className="text-muted-foreground/80 text-[10px] font-bold normal-case mt-1">Deploy tactical objectives to the field.</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="h-8 w-8 p-0 rounded-lg hover:bg-muted/10">
                  <XCircle className="w-5 h-5 text-muted-foreground/40" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold normal-case text-muted-foreground/40">Directive title</label>
                    <input type="text" placeholder="e.g. Regional Flyer Blitz" className="w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold normal-case text-muted-foreground/40">Target level</label>
                    <select className="w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-lg">
                      <option>Regional</option>
                      <option>Chapter</option>
                      <option>Global</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold normal-case text-muted-foreground/40">Objective description</label>
                  <textarea rows={3} placeholder="Describe the tactical goal..." className="w-full bg-muted/5 border-border/60 text-xs font-bold p-4 focus:ring-1 focus:ring-on-surface outline-none resize-none rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold normal-case text-muted-foreground/40">Points awarded</label>
                    <input type="number" defaultValue={50} className="w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold normal-case text-muted-foreground/40">Priority</label>
                    <select className="w-full h-11 bg-muted/5 border-border/60 text-xs font-bold px-4 focus:ring-1 focus:ring-on-surface outline-none rounded-lg">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button variant="default" onClick={() => setIsCreating(false)} className="flex-1 h-12 rounded-lg border-border/60 font-bold text-[10px] normal-case shadow-sm hover:bg-muted/5">
                  Cancel
                </Button>
                <Button variant="solid" className="flex-1 h-12 rounded-lg bg-on-surface text-white font-bold text-[10px] normal-case shadow-xl hover:scale-105 transition-transform">
                  <Send className="w-4 h-4 mr-2" /> Deploy directive
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
