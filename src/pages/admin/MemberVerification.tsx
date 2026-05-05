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
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService, type PendingVerification } from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm from '@/components/admin/RegistrationForm'
import type { RegistrationSubmission } from '@/components/admin/RegistrationForm'

// ── Types ──────────────────────────────────────────────────────────────────────
// PendingVerification type imported from adminService

const statusColor = (status: PendingVerification['status']) => {
  if (status === 'In Review')  return 'bg-amber-500/10 text-amber-600 border-amber-200'
  if (status === 'Processing') return 'bg-stone-500/10 text-stone-700 border-stone-200'
  if (status === 'Flagged')    return 'bg-red-500/10 text-red-600 border-red-200'
  if (status === 'Approved')   return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  if (status === 'Rejected')   return 'bg-red-900/10 text-red-800 border-red-300'
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
      constituency: data.constituency || data.chapter || '—',
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
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase()) ||
        m.region.toLowerCase().includes(search.toLowerCase())
      )
    )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 whenever the filter or search changes
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }
  const handleFilter = (val: PendingVerification['status'] | 'All') => { setStatusFilter(val); setCurrentPage(1) }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-stone-900 tracking-tighter">
            Member verification
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">
            Review and approve new member registrations for movement security.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-100 flex items-center gap-2 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-600 normal-case">
                {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Button
            className="h-11 text-[10px] font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-xl shadow-md normal-case"
            onClick={() => setShowRegForm(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Register new member
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── Left: Pending List ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name, ID, region..."
                  className="pl-9 h-9 text-xs rounded-lg border-stone-200 shadow-sm"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => handleFilter(e.target.value as PendingVerification['status'] | 'All')}
                  className="h-9 pl-9 pr-8 text-[9px] font-bold rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:border-stone-400 appearance-none cursor-pointer transition-colors shadow-sm normal-case"
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
                  <Loader2 className="w-8 h-8 text-stone-900 animate-spin" />
                  <p className="text-[10px] font-bold text-stone-400 normal-case">Fetching identity files...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-bold normal-case">
                  No registrations match your search.
                </div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {paginated.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        'p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all',
                        selectedMember?.id === member.id
                          ? 'bg-stone-900 text-white shadow-lg'
                          : 'hover:bg-stone-50'
                      )}
                      onClick={() => {
                        setSelectedMember(member)
                        setAiResult(null)
                      }}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 overflow-hidden flex items-center justify-center font-bold text-xs shadow-inner shrink-0 rounded-lg',
                          selectedMember?.id === member.id ? 'bg-white/10' : 'bg-stone-100'
                        )}>
                          {member.photoUrl
                            ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                            : <span className={selectedMember?.id === member.id ? 'text-white' : 'text-stone-400'}>
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </span>
                          }
                        </div>
                        <div>
                          <p className={cn(
                            'text-sm font-bold tracking-tight leading-none',
                            selectedMember?.id === member.id ? 'text-white' : 'text-stone-900'
                          )}>
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold tracking-wider opacity-60">{member.id}</span>
                            <span className="w-1 h-1 bg-current opacity-20 rounded-full" />
                            <span className="text-[9px] font-bold tracking-wider opacity-60">{member.submitted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Region + status */}
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold tracking-tight">{member.region}</p>
                          <p className="text-[9px] font-bold opacity-60 tracking-wider">{member.constituency}</p>
                        </div>
                        <div className={cn(
                          'px-3 py-1 text-[9px] font-bold tracking-wider border rounded',
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
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between">
                <p className="text-[9px] font-bold tracking-wider text-stone-400">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center border text-[9px] font-bold transition-all rounded-lg ${
                        page === safePage
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'border-stone-200 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-stone-900 hover:text-white hover:border-stone-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right: Review Panel ─────────────────────────────────────────── */}
        <div className="xl:col-span-1">
          {selectedMember ? (
            <div className="space-y-4 sticky top-8">

              {/* Identity Card */}
              <Card className="rounded-xl border-stone-900 bg-stone-900 text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck className="w-32 h-32 rotate-12" />
                </div>

                <CardHeader className="p-6 border-b border-white/10 relative z-10">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold text-stone-500 tracking-wider">
                        Reviewing · {selectedMember.id}
                      </span>
                      <CardTitle className="text-xl font-bold tracking-tight mt-1 leading-tight">
                        {selectedMember.name}
                      </CardTitle>
                      <div className={cn(
                        'inline-flex mt-2 px-2 py-0.5 text-[8px] font-bold tracking-wider border rounded',
                        selectedMember.status === 'Approved' && 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30',
                        selectedMember.status === 'Rejected' && 'bg-red-500/20 text-red-400 border-red-400/30',
                        (selectedMember.status === 'In Review' || selectedMember.status === 'Processing') && 'bg-amber-500/20 text-amber-400 border-amber-400/30',
                        selectedMember.status === 'Flagged' && 'bg-red-500/20 text-red-400 border-red-400/30',
                      )}>
                        {selectedMember.status}
                      </div>
                    </div>
                    {/* Photo */}
                    <button
                      className="w-14 h-16 bg-stone-800 flex-shrink-0 overflow-hidden border border-white/10 hover:opacity-80 transition-opacity rounded-lg"
                      onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
                      title={selectedMember.photoUrl ? 'View photo' : 'No photo uploaded'}
                    >
                      {selectedMember.photoUrl
                        ? <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-500 font-bold italic">
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
                        <p className="text-[8px] font-bold text-stone-500 tracking-wider">{label}</p>
                        <p className="text-[10px] font-bold tracking-tight text-white leading-tight">
                          {value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="border-t border-white/10 pt-4 space-y-1">
                    <p className="text-[8px] font-bold text-stone-500 tracking-wider">Phone</p>
                    <p className="text-[10px] font-bold text-white">{selectedMember.phone || '—'}</p>
                  </div>

                  {/* Emergency contact */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <p className="text-[8px] font-bold text-stone-500 tracking-wider mb-2">Emergency contact</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Name', value: selectedMember.emergencyName },
                        { label: 'Relation', value: selectedMember.emergencyRelationship },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-[8px] font-bold text-stone-500 tracking-wider">{label}</p>
                          <p className="text-[10px] font-bold tracking-tight text-white">{value || '—'}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-white mt-1">{selectedMember.emergencyPhone || '—'}</p>
                  </div>

                  {/* Verification checklist */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <h4 className="text-[9px] font-bold tracking-wider text-stone-500">Verification steps</h4>
                    {[
                      { label: 'Form submitted', done: true },
                      { label: 'Photo uploaded', done: !!selectedMember.photoUrl },
                      { label: 'Regional chapter approval', done: selectedMember.status === 'Approved' },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-lg">
                        {done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-stone-600 flex items-center justify-center shrink-0">
                              <div className="w-1 h-1 bg-stone-600" />
                            </div>
                        }
                        <span className={cn(
                          'text-[9px] font-bold tracking-tight',
                          done ? 'text-white' : 'text-stone-500'
                        )}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Assistant Section */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[9px] font-bold tracking-wider text-stone-500">Security assistant</h4>
                      {aiResult && (
                        <span className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 tracking-wider rounded",
                          aiResult.flagged ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {aiResult.confidence}% match
                        </span>
                      )}
                    </div>
                    
                    {!aiResult && !aiAnalyzing && (
                      <Button
                        variant="ghost"
                        onClick={handleAiScan}
                        className="w-full h-11 border border-white/10 bg-white/5 text-white hover:bg-white/10 text-[9px] font-bold tracking-wider rounded-xl"
                      >
                        <Cpu className="w-4 h-4 mr-2" /> Verify identity
                      </Button>
                    )}

                    {aiAnalyzing && (
                      <div className="p-4 bg-white/5 border border-white/10 flex flex-col items-center gap-3 animate-pulse rounded-xl">
                        <Fingerprint className="w-6 h-6 text-amber-500 animate-bounce" />
                        <p className="text-[9px] font-bold text-stone-400 tracking-wider">Analyzing identity...</p>
                      </div>
                    )}

                    {aiResult && (
                      <div className={cn(
                        "p-4 border rounded-xl",
                        aiResult.flagged ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                      )}>
                        <div className="flex flex-wrap gap-2">
                          {aiResult.matches.map(m => (
                            <span key={m} className="text-[8px] font-bold tracking-wider text-white/60 bg-white/5 px-2 py-1 rounded">
                              {m}
                            </span>
                          ))}
                        </div>
                        <p className="text-[9px] text-white/40 mt-3 italic tracking-tight">
                          * Neural scan of official records completed.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {(selectedMember.status === 'In Review' || selectedMember.status === 'Processing' || selectedMember.status === 'Flagged') && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        onClick={() => handleVerdict(false)}
                        className="h-11 bg-red-600 text-white hover:bg-red-700 transition-all text-[9px] font-bold tracking-wider border-0 rounded-xl"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                      <Button
                        onClick={() => handleVerdict(true)}
                        className="h-11 bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-[9px] font-bold tracking-wider rounded-xl"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
                      </Button>
                    </div>
                  )}

                  {selectedMember.status === 'Approved' && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider rounded-xl">
                      <CheckCircle2 className="w-4 h-4" /> Member approved
                    </div>
                  )}

                  {selectedMember.status === 'Rejected' && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-wider rounded-xl">
                      <XCircle className="w-4 h-4" /> Registration rejected
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* View photo button (if available) */}
              {selectedMember.photoUrl && (
                <Card className="rounded-xl border-stone-200 shadow-sm bg-white">
                  <CardContent className="p-4 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full h-10 text-[10px] font-bold tracking-wider text-stone-400 hover:text-stone-900 rounded-lg"
                      onClick={() => setShowPhotoFull(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View full photo
                    </Button>
                    {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
                      <Button
                        variant="ghost"
                        className="w-full h-10 text-[10px] font-bold tracking-wider text-stone-500 hover:bg-stone-50 rounded-lg"
                        onClick={() => setViewingVaultRecord(selectedMember)}
                      >
                        <Database className="w-4 h-4 mr-2" /> View audit record
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-300 gap-4 bg-white/50">
              <ShieldCheck className="w-12 h-12 opacity-20" />
              <p className="text-[10px] font-bold tracking-wider">Select a file to review</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Registration Form Modal ──────────────────────────────────────────── */}
      {showRegForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
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
          className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-8"
          onClick={() => setShowPhotoFull(false)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            onClick={() => setShowPhotoFull(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <img
              src={selectedMember.photoUrl}
              alt={selectedMember.name}
              className="max-h-[80vh] max-w-full object-contain shadow-2xl"
            />
            <p className="text-white/60 text-[10px] font-bold tracking-wider">
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
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <Card className="max-w-4xl w-full rounded-xl border-0 shadow-2xl overflow-hidden bg-stone-50">
            <CardHeader className="bg-[var(--brand-black)] text-white p-8 border-b border-white/10 relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Lock className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-stone-400 tracking-wider">
                      Secure vault record
                    </span>
                    <div className={cn(
                      "px-2 py-0.5 text-[8px] font-bold tracking-wider border border-white/20 rounded",
                      viewingVaultRecord.status === 'Approved' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {viewingVaultRecord.status}
                    </div>
                  </div>
                  <h2 className="text-3xl font-black font-meta tracking-tighter leading-none pt-2">
                    {viewingVaultRecord.name}
                  </h2>
                  <p className="text-stone-400 text-xs font-bold tracking-wider">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] font-bold tracking-wider text-stone-400 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Identity metadata
                    </h3>
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
                          <p className="text-[8px] font-bold text-stone-400 tracking-wider">{f.label}</p>
                          <p className="text-[11px] font-bold tracking-tight text-stone-900">{f.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-bold tracking-wider text-stone-400 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Audit history
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border-l-2 border-stone-900 shadow-sm rounded-r-xl">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-bold tracking-tight text-stone-900">Registration submitted</p>
                          <span className="text-[8px] font-bold text-stone-400">{viewingVaultRecord.submitted}</span>
                        </div>
                        <p className="text-[9px] text-stone-500 mt-1 tracking-tight">System generated entry upon form completion.</p>
                      </div>
                      {viewingVaultRecord.status === 'Approved' && (
                        <div className="p-4 bg-white border-l-2 border-emerald-500 shadow-sm rounded-r-xl">
                          <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold tracking-tight text-emerald-600">Verification approved</p>
                            <span className="text-[8px] font-bold text-stone-400">Just now</span>
                          </div>
                          <p className="text-[9px] text-stone-500 mt-1 tracking-tight">Administrator: National HQ</p>
                        </div>
                      )}
                      {viewingVaultRecord.status === 'Rejected' && (
                        <div className="p-4 bg-white border-l-2 border-red-500 shadow-sm rounded-r-xl">
                          <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold tracking-tight text-red-600">Verification rejected</p>
                            <span className="text-[8px] font-bold text-stone-400">Just now</span>
                          </div>
                          <p className="text-[9px] text-stone-500 mt-1 tracking-tight">Administrator: National HQ</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] font-bold tracking-wider text-stone-400 border-b border-stone-200 pb-2 mb-4">
                      Captured credentials
                    </h3>
                    <div className="aspect-[3/4] bg-stone-200 overflow-hidden shadow-inner border border-stone-300 relative group rounded-xl">
                      {viewingVaultRecord.photoUrl ? (
                        <img src={viewingVaultRecord.photoUrl} alt="Vault Record" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-2">
                          <EyeOff className="w-8 h-8 opacity-20" />
                          <p className="text-[9px] font-bold tracking-wider">No biometric data</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Database className="text-white w-12 h-12 opacity-50" />
                      </div>
                    </div>
                  </section>
                  
                  <div className="p-6 bg-stone-100 border border-stone-200 rounded-xl">
                    <p className="text-[9px] font-bold tracking-wider text-stone-500 mb-2 italic">Legal disclaimer</p>
                    <p className="text-[10px] text-stone-600 leading-relaxed font-medium italic">
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
