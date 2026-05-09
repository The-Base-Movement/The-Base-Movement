import { useState, useEffect, useCallback } from 'react'
import { 
  ShieldCheck, 
  UserCheck, 
  MapPin, 
  Clock, 
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
} from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function LeadershipHub() {
  const [applications, setApplications] = useState<ChapterApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const fetchApplications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    const data = await adminService.getChapterApplications()
    setApplications(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      const data = await adminService.getChapterApplications()
      if (isMounted) {
        setApplications(data)
        setIsLoading(false)
      }
    }
    init()
    return () => { isMounted = false }
  }, [])

  const handleApprove = async (appId: string, name: string) => {
    const success = await adminService.approveChapterApplication(appId, 'Approved by SuperAdmin via Command Center')
    if (success) {
      toast({
        title: "Leadership promoted",
        description: `${name} has been officially appointed as Chapter Leader.`,
      })
      fetchApplications()
    } else {
      toast({
        title: "Promotion failed",
        description: "An error occurred during the leadership transition.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const report = await adminService.generateComplianceReport()
      const blob = new Blob([report], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `THE-BASE-COMPLIANCE-REPORT-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Report generated",
        description: "Compliance audit manifest has been downloaded.",
      })
    } catch (err) {
      console.error('[AUDIT] Report generation failed:', err)
      toast({
        title: "Generation failed",
        description: "Could not compile movement audit data.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const filteredApps = applications.filter(app => 
    app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <ShieldCheck className="w-8 h-8 text-on-surface" />
            Leadership hub
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Managing the administrative pipeline for local leadership applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isGenerating ? (
              <Clock className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Compiling Audit...' : 'Export Audit Manifest'}
          </Button>
        </div>
      </div>

      {/* Intelligence & Filtering */}
      <div className="bg-white border border-border/60 p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input 
            type="text" 
            placeholder="Search applications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-muted/5 border-none text-tiny font-bold placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-border/40 rounded-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            className="h-11 px-8 text-micro font-bold tracking-tight border-border/40 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95"
          >
            <Filter className="w-4 h-4 mr-2 text-muted-foreground/40" /> Filter Status
          </Button>
        </div>
      </div>

      {/* Stats Summary - Balanced Grid */}
      <div className="grid-stats mb-10" style={{ '--grid-min-width': '240px' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
          <CardContent className="p-6">
            <p className="text-micro font-bold text-muted-foreground/40 normal-case tracking-tight">Growth rate</p>
            <h3 className="text-3xl font-bold font-meta text-on-surface mt-1">+12%</h3>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
          <CardContent className="p-6">
            <p className="text-micro font-bold text-muted-foreground/40 normal-case tracking-tight">Pending requests</p>
            <h3 className="text-3xl font-bold font-meta text-on-surface mt-1">
              {applications.filter(a => a.status === 'Pending').length}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm relative overflow-hidden bg-white">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-6">
            <p className="text-micro font-bold text-muted-foreground/40 normal-case tracking-tight">New leaders appointed</p>
            <h3 className="text-3xl font-bold font-meta text-on-surface mt-1">
              {applications.filter(a => a.status === 'Approved').length}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="rounded-none border-border/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold font-meta normal-case">Active applications</CardTitle>
              <CardDescription className="text-xs">Review and approve new Chapter Leaders.</CardDescription>
            </div>
            <Button 
              variant="default" 
              onClick={() => fetchApplications()} 
              className="h-11 w-11 p-0 rounded-sm hover:bg-stone-50 border-border/40 text-muted-foreground/40 hover:text-on-surface transition-all shadow-sm active:scale-95"
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border/40">
                  <th className="p-6 text-micro font-bold text-muted-foreground/40 normal-case">Applicant</th>
                  <th className="p-6 text-micro font-bold text-muted-foreground/40 normal-case">Proposed chapter</th>
                  <th className="p-6 text-micro font-bold text-muted-foreground/40 normal-case">Geography</th>
                  <th className="p-6 text-micro font-bold text-muted-foreground/40 normal-case">Status</th>
                  <th className="p-6 text-micro font-bold text-on-surface normal-case">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-6"><div className="h-12 bg-muted/5 w-full" /></td>
                    </tr>
                  ))
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <FileText className="w-12 h-12 text-border/40 mx-auto mb-4" />
                      <p className="text-muted-foreground/40 text-micro font-bold normal-case">No leadership applications found</p>
                    </td>
                  </tr>
                ) : filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-border/40 flex items-center justify-center font-bold text-micro normal-case rounded-sm">
                          {app.applicant_name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-tiny font-bold text-on-surface normal-case">{app.applicant_name}</p>
                          <p className="text-micro text-muted-foreground/40 font-bold normal-case mt-0.5">Member ID: {app.applicant_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-accent" />
                        <span className="text-micro font-bold text-on-surface normal-case">{app.proposed_chapter_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground/40" />
                          <span className="text-micro font-bold text-on-surface/80 normal-case">{app.region}</span>
                        </div>
                        <p className="text-micro text-muted-foreground/40 font-bold normal-case ml-4">{app.constituency}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={cn("px-2 py-0.5 text-[8px] font-bold normal-case border rounded-full", 
                        app.status === 'Approved' ? 'bg-primary/10 text-primary border-primary/20' : 
                        app.status === 'Pending' ? 'bg-accent/10 text-accent border-accent/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {app.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="destructive" 
                            className="h-11 px-8 text-micro font-bold tracking-tight transition-all shadow-sm rounded-sm active:scale-95 shadow-lg shadow-brand-red/20"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Reject Application
                          </Button>
                          <Button 
                            variant="primary"
                            onClick={() => handleApprove(app.id, app.applicant_name || 'Applicant')}
                            className="h-11 px-10 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2 text-accent" /> Appoint Leader
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" className="h-8 text-muted-foreground/40 text-micro font-bold normal-case pointer-events-none rounded-sm">
                          Processed <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Vision & Strategy Modal (Simplified here as cards) */}
      {filteredApps.some(a => a.status === 'Pending') && (
        <div className="flex-columns items-stretch" style={{ '--column-gap': '2rem' } as React.CSSProperties}>
          {filteredApps.filter(a => a.status === 'Pending').slice(0, 2).map(app => (
            <Card key={`detail-${app.id}`} className="rounded-sm border-border/60 shadow-sm bg-muted/30 overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-micro font-bold normal-case text-muted-foreground/40">Applicant vision statement</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <blockquote className="border-l-2 border-accent pl-4 py-1 italic text-on-surface/80 text-sm leading-relaxed mb-6 font-body-md">
                  "{app.vision_statement}"
                </blockquote>
                <div className="bg-white border border-border/40 p-4 rounded-sm">
                  <p className="text-micro font-bold normal-case text-muted-foreground/40 mb-2">Experience summary</p>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed prose-standard">{app.experience_summary}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
