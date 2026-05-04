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
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">
            Identity Verification
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Review and approve new member registrations for movement security.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                {pendingCount} Pending Review{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <Button
            variant="primary"
            className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]"
            onClick={() => setShowRegForm(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Register New Member
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* ── Left: Pending List ──────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search by name, ID, region..."
                  className="pl-9 h-9 text-xs rounded-none border-stone-200"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={e => handleFilter(e.target.value as PendingVerification['status'] | 'All')}
                  className="h-9 pl-9 pr-8 text-[9px] font-black uppercase tracking-widest rounded-none border border-stone-200 bg-white text-stone-700 focus:outline-none focus:border-[var(--brand-black)] appearance-none cursor-pointer transition-colors"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-[var(--brand-green)] animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Fetching Identity Files...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
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
                          ? 'bg-[var(--brand-black)] text-white'
                          : 'hover:bg-stone-50'
                      )}
                      onClick={() => setSelectedMember(member)}
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 overflow-hidden flex items-center justify-center font-bold text-xs shadow-inner shrink-0',
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
                            'text-sm font-black uppercase tracking-tight leading-none',
                            selectedMember?.id === member.id ? 'text-white' : 'text-[var(--brand-black)]'
                          )}>
                            {member.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{member.id}</span>
                            <span className="w-1 h-1 bg-current opacity-20 rounded-full" />
                            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{member.submitted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Region + status */}
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black uppercase tracking-tight">{member.region}</p>
                          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{member.constituency}</p>
                        </div>
                        <div className={cn(
                          'px-3 py-1 text-[9px] font-black uppercase tracking-widest border',
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
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                  Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-[var(--brand-black)] hover:text-white hover:border-[var(--brand-black)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 flex items-center justify-center border text-[9px] font-black transition-all ${
                        page === safePage
                          ? 'bg-[var(--brand-black)] text-white border-[var(--brand-black)]'
                          : 'border-stone-200 text-stone-500 hover:bg-stone-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-[var(--brand-black)] hover:text-white hover:border-[var(--brand-black)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
              <Card className="rounded-none border-stone-900 bg-[var(--brand-black)] text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck className="w-32 h-32 rotate-12" />
                </div>

                <CardHeader className="p-6 border-b border-white/10 relative z-10">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-[var(--brand-red)] uppercase tracking-[0.2em]">
                        Reviewing · {selectedMember.id}
                      </span>
                      <CardTitle className="text-xl font-black font-meta uppercase tracking-tighter mt-1 leading-tight">
                        {selectedMember.name}
                      </CardTitle>
                      <div className={cn(
                        'inline-flex mt-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border',
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
                      className="w-14 h-16 bg-stone-700 flex-shrink-0 overflow-hidden border border-white/10 hover:opacity-80 transition-opacity"
                      onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
                      title={selectedMember.photoUrl ? 'View photo' : 'No photo uploaded'}
                    >
                      {selectedMember.photoUrl
                        ? <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-500 font-bold uppercase italic">
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
                        <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{label}</p>
                        <p className="text-[10px] font-black uppercase tracking-tight text-white leading-tight">
                          {value || '—'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="border-t border-white/10 pt-4 space-y-1">
                    <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">Phone</p>
                    <p className="text-[10px] font-black text-white">{selectedMember.phone || '—'}</p>
                  </div>

                  {/* Emergency contact */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-2">Emergency Contact</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Name', value: selectedMember.emergencyName },
                        { label: 'Relation', value: selectedMember.emergencyRelationship },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-0.5">
                          <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">{label}</p>
                          <p className="text-[10px] font-black uppercase tracking-tight text-white">{value || '—'}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-white mt-1">{selectedMember.emergencyPhone || '—'}</p>
                  </div>

                  {/* Verification checklist */}
                  <div className="border-t border-white/10 pt-4 space-y-2">
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-400">Verification Steps</h4>
                    {[
                      { label: 'Form Submitted', done: true },
                      { label: 'Photo Uploaded', done: !!selectedMember.photoUrl },
                      { label: 'Regional Chapter Approval', done: selectedMember.status === 'Approved' },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/5">
                        {done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-stone-600 flex items-center justify-center shrink-0">
                              <div className="w-1 h-1 bg-stone-600" />
                            </div>
                        }
                        <span className={cn(
                          'text-[9px] font-bold uppercase tracking-tight',
                          done ? 'text-white' : 'text-stone-500'
                        )}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {(selectedMember.status === 'In Review' || selectedMember.status === 'Processing' || selectedMember.status === 'Flagged') && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="primary"
                        onClick={() => handleVerdict(false)}
                        className="h-11 bg-[var(--brand-red)] text-white hover:bg-red-700 transition-all text-[9px] font-black uppercase tracking-widest border-0"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleVerdict(true)}
                        className="h-11 bg-[var(--brand-green)] text-white hover:bg-emerald-600 transition-all text-[9px] font-black uppercase tracking-widest"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
                      </Button>
                    </div>
                  )}

                  {selectedMember.status === 'Approved' && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> Member Approved
                    </div>
                  )}

                  {selectedMember.status === 'Rejected' && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                      <XCircle className="w-4 h-4" /> Registration Rejected
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* View photo button (if available) */}
              {selectedMember.photoUrl && (
                <Card className="rounded-none border-stone-200 shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-black)]"
                      onClick={() => setShowPhotoFull(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Full Passport Photo
                    </Button>
                    {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
                      <Button
                        variant="ghost"
                        className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-[var(--brand-gold)] hover:bg-stone-50"
                        onClick={() => setViewingVaultRecord(selectedMember)}
                      >
                        <Database className="w-4 h-4 mr-2" /> View Full Audit Record
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 gap-4">
              <ShieldCheck className="w-12 h-12 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Select a file to review</p>
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
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
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
          <Card className="max-w-4xl w-full rounded-none border-0 shadow-2xl overflow-hidden bg-stone-50">
            <CardHeader className="bg-[var(--brand-black)] text-white p-8 border-b border-white/10 relative">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Lock className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-[var(--brand-gold)] uppercase tracking-[0.3em]">
                      Secure Vault Record
                    </span>
                    <div className={cn(
                      "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-white/20",
                      viewingVaultRecord.status === 'Approved' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {viewingVaultRecord.status}
                    </div>
                  </div>
                  <h2 className="text-3xl font-black font-meta uppercase tracking-tighter leading-none pt-2">
                    {viewingVaultRecord.name}
                  </h2>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">
                    Permanent Record ID: {viewingVaultRecord.id}
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
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Identity Metadata
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      {[
                        { label: 'Full Name', value: viewingVaultRecord.name },
                        { label: 'Platform', value: viewingVaultRecord.platform },
                        { label: 'Country', value: viewingVaultRecord.country },
                        { label: 'Region', value: viewingVaultRecord.region },
                        { label: 'Constituency', value: viewingVaultRecord.constituency },
                        { label: 'Profession', value: viewingVaultRecord.profession },
                        { label: 'Education', value: viewingVaultRecord.educationLevel },
                        { label: 'Gender', value: viewingVaultRecord.gender },
                        { label: 'Age Range', value: viewingVaultRecord.ageRange },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{f.label}</p>
                          <p className="text-[11px] font-black uppercase tracking-tight text-stone-900">{f.value || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                      <History className="w-3.5 h-3.5" /> Audit History
                    </h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-white border-l-2 border-[var(--brand-green)] shadow-sm">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black uppercase tracking-tight text-stone-900">Registration Submitted</p>
                          <span className="text-[8px] font-bold text-stone-400 uppercase">{viewingVaultRecord.submitted}</span>
                        </div>
                        <p className="text-[9px] text-stone-500 mt-1 uppercase tracking-tight">System generated entry upon form completion.</p>
                      </div>
                      {viewingVaultRecord.status === 'Approved' && (
                        <div className="p-4 bg-white border-l-2 border-emerald-500 shadow-sm">
                          <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-tight text-emerald-600">Verification Approved</p>
                            <span className="text-[8px] font-bold text-stone-400 uppercase">Just now</span>
                          </div>
                          <p className="text-[9px] text-stone-500 mt-1 uppercase tracking-tight">Administrator: National Admin HQ</p>
                        </div>
                      )}
                      {viewingVaultRecord.status === 'Rejected' && (
                        <div className="p-4 bg-white border-l-2 border-red-500 shadow-sm">
                          <div className="flex justify-between items-start">
                            <p className="text-[10px] font-black uppercase tracking-tight text-red-600">Verification Rejected</p>
                            <span className="text-[8px] font-bold text-stone-400 uppercase">Just now</span>
                          </div>
                          <p className="text-[9px] text-stone-500 mt-1 uppercase tracking-tight">Administrator: National Admin HQ</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-200 pb-2 mb-4">
                      Captured Credentials
                    </h3>
                    <div className="aspect-[3/4] bg-stone-200 overflow-hidden shadow-inner border border-stone-300 relative group">
                      {viewingVaultRecord.photoUrl ? (
                        <img src={viewingVaultRecord.photoUrl} alt="Vault Record" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 gap-2">
                          <EyeOff className="w-8 h-8 opacity-20" />
                          <p className="text-[9px] font-black uppercase">No biometric data</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Database className="text-white w-12 h-12 opacity-50" />
                      </div>
                    </div>
                  </section>
                  
                  <div className="p-6 bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/20">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-gold)] mb-2 italic">Legal Disclaimer</p>
                    <p className="text-[10px] text-stone-600 leading-relaxed font-medium italic">
                      This record is persistently stored in the Movement's Secure Audit Vault. Metadata cannot be altered after verification completion.
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
