import { useState, useEffect } from 'react'
import { adminService, type PendingVerification } from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm from '@/components/admin/RegistrationForm'
import type { RegistrationSubmission } from '@/components/admin/RegistrationForm'
import VerificationListCard from '@/components/admin/VerificationListCard'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const PAGE_SIZE = 10

const STATUS_OPTIONS: (PendingVerification['status'] | 'All')[] = [
  'All', 'In Review', 'Processing', 'Flagged', 'Approved', 'Rejected'
]

function statusPill(status: PendingVerification['status']) {
  if (status === 'Approved')   return 'pill pill-ok'
  if (status === 'In Review')  return 'pill pill-warn'
  if (status === 'Processing') return 'pill pill-warn'
  if (status === 'Flagged')    return 'pill pill-err'
  if (status === 'Rejected')   return 'pill pill-err'
  return 'pill pill-mute'
}

export default function MemberVerification() {
  const [members, setMembers]           = useState<PendingVerification[]>([])
  const [selectedMember, setSelectedMember] = useState<PendingVerification | null>(null)
  const [showRegForm, setShowRegForm]   = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<PendingVerification['status'] | 'All'>('All')
  const [currentPage, setCurrentPage]   = useState(1)
  const [constituencyFilter, setConstituencyFilter] = useState('')
  const [showPhotoFull, setShowPhotoFull] = useState(false)
  const [viewingVaultRecord, setViewingVaultRecord] = useState<PendingVerification | null>(null)
  const [loading, setLoading]           = useState(true)
  const [aiAnalyzing, setAiAnalyzing]   = useState(false)
  const [aiResult, setAiResult]         = useState<{ confidence: number; matches: string[]; flagged: boolean } | null>(null)

  useEffect(() => {
    adminService.getPendingVerifications()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pendingCount = members.filter(m => m.status === 'In Review' || m.status === 'Processing').length
  const flaggedCount = members.filter(m => m.status === 'Flagged').length
  const approvedCount = members.filter(m => m.status === 'Approved').length
  const rejectedCount = members.filter(m => m.status === 'Rejected').length

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
        toast.warning(`AI Alert: Low confidence score (${result.confidence}%). Review carefully.`)
      } else {
        toast.success('AI scan complete — high identity match confidence.')
      }
    } catch {
      toast.error('AI assistant unavailable.')
    } finally {
      setAiAnalyzing(false)
    }
  }

  const handleVerdict = async (approve: boolean) => {
    if (!selectedMember) return
    const newStatus: PendingVerification['status'] = approve ? 'Approved' : 'Rejected'
    setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, status: newStatus } : m))
    setSelectedMember(prev => prev ? { ...prev, status: newStatus } : null)
    try {
      await adminService.verifyMember(selectedMember.id, approve, undefined, selectedMember.chapter)
      toast.success(`${selectedMember.name} has been ${newStatus.toLowerCase()}.`)
    } catch {
      toast.error('Failed to update verification status.')
    }
  }

  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }
  const handleFilter = (val: PendingVerification['status'] | 'All') => { setStatusFilter(val); setCurrentPage(1) }

  const constituencies = Array.from(new Set(members.map(m => m.constituency).filter(Boolean))).sort()

  const filtered = members.filter(m =>
    (statusFilter === 'All' || m.status === statusFilter) &&
    (constituencyFilter === '' || m.constituency === constituencyFilter) &&
    (
      (m.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (m.id?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (m.region?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (m.phone?.toLowerCase() || '').includes(search.toLowerCase())
    )
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="main">

      {/* Top bar */}
      <div className="top">
        <div>
          <div className="crumbs">Members · Verification</div>
          <h2 style={{ margin: '4px 0 0' }}>Member verification</h2>
          <div className="bl"><div /><div /><div /></div>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12.5, marginTop: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
            Review and approve new member registrations for movement security.
          </p>
        </div>
        <div className="actions">
          {pendingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(218,165,32,.08)', border: '1px solid rgba(218,165,32,.25)', borderRadius: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#a87d10' }}>pending</span>
              <div>
                <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: '#a87d10', letterSpacing: '.06em', textTransform: 'uppercase', lineHeight: 1 }}>Pending</div>
                <div style={{ fontSize: 13, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface))', lineHeight: 1.2 }}>{pendingCount} review{pendingCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowRegForm(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            Add member
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[18px]">
        <TacticalKPI 
          label="Pending review"
          value={loading ? '—' : pendingCount}
          variant="gold"
          description="Awaiting identity verification"
          trend={{ direction: 'neutral', value: 'Queue' }}
        />
        <TacticalKPI 
          label="Flagged"
          value={loading ? '—' : flaggedCount}
          variant="red"
          description="Under security review"
          trend={flaggedCount > 0 ? { direction: 'down', value: 'Alert' } : undefined}
        />
        <TacticalKPI 
          label="Approved"
          value={loading ? '—' : approvedCount}
          variant="green"
          description="Verified movement members"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI 
          label="Rejected"
          value={loading ? '—' : rejectedCount}
          variant="black"
          description="Decommissioned applications"
        />
      </div>

      {/* Two-column layout */}
      <div className="verify-split">

        {/* ── Left: verification queue ── */}
        <div className="panel">
          {/* Search + filter bar */}
          <div className="ph" style={{ gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>search</span>
              <input name="search" id="input-13be0c"
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name, ID, phone, region…"
                style={{ width: '100%', height: 36, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px 0 32px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, outline: 'none', background: 'hsl(var(--surface))', color: 'hsl(var(--on-surface))' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>filter_list</span>
              <select name="statusFilter" id="select-a12bda"
                value={statusFilter}
                onChange={e => handleFilter(e.target.value as PendingVerification['status'] | 'All')}
                style={{ height: 36, paddingLeft: 30, paddingRight: 12, border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, background: '#fff', color: 'hsl(var(--on-surface))', outline: 'none', cursor: 'pointer' }}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>
                ))}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>location_on</span>
              <select name="constituencyFilter" id="select-3f4bc0"
                value={constituencyFilter}
                onChange={e => { setConstituencyFilter(e.target.value); setCurrentPage(1) }}
                style={{ height: 36, paddingLeft: 30, paddingRight: 12, border: '1px solid hsl(var(--border))', borderRadius: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, background: '#fff', color: 'hsl(var(--on-surface))', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">All constituencies</option>
                {constituencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List rows */}
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 10, animation: 'spin 1.2s linear infinite' }}>refresh</span>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Fetching identity files…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>search_off</span>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No registrations match your search.</p>
            </div>
          ) : (
            <>
              {/* Desktop list rows */}
              <div className="desktop-only">
                {paginated.map((member, i) => {
                  const isActive = selectedMember?.id === member.id
                  return (
                    <div
                      key={member.id}
                      onClick={() => { setSelectedMember(member); setAiResult(null) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: '14px 18px',
                        borderBottom: i < paginated.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                        cursor: 'pointer',
                        background: isActive ? 'linear-gradient(135deg,#0f1310,#1f2620)' : '',
                        boxShadow: isActive ? 'inset 3px 0 0 hsl(var(--primary))' : '',
                        transition: 'background .15s',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))' }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '' }}
                    >
                      {/* Avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 4, overflow: 'hidden', background: isActive ? 'rgba(255,255,255,.1)' : '#f1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: isActive ? '1px solid rgba(255,255,255,.15)' : '1px solid hsl(var(--border))' }}>
                          {member.photoUrl
                            ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" />
                            : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? 'rgba(255,255,255,.6)' : 'hsl(var(--on-surface-muted))' }}>{member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                          }
                        </div>
                        <div>
                          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: isActive ? '#fff' : 'hsl(var(--on-surface))' }}>{member.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 10.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: isActive ? 'rgba(255,255,255,.5)' : 'hsl(var(--on-surface-muted))' }}>{member.id}</span>
                            <span style={{ width: 3, height: 3, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,.3)' : 'hsl(var(--border))' }} />
                            <span style={{ fontSize: 10.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: isActive ? 'rgba(255,255,255,.5)' : 'hsl(var(--on-surface-muted))' }}>{member.submitted}</span>
                          </div>
                        </div>
                      </div>

                      {/* Region + status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5, color: isActive ? 'rgba(255,255,255,.8)' : 'hsl(var(--on-surface))' }}>{member.region}</p>
                          <p style={{ margin: '1px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: isActive ? 'rgba(255,255,255,.45)' : 'hsl(var(--on-surface-muted))' }}>{member.constituency}</p>
                        </div>
                        {isActive
                          ? <span style={{ padding: '2px 9px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 99, fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.05em' }}>{member.status}</span>
                          : <span className={statusPill(member.status)}>{member.status}</span>
                        }
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: isActive ? 'rgba(255,255,255,.4)' : 'hsl(var(--border))', transform: isActive ? 'translateX(2px)' : 'none', transition: 'transform .15s' }}>chevron_right</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Mobile cards */}
              <div className="mobile-only">
                {paginated.map(member => (
                  <VerificationListCard
                    key={member.id}
                    member={member}
                    isActive={selectedMember?.id === member.id}
                    onClick={m => { setSelectedMember(m); setAiResult(null) }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
              <span style={{ fontSize: 11.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button className="btn btn-ghost btn-sm" disabled={safePage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid hsl(var(--border))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, cursor: 'pointer', background: page === safePage ? 'hsl(var(--primary))' : '#fff', color: page === safePage ? '#fff' : 'hsl(var(--on-surface-muted))' }}
                  >
                    {page}
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" disabled={safePage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: review panel ── */}
        {selectedMember ? (
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Dark identity header */}
            <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
              <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '20px 22px', position: 'relative', overflow: 'hidden', borderTop: '3px solid hsl(var(--destructive))', borderBottom: '3px solid hsl(var(--primary))' }}>
                <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, background: 'radial-gradient(circle,rgba(218,165,32,.12),transparent 70%)' }} />
                <div className="verify-identity-row" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative' }}>
                  {/* Photo */}
                  <button
                    onClick={() => selectedMember.photoUrl && setShowPhotoFull(true)}
                    style={{ width: 64, height: 72, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', flexShrink: 0, cursor: selectedMember.photoUrl ? 'zoom-in' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {selectedMember.photoUrl
                      ? <img src={selectedMember.photoUrl} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" />
                      : <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'rgba(255,255,255,.25)' }}>person</span>
                    }
                  </button>
                  {/* Identity */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, color: 'hsl(var(--accent))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                      Reviewing · {selectedMember.id}
                    </div>
                    <h3 style={{ margin: '5px 0 6px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-.01em', lineHeight: 1.1 }}>{selectedMember.name}</h3>
                    <span className={statusPill(selectedMember.status)} style={{ fontSize: 10 }}>{selectedMember.status}</span>
                  </div>
                </div>
              </div>

              {/* Field grid */}
              <div style={{ background: '#fff', padding: '18px 22px' }}>
                <dl className="verify-field-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 18px' }}>
                  {[
                    ['Platform',      selectedMember.platform],
                    ['Country',       selectedMember.country],
                    ['Gender',        selectedMember.gender],
                    ['Age range',     selectedMember.ageRange],
                    ['Region',        selectedMember.region],
                    ['Constituency',  selectedMember.constituency],
                    ['Profession',    selectedMember.profession],
                    ['Education',     selectedMember.educationLevel],
                    ['Phone',         selectedMember.phone],
                    ['Submitted',     selectedMember.submitted],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 2 }}>{k}</dt>
                      <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'hsl(var(--on-surface))' }}>{v || '—'}</dd>
                    </div>
                  ))}
                </dl>

                {/* Emergency contact */}
                {(selectedMember.emergencyName || selectedMember.emergencyPhone) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid hsl(var(--border))' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 8 }}>Emergency contact</div>
                    <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px' }}>
                      {[
                        ['Name',      selectedMember.emergencyName],
                        ['Relation',  selectedMember.emergencyRelationship],
                        ['Phone',     selectedMember.emergencyPhone],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 2 }}>{k}</dt>
                          <dd style={{ margin: 0, fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{v || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>

            {/* Verification checklist */}
            <div className="panel">
              <div className="ph2"><h3>Verification steps</h3><span className="meta">auto-check</span></div>
              <div style={{ padding: '14px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Form submitted',             done: true },
                  { label: 'Photo uploaded',             done: !!selectedMember.photoUrl },
                  { label: 'Regional chapter approval',  done: selectedMember.status === 'Approved' },
                ].map(({ label, done }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: done ? 'rgba(0,107,63,.05)' : 'hsl(var(--container-low))', border: `1px solid ${done ? 'rgba(0,107,63,.18)' : 'hsl(var(--border))'}`, borderRadius: 4 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(0,107,63,.12)' : 'rgba(0,0,0,.04)', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>{done ? 'check' : 'radio_button_unchecked'}</span>
                    </div>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: done ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Security assistant */}
            <div className="panel">
              <div className="ph2">
                <h3>Security assistant</h3>
                {aiResult && (
                  <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 10, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, background: aiResult.flagged ? 'rgba(206,17,38,.1)' : 'rgba(0,107,63,.1)', color: aiResult.flagged ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.2)' : 'rgba(0,107,63,.2)'}` }}>
                    {aiResult.confidence}% match
                  </span>
                )}
              </div>
              <div style={{ padding: '14px 22px' }}>
                {!aiResult && !aiAnalyzing && (
                  <button
                    className="btn btn-sm"
                    onClick={handleAiScan}
                    style={{ width: '100%', justifyContent: 'center', background: 'hsl(var(--accent))', color: '#000', fontWeight: 800, height: 40 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>memory</span>
                    Execute identity scan
                  </button>
                )}
                {aiAnalyzing && (
                  <div style={{ padding: '18px 0', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'hsl(var(--accent))', display: 'block', marginBottom: 8, animation: 'spin 1.5s linear infinite' }}>fingerprint</span>
                    <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Analyzing identity…</p>
                  </div>
                )}
                {aiResult && (
                  <div style={{ padding: '12px 14px', background: aiResult.flagged ? 'rgba(206,17,38,.06)' : 'rgba(0,107,63,.06)', border: `1px solid ${aiResult.flagged ? 'rgba(206,17,38,.18)' : 'rgba(0,107,63,.18)'}`, borderRadius: 4 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {aiResult.matches.map(m => (
                        <span key={m} style={{ padding: '2px 8px', background: 'rgba(0,0,0,.05)', borderRadius: 99, fontSize: 10.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>{m}</span>
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontStyle: 'italic' }}>
                      Neural scan of official records completed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {(selectedMember.status === 'In Review' || selectedMember.status === 'Processing' || selectedMember.status === 'Flagged') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button className="btn btn-dest" style={{ justifyContent: 'center', height: 44 }} onClick={() => handleVerdict(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                  Reject
                </button>
                <button className="btn btn-primary" style={{ justifyContent: 'center', height: 44 }} onClick={() => handleVerdict(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified_user</span>
                  Approve
                </button>
              </div>
            )}

            {selectedMember.status === 'Approved' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(0,107,63,.07)', border: '1px solid rgba(0,107,63,.2)', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>verified_user</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--primary))' }}>Member approved and admitted.</span>
              </div>
            )}

            {selectedMember.status === 'Rejected' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(206,17,38,.07)', border: '1px solid rgba(206,17,38,.2)', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}>cancel</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--destructive))' }}>Registration rejected.</span>
              </div>
            )}

            {/* Biometric + audit vault links */}
            {selectedMember.photoUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setShowPhotoFull(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
                  Inspect biometric data
                </button>
                {(selectedMember.status === 'Approved' || selectedMember.status === 'Rejected') && (
                  <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setViewingVaultRecord(selectedMember)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>database</span>
                    Open audit vault
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 380, border: '2px dashed hsl(var(--border))', borderRadius: 6, background: 'rgba(255,255,255,.5)', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))' }}>shield</span>
            <p style={{ margin: 0, fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>Select a file to review</p>
          </div>
        )}
      </div>

      {/* Registration form modal */}
      {showRegForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,19,16,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <RegistrationForm
            onClose={() => setShowRegForm(false)}
            onSuccess={() => setShowRegForm(false)}
            onSubmitData={handleNewRegistration}
          />
        </div>
      )}

      {/* Photo lightbox */}
      {showPhotoFull && selectedMember?.photoUrl && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(10,14,11,.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
          onClick={() => setShowPhotoFull(false)}
        >
          <button
            onClick={() => setShowPhotoFull(false)}
            style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={e => e.stopPropagation()}>
            <img src={selectedMember.photoUrl} alt={selectedMember.name} style={{ maxHeight: '80vh', maxWidth: '100%', objectFit: 'contain', boxShadow: '0 32px 80px rgba(0,0,0,.6)' }} decoding="async" />
            <p style={{ margin: 0, fontSize: 11.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>
              {selectedMember.name} · {selectedMember.id}
            </p>
          </div>
        </div>
      )}

      {/* Audit vault modal */}
      {viewingVaultRecord && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setViewingVaultRecord(null) }}
        >
          <div style={{ width: '100%', maxWidth: 860, background: '#fff', borderRadius: 6, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            {/* Vault header */}
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '28px 32px', borderTop: '4px solid hsl(var(--destructive))', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ position: 'absolute', right: 24, top: 12, opacity: .06 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 96 }}>lock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 10.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Secure vault record</span>
                    <span className={viewingVaultRecord.status === 'Approved' ? 'pill pill-ok' : 'pill pill-err'} style={{ fontSize: 9 }}>{viewingVaultRecord.status}</span>
                  </div>
                  <h2 style={{ margin: '0 0 4px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: '#fff', letterSpacing: '-.02em' }}>{viewingVaultRecord.name}</h2>
                  <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>Permanent record ID: {viewingVaultRecord.id}</p>
                </div>
                <button onClick={() => setViewingVaultRecord(null)} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              </div>
            </div>

            {/* Vault body */}
            <div className="vault-body-grid" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

              {/* Left: identity + audit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                <div>
                  <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>description</span> Identity metadata
                  </div>
                  <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                    {[
                      ['Full name', viewingVaultRecord.name],
                      ['Platform', viewingVaultRecord.platform],
                      ['Country', viewingVaultRecord.country],
                      ['Region', viewingVaultRecord.region],
                      ['Constituency', viewingVaultRecord.constituency],
                      ['Profession', viewingVaultRecord.profession],
                      ['Education', viewingVaultRecord.educationLevel],
                      ['Gender', viewingVaultRecord.gender],
                      ['Age range', viewingVaultRecord.ageRange],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 2 }}>{k}</dt>
                        <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{v || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>history</span> Audit history
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ padding: '12px 16px', background: '#fff', borderLeft: '3px solid hsl(var(--on-surface))', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderRadius: '0 4px 4px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>Registration submitted</p>
                        <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{viewingVaultRecord.submitted}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>System generated entry upon form completion.</p>
                    </div>
                    {viewingVaultRecord.status === 'Approved' && (
                      <div style={{ padding: '12px 16px', background: '#fff', borderLeft: '3px solid hsl(var(--primary))', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderRadius: '0 4px 4px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--primary))' }}>Verification approved</p>
                          <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Just now</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Administrator: National HQ</p>
                      </div>
                    )}
                    {viewingVaultRecord.status === 'Rejected' && (
                      <div style={{ padding: '12px 16px', background: '#fff', borderLeft: '3px solid hsl(var(--destructive))', boxShadow: '0 1px 4px rgba(0,0,0,.06)', borderRadius: '0 4px 4px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--destructive))' }}>Verification rejected</p>
                          <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Just now</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Administrator: National HQ</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: photo + disclaimer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.07em', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8, marginBottom: 14 }}>Captured credentials</div>
                  <div style={{ aspectRatio: '3/4', background: 'hsl(var(--container-low))', overflow: 'hidden', border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {viewingVaultRecord.photoUrl
                      ? <img src={viewingVaultRecord.photoUrl} alt="Vault record" style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" />
                      : <div style={{ textAlign: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>hide_image</span>
                          <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No biometric data</p>
                        </div>
                    }
                  </div>
                </div>
                <div style={{ padding: '14px 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                  <p style={{ margin: '0 0 4px', fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontStyle: 'italic' }}>Legal disclaimer</p>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, lineHeight: 1.6, fontStyle: 'italic' }}>
                    This record is persistently stored in the movement's secure audit vault. Metadata cannot be altered after verification completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
