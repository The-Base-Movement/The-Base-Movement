import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Flag, 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Filter, 
  Send,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { FieldDirective, FieldReport } from '@/types/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function FieldDirectives() {
  const [directives, setDirectives] = useState<FieldDirective[]>([])
  const [reports, setReports] = useState<FieldReport[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newDirective, setNewDirective] = useState<Omit<FieldDirective, 'id' | 'status'>>({
    title: '',
    description: '',
    target_type: 'Regional',
    priority: 'Normal',
    points_awarded: 50,
    deadline: '',
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [directivesData, reportsData] = await Promise.all([
          adminService.getFieldDirectives(),
          adminService.getFieldReports(),
        ])
        setDirectives(directivesData)
        setReports(reportsData)
      } catch {
        toast.error('Tactical synchronization failed.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleIssueDirective = async () => {
    if (!newDirective.title || !newDirective.description) {
      toast.error('Title and objective description are required.')
      return
    }
    setIsSubmitting(true)
    const success = await adminService.createFieldDirective({ ...newDirective })
    if (success) {
      toast.success('Directive deployed to the field.')
      setIsCreating(false)
      setNewDirective({ title: '', description: '', target_type: 'Regional', priority: 'Normal', points_awarded: 50, deadline: '' })
      const updated = await adminService.getFieldDirectives()
      setDirectives(updated)
    } else {
      toast.error('Failed to deploy directive.')
    }
    setIsSubmitting(false)
  }

  const handleVerify = async (reportId: string, status: 'Verified' | 'Rejected') => {
    const success = await adminService.verifyFieldReport(reportId, status)
    if (success) {
      toast.success(`Report ${status.toLowerCase()} successfully.`)
      const updated = await adminService.getFieldReports()
      setReports(updated)
    } else {
      toast.error('Failed to update report status.')
    }
  }

  const activeDirectives = directives.filter(d => d.status === 'Active')
  const pendingReports = reports.filter(r => r.status === 'Pending')
  const verifiedReports = reports.filter(r => r.status === 'Verified')
  
  // Calculate total points earned by summing points_awarded of directives for each verified report
  const totalPointsEarned = verifiedReports.reduce((sum, report) => {
    const directive = directives.find(d => d.id === report.directive_id);
    return sum + (directive?.points_awarded || 0);
  }, 0);



  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center py-20 space-y-4">
        <Activity className="w-12 h-12 text-muted-foreground/20 animate-spin" />
        <p className="text-micro font-bold normal-case text-muted-foreground/40">Synchronizing tactical feed...</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Directives Header */}
      <div className="flex-columns items-center flex-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 m-0">
            <Flag className="w-8 h-8 text-on-surface" />
            Field directives
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-2 mb-0">Platform-wide deployment of tactical objectives and field verification protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-micro px-8 h-10 font-bold capitalize tracking-tight hover:bg-stone-100 transition-all active:scale-95"
            asChild
          >
            <Link to="/admin/mobilization-metrics">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Link>
          </Button>
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Issue Directive
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-12">
        <TacticalKPI 
          label="Field Objectives"
          value={activeDirectives.length}
          description="Active directives"
          trend={{ direction: 'neutral', value: 'Vault' }}
        />
        <TacticalKPI 
          label="Awaiting Review"
          value={pendingReports.length}
          description="Pending reports"
          trend={{ direction: pendingReports.length > 0 ? 'down' : 'neutral', value: 'Queue' }}
        />
        <TacticalKPI 
          label="Verified Actions"
          value={verifiedReports.length}
          description="Successful missions"
          trend={{ direction: 'up', value: 'Elite' }}
        />
        <TacticalKPI 
          label="Tactical Influence"
          value={totalPointsEarned.toLocaleString()}
          description="Points distributed"
          trend={{ direction: 'up', value: 'Pulse' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* 📋 Active Directives */}
        <div className="xl:col-span-1">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Active directives</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Operational field objectives</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40" onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {directives.length === 0 ? (
                <div className="px-6 py-20 text-center space-y-4">
                  <Flag className="w-12 h-12 text-muted-foreground/10 mx-auto" />
                  <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">No directives deployed</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[800px] overflow-y-auto custom-scrollbar">
                  {directives.map((d) => (
                    <div key={d.id} className="p-6 hover:bg-muted/30 transition-colors space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          <span className={cn(
                            "px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-md",
                            d.priority === 'Urgent' ? "bg-destructive/10 text-destructive border-destructive/20" :
                            d.priority === 'High' ? "bg-accent/10 text-accent border-accent/20" :
                            "bg-muted/10 text-muted-foreground/60 border-border/20"
                          )}>
                            {d.priority}
                          </span>
                          <span className="px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border border-border/20 bg-muted/10 text-muted-foreground/60 rounded-md">
                            {d.target_type}
                          </span>
                        </div>
                        <span className="text-micro font-bold text-accent">+{d.points_awarded} pts</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface m-0">{d.title}</h4>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2 font-medium">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/40 uppercase tracking-tighter pt-2">
                        <Clock className="w-3.5 h-3.5" />
                        {d.deadline ? new Date(d.deadline).toLocaleDateString() : 'Indefinite'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 📡 Situational Awareness Feed */}
        <div className="xl:col-span-2">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden h-full">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Situational awareness feed</CardTitle>
                <p className="text-micro font-bold text-muted-foreground/40 mt-1">Real-time field intelligence</p>
              </div>
              <Button variant="default" size="sm" className="h-8 text-micro font-bold px-4">
                <Filter className="w-3 h-3 mr-1.5" /> Filter
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <div className="px-6 py-20 text-center space-y-4">
                  <Activity className="w-12 h-12 text-muted-foreground/10 mx-auto" />
                  <p className="text-micro font-bold text-muted-foreground/40 uppercase tracking-widest">Feed is quiet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 max-h-[800px] overflow-y-auto custom-scrollbar">
                  {reports.map((report) => (
                    <div key={report.id} className="hover:bg-muted/30 transition-colors">
                      {report.media_url && (
                        <div className="aspect-[21/9] w-full bg-muted/10 relative overflow-hidden group">
                          <img 
                            src={report.media_url} 
                            alt="Field report" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          />
                          <div className="absolute top-4 left-4 flex gap-2">
                            <span className={cn(
                              "px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-md shadow-lg",
                              report.status === 'Verified' ? "bg-primary text-white border-transparent" :
                              report.status === 'Rejected' ? "bg-destructive text-white border-transparent" :
                              "bg-white/90 text-on-surface border-transparent"
                            )}>
                              {report.status}
                            </span>
                          </div>
                          {report.location_lat && (
                            <div className="absolute bottom-4 left-4 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md flex items-center gap-2 border border-white/10">
                              <Activity className="w-3 h-3 text-destructive" />
                              <span className="text-[8px] font-bold uppercase text-white/80">GPS Verified Signals</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm bg-muted/20 border border-border/40 flex items-center justify-center overflow-hidden">
                              <img src={`https://i.pravatar.cc/100?u=${report.member_id}`} alt="" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">Patriot #{report.member_id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                                {new Date(report.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!report.media_url && (
                            <span className={cn(
                              "px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest border rounded-md",
                              report.status === 'Verified' ? "bg-primary/10 text-primary border-primary/20" :
                              report.status === 'Rejected' ? "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-muted/10 text-muted-foreground/60 border-border/20"
                            )}>
                              {report.status}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-on-surface/80 leading-relaxed font-medium">
                          {report.report_text ? `"${report.report_text}"` : "No field notes provided."}
                        </p>

                        {report.status === 'Pending' && (
                          <div className="flex gap-3 pt-2">
                            <Button 
                              variant="default" 
                              className="flex-1 h-9 text-[10px] font-bold uppercase bg-transparent border-destructive/20 text-destructive hover:bg-destructive/10"
                              onClick={() => handleVerify(report.id, 'Rejected')}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-2" /> Reject
                            </Button>
                            <Button 
                              variant="primary" 
                              className="flex-1 h-9 text-[10px] font-bold uppercase shadow-md shadow-brand-green/20"
                              onClick={() => handleVerify(report.id, 'Verified')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Verify
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🚀 Issue Directive Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[600px] rounded-sm border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Flag className="w-5 h-5 text-destructive" />
              Issue new directive
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/80">
              Deploy tactical field objectives to the movement's national network.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-micro font-bold text-muted-foreground/40 uppercase">Directive title</label>
                <Input 
                  placeholder="e.g. Regional Flyer Blitz" 
                  value={newDirective.title}
                  onChange={e => setNewDirective({ ...newDirective, title: e.target.value })}
                  className="rounded-sm border-border/60 text-xs font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-micro font-bold text-muted-foreground/40 uppercase">Target level</label>
                <select 
                  className="w-full h-11 px-3 text-xs font-bold border border-border/60 rounded-sm focus:outline-none focus:border-on-surface bg-white"
                  value={newDirective.target_type}
                  onChange={e => setNewDirective({ ...newDirective, target_type: e.target.value as FieldDirective['target_type'] })}
                >
                  <option>Regional</option>
                  <option>Chapter</option>
                  <option>Global</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-micro font-bold text-muted-foreground/40 uppercase">Objective description</label>
              <Textarea 
                placeholder="Describe the tactical goal for field agents..."
                value={newDirective.description}
                onChange={e => setNewDirective({ ...newDirective, description: e.target.value })}
                className="rounded-sm border-border/60 text-xs font-bold min-h-[100px] resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-micro font-bold text-muted-foreground/40 uppercase">Priority</label>
                <select 
                  className="w-full h-11 px-3 text-xs font-bold border border-border/60 rounded-sm focus:outline-none focus:border-on-surface bg-white"
                  value={newDirective.priority}
                  onChange={e => setNewDirective({ ...newDirective, priority: e.target.value as FieldDirective['priority'] })}
                >
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-micro font-bold text-muted-foreground/40 uppercase">Points</label>
                <Input 
                  type="number"
                  value={newDirective.points_awarded}
                  onChange={e => setNewDirective({ ...newDirective, points_awarded: Number(e.target.value) })}
                  className="rounded-sm border-border/60 text-xs font-bold h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-micro font-bold text-muted-foreground/40 uppercase">Deadline</label>
                <Input 
                  type="date"
                  value={newDirective.deadline}
                  onChange={e => setNewDirective({ ...newDirective, deadline: e.target.value })}
                  className="rounded-sm border-border/60 text-xs font-bold h-11"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-4">
            <Button 
              variant="default" 
              className="flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all active:scale-95"
              onClick={() => setIsCreating(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              className="flex-1 h-12 text-micro font-bold capitalize tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95 bg-destructive hover:bg-destructive/90"
              onClick={handleIssueDirective}
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Deploying...' : 'Deploy Directive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
