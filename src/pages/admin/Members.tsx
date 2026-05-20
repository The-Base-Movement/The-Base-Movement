import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useChapters } from '@/context/ChaptersContext'
import { usePerformance } from '@/context/PerformanceContext'
import {
  adminService,
  type AuditLogEntry,
  type Member,
  type MemberDonation,
  type MemberPollVote,
  type MemberSession,
  type MemberNote,
} from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm, { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { getCroppedImg } from '@/lib/imageUtils'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { MemberDetailPanel } from './members/MemberDetailPanel'
import { AuditModal } from './members/AuditModal'
import { AssignmentModal } from './members/AssignmentModal'
import { DeleteModal } from './members/DeleteModal'
import { EditModal } from './members/EditModal'
import { MembersTable } from './members/MembersTable'

export default function MembersList() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { chapters } = useChapters()
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('search') || ''
    }
    return ''
  })
  const { lowBandwidthMode } = usePerformance()
  const [isExporting, setIsExporting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<
    'activity' | 'identity' | 'donations' | 'polls' | 'sessions' | 'notes' | 'card'
  >('activity')
  const [detailLogs, setDetailLogs] = useState<AuditLogEntry[]>([])
  const [memberDonations, setMemberDonations] = useState<MemberDonation[]>([])
  const [memberPollVotes, setMemberPollVotes] = useState<MemberPollVote[]>([])
  const [memberSessions, setMemberSessions] = useState<MemberSession[]>([])
  const [memberNotes, setMemberNotes] = useState<MemberNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const cardRef = useRef<HTMLDivElement>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigningMembers, setAssigningMembers] = useState<Member[]>([])
  const [assignmentData, setAssignmentData] = useState({
    chapterId: '',
    role: 'Chapter Coordinator',
  })
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingMembers, setIsDeletingMembers] = useState(false)

  const [totalMembers, setTotalMembers] = useState(0)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'digital' | 'scan' | 'admin'>('all')

  const [viewingAuditLogs, setViewingAuditLogs] = useState<AuditLogEntry[] | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditTargetMember, setAuditTargetMember] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    const { data, totalCount: total } = await adminService.getMembersPaginated(
      currentPage,
      itemsPerPage,
      searchTerm,
      sourceFilter
    )
    setMembers(data)
    setTotalMembers(total)
    setIsLoading(false)
  }, [currentPage, searchTerm, sourceFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    if (!selectedMember) {
      setDetailLogs([])
      setMemberDonations([])
      setMemberPollVotes([])
      setMemberSessions([])
      setMemberNotes([])
      return
    }
    setActiveDetailTab('activity')

    adminService
      .getAuditLogsForResource(`MEMBERS/${selectedMember.id}`)
      .then(setDetailLogs)
      .catch(() => {})

    const targetId = selectedMember.authId || selectedMember.id

    Promise.allSettled([
      adminService.getMemberDonations(targetId).then(setMemberDonations),
      adminService.getMemberPollVotes(targetId).then(setMemberPollVotes),
      adminService.getMemberSessions(targetId).then(setMemberSessions),
      adminService.getMemberNotes(targetId).then(setMemberNotes),
    ])
  }, [selectedMember])

  const handleViewAudit = async (member: Member) => {
    setAuditTargetMember(member.name)
    const logs = await adminService.getAuditLogsForResource(`MEMBERS/${member.id}`)
    setViewingAuditLogs(logs)
    setIsAuditModalOpen(true)
  }

  const getMissingRequiredFields = (m: Member): string[] => {
    const missing: string[] = []
    if (!m.name?.trim()) missing.push('Full name')
    if (!m.phone?.trim()) missing.push('Phone number')
    if (!m.gender?.trim()) missing.push('Gender')
    if (!m.avatarUrl) missing.push('Profile photo')
    if (m.platform === 'DIASPORA') {
      if (!m.country?.trim()) missing.push('Country')
    } else {
      if (!m.region?.trim()) missing.push('Region')
      if (!m.constituency?.trim()) missing.push('Constituency')
    }
    return missing
  }

  const handleVerify = async (id: string, name: string) => {
    if (!adminService.can('VERIFY_MEMBER', 'MEMBERS')) {
      toast.error('You do not have authorization to verify members.')
      return
    }
    const member = members.find((m) => m.id === id) ?? selectedMember
    if (member) {
      const missing = getMissingRequiredFields(member)
      if (missing.length > 0) {
        toast.error(`Cannot approve — missing: ${missing.join(', ')}`)
        return
      }
    }
    if (window.confirm(`Are you sure you want to verify and admit ${name} into the movement?`)) {
      const success = await adminService.verifyMember(id, true, 'Administrative Approval')
      if (success) {
        toast.success(`${name} has been successfully admitted.`)
        fetchMembers()
      }
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !selectedMember) return
    setIsSubmittingNote(true)
    try {
      const admin = adminService.getCurrentUser()
      const targetId = selectedMember.authId || selectedMember.id
      const newNote = await adminService.addMemberNote(
        targetId,
        admin?.name || 'Admin',
        admin?.role || 'Staff',
        newNoteContent
      )
      if (newNote) {
        setMemberNotes((prev) => [newNote, ...prev])
        setNewNoteContent('')
        toast.success('Note recorded in member history.')
      }
    } catch (error) {
      console.error('[ADMIN] Note submission failed:', error)
      toast.error('Failed to persist administrative note.')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleSubmitRegistration = async (data: RegistrationSubmission) => {
    setIsSubmittingRegistration(true)
    const newId = crypto.randomUUID()
    try {
      let finalAvatarUrl = null
      if (data.photoUrl && data.croppedAreaPixels) {
        try {
          const croppedBlob = await getCroppedImg(data.photoUrl, data.croppedAreaPixels)
          if (croppedBlob) {
            const fileName = adminService.generateAvatarPath(data.registrationNumber)
            const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
            if (uploadError) {
              console.error('[REGISTRATION] Avatar upload failed:', uploadError)
              toast.error('Member registered, but avatar upload failed due to storage permissions.')
            } else {
              finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
            }
          }
        } catch (err) {
          console.error('[REGISTRATION] Image processing failed:', err)
        }
      }
      const newUser = {
        id: newId,
        full_name: data.fullName,
        email: data.email || null,
        registration_number: data.registrationNumber,
        platform: data.platform,
        country: data.country,
        phone_number: data.contactNumber,
        gender: data.gender,
        avatar_url: finalAvatarUrl,
        age_range: data.ageRange,
        residential_address: data.residentialAddress,
        region: data.region,
        constituency: data.constituency,
        chapter: data.chapter,
        profession: data.profession,
        education_level: data.educationLevel,
        emergency_contact_name: data.emergencyContactName,
        emergency_relationship: data.emergencyRelationship,
        emergency_number: data.emergencyNumber,
        joined_at: new Date().toISOString(),
        status: 'Active',
        registration_source: 'admin',
      }
      const { error: dbError } = await adminService.registerMember(newUser)
      if (dbError) throw dbError
      toast.success(`${data.fullName} has been added to the directory.`)
      fetchMembers()
      setIsAdding(false)
    } catch (error: unknown) {
      console.error('[REGISTRATION] Submission failed:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred during registration.')
    } finally {
      setIsSubmittingRegistration(false)
    }
  }

  const handlePrint = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      })
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(
        `<html><head><title>THE BASE - Official Membership Card</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print();},200);"/></body></html>`
      )
      iframeDoc.close()
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current || !selectedMember) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${selectedMember.id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handleExport = async () => {
    if (members.length === 0) return
    setIsExporting(true)
    toast.success('Generating membership directory records…')
    try {
      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Region',
        'Constituency',
        'Status',
        'Joined',
        'Type',
        'Chapter',
        'Country',
      ]
      const rows = members.map((m) => [
        m.id,
        m.name,
        m.email,
        m.phone,
        m.region,
        m.constituency,
        m.status,
        m.joined,
        m.type,
        m.chapter,
        m.country,
      ])
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `the-base-members-${new Date().toISOString().split('T')[0]}.csv`
      )
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => {
        setIsExporting(false)
        toast.success('Membership directory downloaded.')
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      toast.error('An error occurred while generating the directory.')
    }
  }

  const handleBulkVerify = async () => {
    if (!adminService.can('VERIFY_MEMBER', 'MEMBERS')) {
      toast.error('You lack the authority for bulk verification.')
      return
    }
    const count = selectedIds.size
    if (
      window.confirm(`Are you sure you want to verify and admit all ${count} selected members?`)
    ) {
      let successCount = 0
      for (const id of selectedIds) {
        const success = await adminService.verifyMember(id, true, 'Bulk Administrative Approval')
        if (success) successCount++
      }
      toast.success(`Successfully admitted ${successCount} members into the movement.`)
      setSelectedIds(new Set())
      fetchMembers()
    }
  }

  const handleBulkDelete = () => {
    if (!adminService.can('DELETE_MEMBER', 'MEMBERS')) {
      toast.error('You lack the authority for member removal.')
      return
    }
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeletingMembers(true)
    let successCount = 0
    for (const id of selectedIds) {
      const success = await adminService.deleteMember(id)
      if (success) successCount++
    }
    setIsDeletingMembers(false)
    setIsDeleteModalOpen(false)
    setSelectedIds(new Set())
    if (selectedMember && selectedIds.has(selectedMember.id)) setSelectedMember(null)
    toast.success(`${successCount} member${successCount !== 1 ? 's' : ''} moved to trash.`)
    navigate('/admin/trash')
  }

  const handleOpenAssign = () => {
    if (selectedIds.size > 0) {
      setAssigningMembers(members.filter((m) => selectedIds.has(m.id)))
      setIsAssignModalOpen(true)
    } else if (selectedMember) {
      setAssigningMembers([selectedMember])
      setIsAssignModalOpen(true)
    }
  }

  const handleConfirmAssignment = async () => {
    if (!assignmentData.chapterId || assigningMembers.length === 0) return
    setIsSubmittingAssignment(true)
    try {
      const selectedChapter = chapters.find((c) => c.id === assignmentData.chapterId)
      if (!selectedChapter) throw new Error('Chapter not found')
      for (const member of assigningMembers) {
        await adminService.addChapterLeader(assignmentData.chapterId, {
          name: member.name,
          role: assignmentData.role,
          imageUrl: member.avatarUrl || '',
        })
      }
      toast.success(`${assigningMembers.length} leader(s) assigned to ${selectedChapter.name}.`)
      setIsAssignModalOpen(false)
      setSelectedIds(new Set())
    } catch {
      toast.error('Critical failure in leadership protocols.')
    } finally {
      setIsSubmittingAssignment(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedMember) return
    setIsSavingEdit(true)
    try {
      const success = await adminService.updateMemberProfile(selectedMember.id, editForm)
      if (success) {
        toast.success('Member profile updated.')
        setIsEditModalOpen(false)
        setSelectedMember({ ...selectedMember, ...editForm } as Member)
        fetchMembers()
      } else {
        toast.error('Failed to update member profile.')
      }
    } catch {
      toast.error('An error occurred while updating.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const openEditModal = (m: Member) => {
    setEditForm({
      name: m.name,
      email: m.email,
      phone: m.phone,
      gender: m.gender,
      region: m.region,
      constituency: m.constituency,
      country: m.country,
      chapter: m.chapter,
      profession: m.profession,
      city: m.city,
      residentialAddress: m.residentialAddress,
    })
    setIsEditModalOpen(true)
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)
  const paginatedMembers = members

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1)
  }
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1)
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedMembers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginatedMembers.map((m) => m.id)))
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const stats = {
    total: totalMembers,
    active: members.filter((m) => m.status === 'Active').length,
    pending: members.filter((m) => m.status === 'Pending').length,
    regions: new Set(members.filter((m) => m.region).map((m) => m.region)).size,
  }

  return (
    <div className="main">
      {/* Page header */}
      <div className="top">
        <div>
          <div className="crumbs">Members · Directory</div>
          <h2 style={{ margin: '4px 0 0' }}>Member directory</h2>
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 4,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 700,
            }}
          >
            Movement registration database, identity verification, and regional deployment
            oversight.
          </p>
        </div>
        <div className="actions">
          <button
            className="btn btn-outline"
            onClick={handleExport}
            disabled={isExporting || members.length === 0}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              download
            </span>
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
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
          label="Intelligence"
          value={isLoading ? '—' : stats.total.toLocaleString()}
          variant="black"
          description="Verified citizens registered nationwide in the movement database"
        />
        <TacticalKPI
          label="Members"
          value={isLoading ? '—' : stats.active.toLocaleString()}
          variant="gold"
          description="Active mobilization personnel with verified administrative status"
        />
        <TacticalKPI
          label="Verification"
          value={isLoading ? '—' : stats.pending.toLocaleString()}
          variant="green"
          description="Members currently awaiting strategic identity validation"
        />
        <TacticalKPI
          label="Coverage"
          value={isLoading ? '—' : stats.regions.toLocaleString()}
          variant="gold"
          description="Operational presence across all administrative regions of Ghana"
        />
      </div>

      {/* Filter bar */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div
          style={{
            padding: '10px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 17,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              search
            </span>
            <input
              aria-label="Search by name, ID, phone, profession, region…"
              name="searchTerm"
              id="input-0acdd0"
              type="text"
              placeholder="Search by name, ID, phone, profession, region…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              style={{
                width: '100%',
                height: 38,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                padding: '0 12px 0 36px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12.5,
                outline: 'none',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>
          {searchTerm && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchTerm('')
                setCurrentPage(1)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                close
              </span>
              Clear
            </button>
          )}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {(
              [
                { value: 'all', label: 'All', icon: 'group' },
                { value: 'digital', label: 'Digital', icon: 'computer' },
                { value: 'scan', label: 'Scanned', icon: 'document_scanner' },
                { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setSourceFilter(opt.value)
                  setCurrentPage(1)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 32,
                  padding: '0 10px',
                  borderRadius: 4,
                  border: '1px solid',
                  cursor: 'pointer',
                  fontSize: 11.5,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  transition: 'all .15s',
                  background: sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'transparent',
                  borderColor:
                    sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'hsl(var(--border))',
                  color: sourceFilter === opt.value ? '#fff' : 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  {opt.icon}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            borderRadius: 4,
            padding: '10px 16px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 12,
                color: 'rgba(255,255,255,.9)',
              }}
            >
              {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,.5)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-sm"
              onClick={handleBulkVerify}
              style={{
                background: 'rgba(0,107,63,.25)',
                color: '#fff',
                border: '1px solid rgba(0,107,63,.4)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                verified_user
              </span>
              Verify
            </button>
            <button
              className="btn btn-sm"
              onClick={handleOpenAssign}
              style={{
                background: 'rgba(255,255,255,.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.15)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                assignment_ind
              </span>
              Assign
            </button>
            <button
              className="btn btn-sm"
              onClick={handleBulkDelete}
              style={{
                background: 'rgba(206,17,38,.2)',
                color: '#f87171',
                border: '1px solid rgba(206,17,38,.35)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                delete
              </span>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Members table */}
      <MembersTable
        members={paginatedMembers}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedIds={selectedIds}
        lowBandwidthMode={lowBandwidthMode}
        currentPage={currentPage}
        totalMembers={totalMembers}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        onToggleSelectAll={handleToggleSelectAll}
        onToggleSelect={handleToggleSelect}
        onViewMember={setSelectedMember}
        onViewAudit={handleViewAudit}
        onVerify={handleVerify}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {/* Registration overlay */}
      {isAdding &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              background: 'rgba(15,19,16,.6)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <RegistrationForm
              onClose={() => setIsAdding(false)}
              onSuccess={() => {
                setIsAdding(false)
                toast.success('Identity successfully registered in the database.')
              }}
              onSubmitData={handleSubmitRegistration}
            />
            {isSubmittingRegistration && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 110,
                  background: 'rgba(255,255,255,.7)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    border: '3px solid rgba(0,107,63,.2)',
                    borderTopColor: 'hsl(var(--primary))',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: 12,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 12.5,
                  }}
                >
                  Finalizing registration…
                </p>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Member detail panel */}
      {selectedMember && (
        <MemberDetailPanel
          member={selectedMember}
          activeTab={activeDetailTab}
          onTabChange={setActiveDetailTab}
          onClose={() => setSelectedMember(null)}
          logs={detailLogs}
          donations={memberDonations}
          pollVotes={memberPollVotes}
          sessions={memberSessions}
          notes={memberNotes}
          noteContent={newNoteContent}
          onNoteChange={setNewNoteContent}
          onAddNote={handleAddNote}
          isSubmittingNote={isSubmittingNote}
          cardRef={cardRef}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onEdit={openEditModal}
          onVerify={handleVerify}
        />
      )}

      {/* Audit history modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        memberName={auditTargetMember}
        logs={viewingAuditLogs}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Leadership assignment modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        assigningMembers={assigningMembers}
        chapters={chapters}
        data={assignmentData}
        onChange={(field, value) => setAssignmentData((d) => ({ ...d, [field]: value }))}
        onConfirm={handleConfirmAssignment}
        onClose={() => setIsAssignModalOpen(false)}
        isSubmitting={isSubmittingAssignment}
      />

      {/* Delete confirmation modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        selectedIds={selectedIds}
        members={members}
        isDeleting={isDeletingMembers}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      {/* Edit member modal */}
      <EditModal
        isOpen={isEditModalOpen}
        member={selectedMember}
        form={editForm}
        onChange={(field, value) => setEditForm((f) => ({ ...f, [field]: value }))}
        onSave={handleSaveEdit}
        onClose={() => setIsEditModalOpen(false)}
        isSaving={isSavingEdit}
      />
    </div>
  )
}
