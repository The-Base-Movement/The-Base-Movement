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
  FileText
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { ChapterApplication } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function LeadershipHub() {
  const [applications, setApplications] = useState<ChapterApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  const fetchApplications = useCallback(async () => {
    setIsLoading(true)
    const data = await adminService.getChapterApplications()
    setApplications(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  const handleApprove = async (appId: string, name: string) => {
    const success = await adminService.approveChapterApplication(appId, 'Approved by SuperAdmin via Command Center')
    if (success) {
      toast({
        title: "LEADERSHIP PROMOTED",
        description: `${name} has been officially appointed as Chapter Leader.`,
      })
      fetchApplications()
    } else {
      toast({
        title: "PROMOTION FAILED",
        description: "An error occurred during the leadership transition.",
        variant: "destructive"
      })
    }
  }

  const filteredApps = applications.filter(app => 
    app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.proposed_chapter_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter leading-none">Leadership Hub</h1>
          <p className="text-stone-500 text-sm mt-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-gold)]" />
            Managing the movement's grassroots leadership pipeline.
          </p>
        </div>
      </div>

      {/* Intelligence & Filtering */}
      <div className="bg-white border border-stone-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search applications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-stone-50 border-none text-[10px] font-bold uppercase tracking-tight placeholder:text-stone-400 focus:ring-1 focus:ring-[var(--brand-gold)] transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 px-4 text-[10px] font-black uppercase tracking-widest border-stone-200">
            <Filter className="w-3.5 h-3.5 mr-2" /> Filter Status
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-gold)]" />
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Pending Requests</p>
            <h3 className="text-3xl font-black font-meta text-[var(--brand-black)] mt-1">
              {applications.filter(a => a.status === 'Pending').length}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-green)]" />
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">New Leaders Appointed</p>
            <h3 className="text-3xl font-black font-meta text-[var(--brand-black)] mt-1">
              {applications.filter(a => a.status === 'Approved').length}
            </h3>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--brand-red)]" />
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Growth Rate</p>
            <h3 className="text-3xl font-black font-meta text-[var(--brand-black)] mt-1">+12%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black font-meta uppercase tracking-tight">Active Applications</CardTitle>
              <CardDescription className="text-xs">Review and approve new Chapter Leaders.</CardDescription>
            </div>
            <Button variant="ghost" onClick={fetchApplications} className="h-8 w-8 p-0 rounded-none hover:bg-stone-100">
              <Clock className="w-4 h-4 text-stone-400" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Applicant</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Proposed Chapter</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Geography</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400">Status</th>
                  <th className="p-6 text-[9px] font-black uppercase tracking-widest text-stone-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-6"><div className="h-12 bg-stone-50 w-full" /></td>
                    </tr>
                  ))
                ) : filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <FileText className="w-12 h-12 text-stone-100 mx-auto mb-4" />
                      <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">No leadership applications found</p>
                    </td>
                  </tr>
                ) : filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center font-black text-[10px] uppercase">
                          {app.applicant_name?.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-stone-900 uppercase tracking-tight">{app.applicant_name}</p>
                          <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Patriot ID: {app.applicant_id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-[var(--brand-gold)]" />
                        <span className="text-[10px] font-black text-stone-900 uppercase tracking-tight">{app.proposed_chapter_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-tight">{app.region}</span>
                        </div>
                        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest ml-4">{app.constituency}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={cn("px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border", 
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        app.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-rose-50 text-rose-600 border-rose-100'
                      )}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      {app.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-none"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                          </Button>
                          <Button 
                            onClick={() => handleApprove(app.id, app.applicant_name || 'Applicant')}
                            className="h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800 rounded-none"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[var(--brand-gold)]" /> Approve
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" className="h-8 text-stone-400 text-[9px] font-black uppercase tracking-widest pointer-events-none">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredApps.filter(a => a.status === 'Pending').slice(0, 2).map(app => (
            <Card key={`detail-${app.id}`} className="rounded-none border-stone-200 shadow-sm bg-stone-50/30">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Applicant Vision Statement</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <blockquote className="border-l-2 border-[var(--brand-gold)] pl-4 py-1 italic text-stone-600 text-sm leading-relaxed mb-6 font-serif">
                  "{app.vision_statement}"
                </blockquote>
                <div className="bg-white border border-stone-100 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Experience Summary</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{app.experience_summary}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
