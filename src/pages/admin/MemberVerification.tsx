import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { adminService, type PendingVerification } from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm from '@/components/admin/RegistrationForm'
import type { RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { BrandLine } from '@/components/ui/BrandLine'

// Modular imports
import { PAGE_SIZE } from './memberverification/utils'
import { VerificationQueue } from './memberverification/VerificationQueue'
import { IdentityReviewPanel } from './memberverification/IdentityReviewPanel'
import { AuditVaultModal } from './memberverification/AuditVaultModal'

export default function MemberVerification() {
  const [members, setMembers] = useState<PendingVerification[]>([])
  const [selectedMember, setSelectedMember] = useState<PendingVerification | null>(null)
  const [showRegForm, setShowRegForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PendingVerification['status'] | 'All'>('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [constituencyFilter, setConstituencyFilter] = useState('')
  const [showPhotoFull, setShowPhotoFull] = useState(false)
  const [viewingVaultRecord, setViewingVaultRecord] = useState<PendingVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<{
    confidence: number
    matches: string[]
    flagged: boolean
  } | null>(null)

  useEffect(() => {
    adminService
      .getPendingVerifications()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const pendingCount = members.filter(
    (m) => m.status === 'In Review' || m.status === 'Processing'
  ).length
  const flaggedCount = members.filter((m) => m.status === 'Flagged').length
  const approvedCount = members.filter((m) => m.status === 'Approved').length
  const rejectedCount = members.filter((m) => m.status === 'Rejected').length

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
    setMembers((prev) => [newMember, ...prev])
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
    setMembers((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, status: newStatus } : m))
    )
    setSelectedMember((prev) => (prev ? { ...prev, status: newStatus } : null))
    try {
      await adminService.verifyMember(selectedMember.id, approve, undefined, selectedMember.chapter)
      toast.success(`${selectedMember.name} has been ${newStatus.toLowerCase()}.`)
    } catch {
      toast.error('Failed to update verification status.')
    }
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setCurrentPage(1)
  }
  const handleFilter = (val: PendingVerification['status'] | 'All') => {
    setStatusFilter(val)
    setCurrentPage(1)
  }

  const constituencies = Array.from(
    new Set(members.map((m) => m.constituency).filter(Boolean))
  ).sort()

  const filtered = members.filter(
    (m) =>
      (statusFilter === 'All' || m.status === statusFilter) &&
      (constituencyFilter === '' || m.constituency === constituencyFilter) &&
      ((m.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.id?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.region?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (m.phone?.toLowerCase() || '').includes(search.toLowerCase()))
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="main">
      {/* Top bar */}
      <div className="top">
        <div>
          <h2 style={{ margin: '4px 0 0' }}>Member verification</h2>
          <BrandLine />
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Review and approve new member registrations for movement security.
          </p>
        </div>
        <div className="actions">
          {pendingCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: 'rgba(218,165,32,.08)',
                border: '1px solid rgba(218,165,32,.25)',
                borderRadius: 4,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: '#a87d10' }}
              >
                pending
              </span>
              <div>
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: '#a87d10',
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  Pending
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.2,
                  }}
                >
                  {pendingCount} review{pendingCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" onClick={() => setShowRegForm(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              person_add
            </span>
            Add member
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="kpis">
        <TacticalKPI
          label="Pending review"
          value={loading ? '—' : pendingCount}
          variant="red"
          description="Awaiting identity verification"
          trend={{ direction: 'neutral', value: 'Queue' }}
        />
        <TacticalKPI
          label="Flagged"
          value={loading ? '—' : flaggedCount}
          variant="gold"
          description="Under security review"
          trend={flaggedCount > 0 ? { direction: 'down', value: 'Alert' } : undefined}
        />
        <TacticalKPI
          label="Approved"
          value={loading ? '—' : approvedCount}
          variant="black"
          description="Verified movement members"
          trend={{ direction: 'up', value: 'Live' }}
        />
        <TacticalKPI
          label="Rejected"
          value={loading ? '—' : rejectedCount}
          variant="green"
          description="Decommissioned applications"
        />
      </div>

      {/* Two-column layout */}
      <div className="verify-split">
        {/* ── Left: verification queue ── */}
        <VerificationQueue
          loading={loading}
          search={search}
          handleSearch={handleSearch}
          statusFilter={statusFilter}
          handleFilter={handleFilter}
          constituencyFilter={constituencyFilter}
          setConstituencyFilter={setConstituencyFilter}
          constituencies={constituencies}
          filtered={filtered}
          paginated={paginated}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          setAiResult={setAiResult}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          safePage={safePage}
        />

        {/* ── Right: review panel ── */}
        {selectedMember ? (
          <IdentityReviewPanel
            selectedMember={selectedMember}
            setShowPhotoFull={setShowPhotoFull}
            aiResult={aiResult}
            aiAnalyzing={aiAnalyzing}
            handleAiScan={handleAiScan}
            handleVerdict={handleVerdict}
            setViewingVaultRecord={setViewingVaultRecord}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 380,
              border: '2px dashed hsl(var(--border))',
              borderRadius: 6,
              background: 'rgba(255,255,255,.5)',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: 'hsl(var(--border))' }}
            >
              shield
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Select a file to review
            </p>
          </div>
        )}
      </div>

      {/* Registration form modal */}
      {showRegForm &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(15,19,16,.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              overflowY: 'auto',
            }}
          >
            <RegistrationForm
              onClose={() => setShowRegForm(false)}
              onSuccess={() => setShowRegForm(false)}
              onSubmitData={handleNewRegistration}
            />
          </div>,
          document.body
        )}

      {/* Photo lightbox */}
      {showPhotoFull &&
        selectedMember?.photoUrl &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 110,
              background: 'rgba(10,14,11,.93)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
            }}
            onClick={() => setShowPhotoFull(false)}
          >
            <button
              aria-label="Close photo viewer"
              onClick={() => setShowPhotoFull(false)}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.2)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                close
              </span>
            </button>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedMember.photoUrl}
                alt={selectedMember.name}
                style={{
                  maxHeight: '80vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  boxShadow: '0 32px 80px rgba(0,0,0,.6)',
                }}
                decoding="async"
                crossOrigin="anonymous"
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                {selectedMember.name} · {selectedMember.id}
              </p>
            </div>
          </div>,
          document.body
        )}

      {/* Audit vault modal */}
      {viewingVaultRecord && (
        <AuditVaultModal
          viewingVaultRecord={viewingVaultRecord}
          setViewingVaultRecord={setViewingVaultRecord}
        />
      )}
    </div>
  )
}
