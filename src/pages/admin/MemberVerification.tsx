import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  XCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  History,
  Lock,
  FileText,
  Loader2,
  Cpu,
  Fingerprint,
} from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'
import { adminService, type PendingVerification } from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm from '@/components/admin/RegistrationForm'
import type { RegistrationSubmission } from '@/components/admin/RegistrationForm'

// ── Types ──────────────────────────────────────────────────────────────────────
// PendingVerification type imported from adminService

const statusColor = (status: PendingVerification['status']) => {
  if (status === 'In Review')  return 'bg-accent/10 text-accent border-accent/20'
  if (status === 'Processing') return 'bg-muted/30 text-on-surface/80 border-border/60'
  if (status === 'Flagged')    return 'bg-destructive/10 text-destructive border-destructive/20'
  if (status === 'Approved')   return 'bg-primary/10 text-primary border-primary/20'
  if (status === 'Rejected')   return 'bg-destructive/20 text-destructive border-destructive/30'
  return ''
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function MemberVerification() {
  const [members, setMembers] = useState<PendingVerification[]>([])
  const [selectedMember, setSelectedMember] = useState<PendingVerification | null>(null)
  const [showRegForm, setShowRegForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PendingVerification['status'] | 'All'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPhotoFull, setShowPhotoFull] = useState(false)
  const [viewingVaultRecord, setViewingVaultRecord] = useState<PendingVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<{ confidence: number, matches: string[], flagged: boolean } | null>(null)

  useEffect(() => {
    async function loadVerifications() {
      setLoading(true)
      try {
        const data = await adminService.getPendingVerifications()
        setMembers(data)
      } finally {
        setLoading(false)
      }
    }
    loadVerifications()
  }, [])

  const PAGE_SIZE = 10

  const STATUS_OPTIONS: (PendingVerification['status'] | 'All')[] = [
    'All', 'In Review', 'Processing', 'Flagged', 'Approved', 'Rejected'
  ]

  const pendingCount = members.filter(m => m.status === 'In Review' || m.status === 'Processing').length

  // ── Handle new registration submitted via the wired form ──────────────────
  const handleNewRegistration = (data: RegistrationSubmission) => {
    const newMember: PendingVerification = {
      id: data.registrationNumber,
      name: data.fullName,
      region: data.region || data.country,
      constituency: data.constituency || data.chapter || '-',
      platform: data.platform,
      country: data.country,
      phone: `${data.countryCode} ${data.contactNumber}`,
      gender: data.gender,
      ageRange: data.ageRange,
      profession: data.profession,
      educationLevel: data.educationLevel,
      emergencyName: data.emergencyContactName,
      emergencyRelationship: data.emergencyRelationship,
      emergencyPhone: data.emergencyNumber,
      submitted: 'Just now',
      status: 'In Review',
      photoUrl: data.photoUrl,
    }
    setMembers(prev => [newMember, ...prev])
    setSelectedMember(newMember)
    setShowRegForm(false)
    setAiResult(null)
  }

  const handleAiScan = async () => {
    if (!selectedMember) return
    setAiAnalyzing(true)
    setAiResult(null)
    try {
      const result = await adminService.verifyMemberID(selectedMember.id)
      setAiResult(result)
      if (result.flagged) {
        toast.warning(`AI Alert: Low confidence score (${result.confidence}%). Please review carefully.`)
      } else {
        toast.success(`AI Scan Complete: High identity match confidence.`)
      }
    } catch (err) {
      console.error('[AI-ASSISTANT] Scan failed:', err)
      toast.error("AI Assistant unavailable.")
    } finally {
      setAiAnalyzing(false)
    }
  }

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const handleVerdict = async (approve: boolean) => {
    if (!selectedMember) return
    const newStatus: PendingVerification['status'] = approve ? 'Approved' : 'Rejected'
    
    // Optimistic UI
    setMembers(prev =>
      prev.map(m => m.id === selectedMember.id ? { ...m, status: newStatus } : m)
    )
    setSelectedMember(prev => prev ? { ...prev, status: newStatus } : null)
    
    try {
      await adminService.verifyMember(selectedMember.id, approve, undefined, selectedMember.chapter)
      toast.success(`Member "${selectedMember.name}" has been ${newStatus.toLowerCase()}.`)
    } catch (error) {
      console.error('[VERIFICATION] Action failed:', error)
      toast.error("Failed to update verification status.")
    }
  }

  const filtered = members
    .filter(m =>
      (statusFilter === 'All' || m.status === statusFilter) &&
      (
        (m.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.id?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.region?.toLowerCase() || '').includes(search.toLowerCase())
      )
    )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever the filter or search changes
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }
  const handleFilter = (val: PendingVerification['status'] | 'All') => { setStatusFilter(val); setCurrentPage(1) }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <ShieldCheck className="w-8 h-8 text-on-surface" />
            Member verification
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Review and approve new member registrations for movement security.</p>
        </div>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <div className="hidden md:flex px-4 py-2 bg-accent/5 border border-accent/20 items-center gap-2 rounded-sm shadow-sm">
              <AlertCircle className="w-4 h-4 text-accent" />
              <div className="text-right">
                <span className="text-micro font-bold text-accent tracking-tight block uppercase">Pending</span>
                <span className="text-sm font-bold text-on-surface tracking-tight">
                  {pendingCount} review{pendingCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => setShowRegForm(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-columns items-start" style={{ '--column-gap': '2rem' } as React.CSSProperties}>

        {/* ── Left: Pending List ──────────────────────────────────────────── */}
        <div className="min-w-0 flex-[2] flow" style={{ '--flow-space': '1.5rem' } as React.CSSProperties}>
          <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <Input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name, ID, region..."
                  className="pl-9 h-9 text-xs rounded-sm border-border/60 shadow-sm focus:ring-on-surface/20"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <select
                  value={statusFilter}
                  onChange={e => handleFilter(e.target.value as PendingVerification['status'] | 'All')}
                  className="h-9 pl-9 pr-8 text-micro font-bold rounded-sm border border-border/60 bg-white text-on-surface/80 focus:outline-none focus:border-on-surface appearance-none cursor-pointer transition-colors shadow-sm normal-case"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-on-surface animate-spin" />
                  <p className="text-micro font-bold text-muted-foreground/40 normal-case">Fetching member identity files...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground/40 text-xs font-bold normal-case">
                  No registrations match your search.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {paginated.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        'p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all',
                        selectedMember?.id === member.id
                          ? 'bg-on-surface text-white shadow-lg'
                          : 'hover:bg-muted/10'
                      )}
                      onClick={() => {
                        setSelectedMember(member)
                        setAiResult(null)
                      }}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 overflow-hidden flex items-center justify-center font-bold text-xs shadow-inner shrink-0 rounded-sm',
                          selectedMember?.id === member.id ? 'bg-white/10' : 'bg-muted/10'
                        )}>
                          {member.photoUrl
                            ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                            : <span className={selectedMember?.id === member.id ? 'text-white' : 'text-muted-foreground/40'}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                          }
                        </div>
                        <div>
                          <p className={cn(
                            'text-sm font-bold tracking-tight leading-none',
                            selectedMember?.id === member.id ? 'text-white' : 'text-on-surface'
                          )}>
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-micro font-bold tracking-tight opacity-60">{member.id}</span>
                            <span className="w-1 h-1 bg-current opacity-20 rounded-full" />
                            <span className="text-micro font-bold tracking-tight opacity-60">{member.submitted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Region + status */}
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-micro font-bold tracking-tight">{member.region}</p>
                          <p className="text-micro font-bold opacity-60 tracking-tight">{member.constituency}</p>
                        </div>
                        <div className={cn(
                          'px-3 py-1 text-micro font-bold tracking-tight border rounded',
                          selectedMember?.id === member.id
                            ? 'bg-white/10 text-white border-white/20'
                            : statusColor(member.status)
                        )}>
                          {member.status}
                        </div>
                        <ArrowRight className={cn(
                          'w-4 h-4 transition-transform',
                          selectedMember?.id === member.id ? 'translate-x-1 opacity-100' : 'opacity-20'
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Pagination bar */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border/10 bg-muted/5 flex items-center justify-between">
                <p className="text-micro font-bold tracking-tight text-muted-foreground/40">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-border/40 text-on-surface/80 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === safePage ? "primary" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-micro font-bold transition-all rounded-sm active:scale-95",
                        page === safePage
                          ? "shadow-sm shadow-brand-green/20"
                          : "border-border/40 text-on-surface/80 hover:bg-stone-50"
                      )}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-border/40 text-on-surface/80 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-sm"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right: Review Panel ─────────────────────────────────────────── */}
        <div className="flex-1">
          {selectedMember ? (
            <div className="flow sticky top-8" style={{ '--flow-space': '1rem' } as React.CSSProperties}>

              {/* Identity Card */}
              <Card className="rounded-sm border-on-surface bg-on-surface text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck className="w-32 h-32 rotate-12" />
                </div>

                <CardHeader className="p-6 border-b border-white/10 relative z-10">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white/60 tracking-tight">
                        Reviewing · {selectedMember.id}
                      </span>
                      <CardTitle className="text-xl font-bold tracking-tight mt-1 leading-tight">
                        {selectedMember.name}
                      </CardTitle>
                      <div className={cn(
                        'inline-flex mt-2 px-2 py-0.5 text-tiny font-bold tracking-tight border rounded',
                        selectedMember.status === 'Approved' && 'bg-primary/20 text-primary border-primary/30',
                        selectedMember.status === 'Rejected' && 'bg-destructive/20 text-destructive border-destructive/30',
                        (selectedMember.status === 'In Review' || selectedMember.status === 'Processing') && 'bg-accent/20 text-accent border-accent/30',
                        selectedMember.status === 'Flagged' && 'bg-destructive/20 text-destructive border-destructive/30',
                      )}>
                        {selectedMember.status}
                      </div>
                    </div>
                    {/* Photo */}
                    <button
                      className="w-14 h-16 bg-white/5 flex-shrink-0 overflow-hidden border border-white/10 hover:opacity-80 transition-opacity rounded-sm"
                      onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
                      title={selectedMember.photoUrl ? 'View photo' : 'No photo uploaded'}
                    >
                      {selectedMember.photoUrl
                        ? <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-xs text-white/60 font-bold italic">
                            No photo
                          </div>
                      }
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-5 relative z-10">
                  {/* Key fields grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Platform', value: selectedMember.platform },
                      { label: 'Country', value: selectedMember.country },
                      { label: 'Gender', value: selectedMember.gender },
                      { label: 'Age Range', value: selectedMember.ageRange },
                      { label: 'Region', value: selectedMember.region },
                      { label: 'Constituency', value: selectedMember.constituency },
                      { label: 'Profession', value: selectedMember.profession },
                      { label: 'Education', value: selectedMember.educationLevel },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-tiny font-bold text-white/60 tracking-tight">{label}</p>
                        <p className="text-sm font-bold tracking-tight text-white leading-tight">
                          {value || '-'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="border-t border-white/10 pt-4 space-y-1">
                    <p className="text-tiny font-bold text-white/60 tracking-tight">Phone</p>
                    <p className="text-sm font-bold text-white">{selectedMember.phone || '-'}</p>
                  </div>

                  {/* Emergency contact */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <p className="text-tiny font-bold text-white/60 tracking-tight mb-2">Emergency contact</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Name', value: selectedMember.emergencyName },
                        { label: 'Relation', value: selectedMember.emergencyRelationship },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-tiny font-bold text-white/40 tracking-tight">{label}</p>
                          <p className="text-sm font-bold tracking-tight text-white">{value || '-'}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-white mt-1">{selectedMember.emergencyPhone || '-'}</p>
                  </div>

                  {/* Verification checklist */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <h4 className="text-xs font-bold tracking-tight text-white/60">Verification steps</h4>
                    {[
                      { label: 'Form submitted', done: true },
                      { label: 'Photo uploaded', done: !!selectedMember.photoUrl },
                      { label: 'Regional chapter approval', done: selectedMember.status === 'Approved' },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-sm">
                        {done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 flex items-center justify-center shrink-0">
                              <div className="w-1 h-1 bg-muted-foreground/20" />
                            </div>
                        }
                        <span className={cn(
                          'text-xs font-bold tracking-tight',
                          done ? 'text-white' : 'text-muted-foreground/40'
                        )}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Assistant Section */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold tracking-tight text-white/60">Security assistant</h4>
                      {aiResult && (
                        <span className={cn(
                          "text-tiny font-bold px-1.5 py-0.5 tracking-tight rounded",
                          aiResult.flagged ? "bg-destructive text-white" : "bg-primary text-white"
                        )}>
                          {aiResult.confidence}% match
                        </span>
                      )}
                    </div>
                    
                    {!aiResult && !aiAnalyzing && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAiScan}
                        className="w-full h-11 text-white text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95"
                      >
                        <Cpu className="w-4 h-4 mr-2" /> Execute Identity Scan
                      </Button>
                    )}

                    {aiAnalyzing && (
                      <div className="p-4 bg-white/5 border border-white/10 flex flex-col items-center gap-3 animate-pulse rounded-sm">
                        <Fingerprint className="w-6 h-6 text-accent animate-bounce" />
                        <p className="text-xs font-bold text-muted-foreground/40 tracking-tight">Analyzing identity...</p>
                      </div>
                    )}

                    {aiResult && (
                      <div className={cn(
                        "p-4 border rounded-sm",
                        aiResult.flagged ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20"
                      )}>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.matches.map(m => (
                            <span key={m} className="text-tiny font-bold tracking-tight text-white/60 bg-white/5 px-2 py-1 rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-white/40 mt-3 italic tracking-tight">
                          * Neural scan of official records completed.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {(selectedMember.status === 'In Review' || selectedMember.status === 'Processing' || selectedMember.status === 'Flagged') && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleVerdict(false)}
                        className="h-11 transition-all text-micro font-bold tracking-tight rounded-sm active:scale-95 shadow-lg shadow-brand-red/20"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject Entry
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleVerdict(true)}
                        className="h-11 text-white text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.01] active:scale-95"
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> Approve Admission
                      </Button>
                    </div>
                  )}

                  {selectedMember.status === 'Approved' && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 text-primary text-micro font-bold tracking-tight rounded-sm">
                      <CheckCircle2 className="w-4 h-4" /> Member approved
                    </div>
                  )}

                  {selectedMember.status === 'Rejected' && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-micro font-bold tracking-tight rounded-sm">
                      <XCircle className="w-4 h-4" /> Registration rejected
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* View photo button (if available) */}
              {selectedMember.photoUrl && (
                <Card className="rounded-sm border-border/40 shadow-sm bg-white">
                  <CardContent className="p-4 space-y-2">
                    <Button
                      variant="gold"
                      className="w-full h-11 text-micro font-bold tracking-tight rounded-sm transition-all shadow-sm active:scale-95"
                      onClick={() => setShowPhotoFull(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> Inspect Biometric Data
                    </Button>
                    {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
                      <Button
                        variant="gold"
                        className="w-full h-11 text-micro font-bold tracking-tight rounded-sm transition-all shadow-sm active:scale-95"
                        onClick={() => setViewingVaultRecord(selectedMember)}
                      >
                        <Database className="w-4 h-4 mr-2" /> Open Audit Vault
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-border/40 rounded-sm flex flex-col items-center justify-center text-muted-foreground/40 gap-4 bg-white/50">
              <ShieldCheck className="w-12 h-12 opacity-20" />
              <p className="text-micro font-bold tracking-tight">Select a file to review</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Registration Form Modal ──────────────────────────────────────────── */}
      {showRegForm && (
        <div className="fixed inset-0 z-[100] bg-on-surface/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <RegistrationForm
            onClose={() => setShowRegForm(false)}
            onSuccess={() => setShowRegForm(false)}
            onSubmitData={handleNewRegistration}
          />
        </div>
      )}

      {/* ── Full-screen Photo Lightbox ───────────────────────────────────────── */}
      {showPhotoFull && selectedMember?.photoUrl && (
        <div
          className="fixed inset-0 z-[110] bg-on-surface/90 flex items-center justify-center p-8"
          onClick={() => setShowPhotoFull(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            onClick={() => setShowPhotoFull(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <img src={selectedMember.photoUrl}
              alt={selectedMember.name}
              className="max-h-[80vh] max-w-full object-contain shadow-2xl"
             decoding="async" loading="lazy" />
            <p className="text-white/60 text-micro font-bold tracking-tight">
              {selectedMember.name} · {selectedMember.id}
            </p>
            <button
              className="text-white/40 hover:text-white/80 transition-colors"
              onClick={() => setShowPhotoFull(false)}
            >
              <EyeOff className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Audit Vault Modal ────────────────────────────────────────────────── */}
      {viewingVaultRecord && (
        <div className="fixed inset-0 z-[120] bg-on-surface/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-4xl w-full rounded-sm border-0 shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-on-surface text-white p-8 border-b border-white/10 relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Lock className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/60 tracking-tight">
                      Secure vault record
                    </span>
                    <div className={cn(
                      "px-2 py-0.5 text-[8px] font-bold tracking-tight border border-white/20 rounded",
                      viewingVaultRecord.status === 'Approved' ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                    )}>
                      {viewingVaultRecord.status}
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold font-meta tracking-tighter leading-none pt-2">
                    {viewingVaultRecord.name}
                  </h2>
                  <p className="text-white/60 text-xs font-bold tracking-tight">
                    Permanent record ID: {viewingVaultRecord.id}
                  </p>
                </div>
                <button 
                  onClick={() => setViewingVaultRecord(null)}
                  className="p-2 hover:bg-white/10 text-white/60 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex-columns items-start" style={{ '--column-gap': '3rem' } as React.CSSProperties}>
                <div className="flex-[1.5] flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
                  <section>
                    <h3 className="text-xs font-bold tracking-tight text-on-surface/40 border-b border-border/40 pb-2 mb-4 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Identity metadata
                    </h3>
                    <div className="flex-columns items-start" style={{ '--column-gap': '2rem' } as React.CSSProperties}>
                      <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {[
                        { label: 'Full name', value: viewingVaultRecord.name },
                        { label: 'Platform', value: viewingVaultRecord.platform },
                        { label: 'Country', value: viewingVaultRecord.country },
                        { label: 'Region', value: viewingVaultRecord.region },
                        { label: 'Constituency', value: viewingVaultRecord.constituency },
                        { label: 'Profession', value: viewingVaultRecord.profession },
                        { label: 'Education', value: viewingVaultRecord.educationLevel },
                        { label: 'Gender', value: viewingVaultRecord.gender },
                        { label: 'Age range', value: viewingVaultRecord.ageRange },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-micro font-bold text-on-surface/60 tracking-tight">{f.label}</p>
                          <p className="text-sm font-bold tracking-tight text-on-surface">{f.value || '-'}</p>
                        </div>
                      ))}
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-bold tracking-tight text-on-surface/60 border-b border-border/40 pb-2 mb-4 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Audit history
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border-l-2 border-on-surface shadow-sm rounded-r-xl">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold tracking-tight text-on-surface">Registration submitted</p>
                          <span className="text-micro font-bold text-on-surface-muted">{viewingVaultRecord.submitted}</span>
                        </div>
                        <p className="text-xs text-on-surface-muted mt-1 tracking-tight">System generated entry upon form completion.</p>
                      </div>
                      {viewingVaultRecord.status === 'Approved' && (
                        <div className="p-4 bg-white border-l-2 border-primary shadow-sm rounded-r-xl">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold tracking-tight text-primary">Verification approved</p>
                            <span className="text-micro font-bold text-on-surface-muted">Just now</span>
                          </div>
                          <p className="text-xs text-on-surface-muted mt-1 tracking-tight">Administrator: National HQ</p>
                        </div>
                      )}
                      {viewingVaultRecord.status === 'Rejected' && (
                        <div className="p-4 bg-white border-l-2 border-destructive shadow-sm rounded-r-xl">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold tracking-tight text-destructive">Verification rejected</p>
                            <span className="text-micro font-bold text-on-surface-muted">Just now</span>
                          </div>
                          <p className="text-xs text-on-surface-muted mt-1 tracking-tight">Administrator: National HQ</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="flex-1 flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
                  <section>
                    <h3 className="text-xs font-bold tracking-tight text-muted-foreground/40 border-b border-border/40 pb-2 mb-4">
                      Captured credentials
                    </h3>
                    <div className="aspect-[3/4] bg-muted/30 overflow-hidden shadow-inner border border-border/60 relative group rounded-sm">
                      {viewingVaultRecord.photoUrl ? (
                        <img src={viewingVaultRecord.photoUrl} alt="Vault Record" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
                          <EyeOff className="w-8 h-8 opacity-20" />
                          <p className="text-tiny font-bold tracking-tight">No biometric data</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-on-surface/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Database className="text-white w-12 h-12 opacity-50" />
                      </div>
                    </div>
                  </section>
                  
                  <div className="p-6 bg-muted/30 border border-border/40 rounded-sm">
                    <p className="text-xs font-bold tracking-tight text-on-surface-muted mb-2 italic">Legal disclaimer</p>
                    <p className="text-sm text-on-surface-muted leading-relaxed font-medium italic">
                      This record is persistently stored in the movement's secure audit vault. Metadata cannot be altered after verification completion.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
