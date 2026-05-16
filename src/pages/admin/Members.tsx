import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { useChapters } from '@/context/ChaptersContext'
import { usePerformance } from '@/context/PerformanceContext'
import { adminService, type AuditLogEntry, type Member, type MemberDonation, type MemberPollVote, type MemberSession, type MemberNote } from '@/services/adminService'
import { toast } from 'sonner'
import RegistrationForm, { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { getCroppedImg } from '@/lib/imageUtils'
import MembershipCard from '@/components/MembershipCard'
import MemberListCard from '@/components/admin/MemberListCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid hsl(var(--border))',
  verticalAlign: 'middle',
}

export default function MembersList() {
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
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'identity' | 'donations' | 'polls' | 'sessions' | 'notes' | 'card'>('activity')
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
  const [assignmentData, setAssignmentData] = useState({ chapterId: '', role: 'Chapter Coordinator' })
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeletingMembers, setIsDeletingMembers] = useState(false)

  const handleOpenAssign = () => {
    if (selectedIds.size > 0) {
      setAssigningMembers(members.filter(m => selectedIds.has(m.id)))
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
      const selectedChapter = chapters.find(c => c.id === assignmentData.chapterId)
      if (!selectedChapter) throw new Error('Chapter not found')
      for (const member of assigningMembers) {
        await adminService.addChapterLeader(assignmentData.chapterId, {
          name: member.name,
          role: assignmentData.role,
          imageUrl: member.avatarUrl || ''
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

  const [totalMembers, setTotalMembers] = useState(0)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'digital' | 'scan' | 'admin'>('all')

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    const { data, totalCount: total } = await adminService.getMembersPaginated(currentPage, itemsPerPage, searchTerm, sourceFilter)
    setMembers(data)
    setTotalMembers(total)
    setIsLoading(false)
  }, [currentPage, searchTerm, sourceFilter])

  useEffect(() => { fetchMembers() }, [fetchMembers])

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
    
    // Audit logs use the registration number as the resource identifier
    adminService.getAuditLogsForResource(`MEMBERS/${selectedMember.id}`).then(setDetailLogs).catch(() => {})
    
    // Relational data uses the database UUID (authId)
    const targetId = selectedMember.authId || selectedMember.id
    
    Promise.allSettled([
      adminService.getMemberDonations(targetId).then(setMemberDonations),
      adminService.getMemberPollVotes(targetId).then(setMemberPollVotes),
      adminService.getMemberSessions(targetId).then(setMemberSessions),
      adminService.getMemberNotes(targetId).then(setMemberNotes),
    ])
  }, [selectedMember])

  const [viewingAuditLogs, setViewingAuditLogs] = useState<AuditLogEntry[] | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditTargetMember, setAuditTargetMember] = useState<string | null>(null)

  const handleViewAudit = async (member: Member) => {
    setAuditTargetMember(member.name)
    const logs = await adminService.getAuditLogsForResource(`MEMBERS/${member.id}`)
    setViewingAuditLogs(logs)
    setIsAuditModalOpen(true)
  }

  const handleVerify = async (id: string, name: string) => {
    if (!adminService.can('VERIFY_MEMBER', 'MEMBERS')) {
      toast.error('You do not have authorization to verify members.')
      return
    }
    const member = members.find(m => m.id === id) ?? selectedMember
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
        setMemberNotes(prev => [newNote, ...prev])
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
            // Standardize pathing: {userId}/{timestamp}.jpg
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
        registration_source: 'admin'
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
        scale: 4, useCORS: true, backgroundColor: '#ffffff', logging: false,
        scrollX: 0, scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      })
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(`<html><head><title>THE BASE - Official Membership Card</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print();},200);"/></body></html>`)
      iframeDoc.close()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current || !selectedMember) return
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
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
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Region', 'Constituency', 'Status', 'Joined', 'Type', 'Chapter', 'Country']
      const rows = members.map(m => [m.id, m.name, m.email, m.phone, m.region, m.constituency, m.status, m.joined, m.type, m.chapter, m.country])
      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `the-base-members-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => { setIsExporting(false); toast.success('Membership directory downloaded.') }, 1000)
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
    if (window.confirm(`Are you sure you want to verify and admit all ${count} selected members?`)) {
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
    toast.success(`${successCount} member record${successCount !== 1 ? 's' : ''} permanently removed.`)
    fetchMembers()
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = members

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1) }
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1) }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedMembers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginatedMembers.map(m => m.id)))
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
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

  const stats = {
    total: totalMembers,
    active: members.filter(m => m.status === 'Active').length,
    pending: members.filter(m => m.status === 'Pending').length,
    regions: new Set(members.filter(m => m.region).map(m => m.region)).size
  }

  return (
    <div className="main">

      {/* Page header */}
      <div className="top">
        <div>
          <div className="crumbs">Members · Directory</div>
          <h2 style={{ margin: '4px 0 0' }}>Member directory</h2>
          <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12.5, marginTop: 4, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
            Movement registration database, identity verification, and regional deployment oversight.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={handleExport} disabled={isExporting || members.length === 0}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            Add member
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[14px] mb-[18px]">
        <TacticalKPI 
          label="Intelligence"
          value={isLoading ? '—' : stats.total.toLocaleString()}
          variant="black"
          description="Verified citizens registered nationwide in the movement database"
        />
        <TacticalKPI 
          label="Patriots"
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
        <div style={{ padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: 'hsl(var(--on-surface-muted))' }}>search</span>
            <input aria-label="Search by name, ID, phone, profession, region…" name="searchTerm" id="input-0acdd0"
              type="text"
              placeholder="Search by name, ID, phone, profession, region…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              style={{ width: '100%', height: 38, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px 0 36px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, outline: 'none', background: 'hsl(var(--surface))', color: 'hsl(var(--on-surface))' }}
            />
          </div>
          {searchTerm && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearchTerm(''); setCurrentPage(1) }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>Clear
            </button>
          )}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {([
              { value: 'all',     label: 'All',     icon: 'group' },
              { value: 'digital', label: 'Digital',  icon: 'computer' },
              { value: 'scan',    label: 'Scanned',  icon: 'document_scanner' },
              { value: 'admin',   label: 'Admin',    icon: 'admin_panel_settings' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSourceFilter(opt.value); setCurrentPage(1) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
                  borderRadius: 4, border: '1px solid', cursor: 'pointer', fontSize: 11.5,
                  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, transition: 'all .15s',
                  background: sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'transparent',
                  borderColor: sourceFilter === opt.value ? 'hsl(var(--on-surface))' : 'hsl(var(--border))',
                  color: sourceFilter === opt.value ? '#fff' : 'hsl(var(--on-surface-muted))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', borderRadius: 4, padding: '10px 16px', marginBottom: 14 }}>
          {/* Row 1: count + close */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,.9)' }}>
              {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', padding: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
          </div>
          {/* Row 2: action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={handleBulkVerify} style={{ background: 'rgba(0,107,63,.25)', color: '#fff', border: '1px solid rgba(0,107,63,.4)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>Verify
            </button>
            <button className="btn btn-sm" onClick={handleOpenAssign} style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.15)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>assignment_ind</span>Assign
            </button>
            <button className="btn btn-sm" onClick={handleBulkDelete} style={{ background: 'rgba(206,17,38,.2)', color: '#f87171', border: '1px solid rgba(206,17,38,.35)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>Remove
            </button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="panel" style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table className="members-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                <th style={{ ...thStyle, width: 40 }}>
                  <input name="name-4e22c5" id="input-4e22c5"
                    type="checkbox"
                    checked={selectedIds.size === paginatedMembers.length && paginatedMembers.length > 0}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={thStyle}>Member</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td style={tdStyle} />
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'hsl(var(--border))', flexShrink: 0 }} />
                        <div>
                          <div style={{ width: 120, height: 11, background: 'hsl(var(--border))', borderRadius: 3, marginBottom: 6 }} />
                          <div style={{ width: 80, height: 9, background: 'hsl(var(--border))', borderRadius: 3 }} />
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}><div style={{ width: 100, height: 10, background: 'hsl(var(--border))', borderRadius: 3 }} /></td>
                    <td style={tdStyle}><div style={{ width: 90, height: 10, background: 'hsl(var(--border))', borderRadius: 3 }} /></td>
                    <td style={tdStyle}><div style={{ width: 60, height: 20, background: 'hsl(var(--border))', borderRadius: 99 }} /></td>
                    <td style={tdStyle} />
                  </tr>
                ))
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>
                      {searchTerm ? 'search_off' : 'group'}
                    </span>
                    <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                      {searchTerm ? `No results for "${searchTerm}"` : 'No members yet'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                      {searchTerm ? 'Try adjusting your search terms.' : 'Add the first member to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map(member => (
                  <tr key={member.id} style={!lowBandwidthMode ? { transition: 'background .15s' } : {}}
                    onMouseEnter={e => { if (!lowBandwidthMode) (e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))' }}
                    onMouseLeave={e => { if (!lowBandwidthMode) (e.currentTarget as HTMLElement).style.background = '' }}
                  >
                    <td style={tdStyle}>
                      <input name="name-f0edc7" id="input-f0edc7" type="checkbox" checked={selectedIds.has(member.id)} onChange={() => handleToggleSelect(member.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid hsl(var(--border))', overflow: 'hidden', background: '#f1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {member.avatarUrl
                            ? <img src={member.avatarUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} decoding="async" loading="lazy" />
                            : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>{member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>{member.name}</p>
                          <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {member.id.substring(0, 12).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{member.email || '—'}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2 }}>{member.phone || '—'}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12, fontFamily: "'Public Sans', sans-serif", fontWeight: 800 }}>{member.region || '—'}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2 }}>{member.constituency || '—'}</div>
                    </td>
                    <td style={tdStyle}>
                      <span className={
                        member.status === 'Active' || member.status === 'Approved' ? 'pill pill-ok'
                        : member.status === 'Pending' ? 'pill pill-warn'
                        : 'pill pill-err'
                      }>{member.status}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="Audit history" onClick={() => handleViewAudit(member)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>history</span>
                        </button>
                        {member.status === 'Pending' && adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                          <button className="btn btn-ghost btn-sm" title="Quick verify" onClick={() => handleVerify(member.id, member.name)} style={{ color: '#a87d10' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>verified_user</span>
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" title="View profile" onClick={() => setSelectedMember(member)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="mobile-only">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--border))', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 130, height: 11, background: 'hsl(var(--border))', borderRadius: 3, marginBottom: 7 }} />
                    <div style={{ width: 90, height: 9, background: 'hsl(var(--border))', borderRadius: 3 }} />
                  </div>
                  <div style={{ width: 52, height: 20, background: 'hsl(var(--border))', borderRadius: 99 }} />
                </div>
              </div>
            ))
          ) : paginatedMembers.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>
                {searchTerm ? 'search_off' : 'group'}
              </span>
              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>
                {searchTerm ? `No results for "${searchTerm}"` : 'No members yet'}
              </p>
            </div>
          ) : (
            paginatedMembers.map(member => (
              <MemberListCard
                key={member.id}
                member={member}
                isSelected={selectedIds.has(member.id)}
                onToggleSelect={handleToggleSelect}
                onView={setSelectedMember}
                onAudit={handleViewAudit}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
          <span style={{ fontSize: 11.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>
            {members.length > 0 ? `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalMembers)} of ${totalMembers}` : 'No records'}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={handlePrevPage}>← Previous</button>
            <span style={{ fontSize: 11, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--on-surface-muted))' }}>
              {currentPage} / {totalPages || 1}
            </span>
            <button className="btn btn-outline btn-sm" disabled={currentPage >= totalPages || totalPages === 0} onClick={handleNextPage}>Next →</button>
          </div>
        </div>
      </div>

      {/* Registration overlay */}
      {isAdding && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,19,16,.6)', backdropFilter: 'blur(4px)' }}>
          <RegistrationForm
            onClose={() => setIsAdding(false)}
            onSuccess={() => { setIsAdding(false); toast.success('Identity successfully registered in the database.') }}
            onSubmitData={handleSubmitRegistration}
          />
          {isSubmittingRegistration && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 110, background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(0,107,63,.2)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 12 }} />
              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>Finalizing registration…</p>
            </div>
          )}
        </div>
      )}

      {/* Member detail panel */}
      {selectedMember && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', background: 'rgba(15,19,16,.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedMember(null) }}
        >
          <div style={{ height: '100%', width: '100%', maxWidth: 1200, overflowY: 'auto', background: '#f1f5ee' }}>

            {/* Dark header */}
            <div className="member-detail-header" style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', color: '#fff', padding: '24px 28px', position: 'relative', overflow: 'hidden', borderTop: '3px solid hsl(var(--destructive))', borderBottom: '3px solid hsl(var(--primary))' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(218,165,32,.15),transparent 70%)' }} />

              <button onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>

              <div className="member-detail-identity-row" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid hsl(var(--accent))', flexShrink: 0, overflow: 'hidden', background: '#2a332b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedMember.avatarUrl
                    ? <img src={selectedMember.avatarUrl} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: '#fff' }}>{selectedMember.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, color: 'hsl(var(--accent))', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'Verified patriot' : 'Pending verification'} · since {selectedMember.joined?.split('-')[0] || '2025'}
                  </div>
                  <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.1 }}>{selectedMember.name}</h2>
                  <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--accent))', marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '.04em' }}>
                    {selectedMember.id.substring(0, 12).toUpperCase()}
                  </div>
                  <div className="desktop-only" style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(218,165,32,.1)', border: '1px solid rgba(218,165,32,.36)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'hsl(var(--accent))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified</span>
                      {selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'KYC verified' : 'Pending KYC'}
                    </span>
                    {selectedMember.constituency && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.constituency}</span>}
                    {selectedMember.region && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.region}</span>}
                    {selectedMember.gender && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.gender}</span>}
                  </div>
                </div>
                {/* Pills — mobile only, full-width row below avatar+name */}
                <div className="mobile-only member-detail-pills" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', order: 1 }}>
                  <span style={{ padding: '3px 10px', background: 'rgba(218,165,32,.1)', border: '1px solid rgba(218,165,32,.36)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'hsl(var(--accent))' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified</span>
                    {selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'KYC verified' : 'Pending KYC'}
                  </span>
                  {selectedMember.constituency && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.constituency}</span>}
                  {selectedMember.region && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.region}</span>}
                  {selectedMember.gender && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.gender}</span>}
                </div>
                <div className="member-detail-actions" style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }}
                    onClick={() => openEditModal(selectedMember)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>Edit
                  </button>
                  <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>Message
                  </button>
                  <button className="btn btn-sm btn-dest" onClick={() => toast.error(`Flagging ${selectedMember.name}…`)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>Flag
                  </button>
                </div>
              </div>

              {/* Quick stats */}
              <div className="member-quick-stats">
                {[
                  { label: 'Lifetime contribution', val: '₵0',  sub: 'No donations yet' },
                  { label: 'Polls voted',            val: memberPollVotes.length || '—', sub: 'Poll activity' },
                  { label: 'Chapter activity',       val: '—',  sub: 'Events attended YTD' },
                  { label: 'Membership tier',        val: selectedMember.type || 'Citizen', sub: 'Active tier', accent: true },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="sl">{s.label}</div>
                    <div className={`sv tnum${s.accent ? ' accent' : ''}`}>{s.val}</div>
                    <div className="sd">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid hsl(var(--border))', background: '#fff', padding: '0 14px', overflowX: 'auto' }}>
              {([
                { id: 'activity',  label: 'Activity',  count: detailLogs.length },
                { id: 'identity',  label: 'Identity',  count: 0 },
                { id: 'donations', label: 'Donations', count: memberDonations.length },
                { id: 'polls',     label: 'Polls',     count: memberPollVotes.length },
                { id: 'sessions',  label: 'Sessions',  count: memberSessions.length },
                { id: 'notes',     label: 'Notes',     count: memberNotes.length },
                { id: 'card',      label: 'ID Card',   count: 0 },
              ] as const).map(({ id, label, count }) => (
                <button key={id} onClick={() => setActiveDetailTab(id)}
                  style={{ padding: '14px 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: activeDetailTab === id ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))', background: 'none', border: 'none', borderBottom: activeDetailTab === id ? '2px solid hsl(var(--destructive))' : '2px solid transparent', cursor: 'pointer', letterSpacing: '-.005em', whiteSpace: 'nowrap' }}>
                  {label}
                  {count > 0 && (
                    <span style={{ marginLeft: 6, padding: '1px 7px', background: '#f1f5ee', borderRadius: 99, fontSize: 9, fontFamily: "'Public Sans', sans-serif", fontWeight: 800 }}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '22px 20px' }}>

              {/* Activity tab */}
              {activeDetailTab === 'activity' && (() => {
                const evStyle = (action: string) => {
                  const a = action.toLowerCase()
                  if (a.includes('donat') || a.includes('payment') || a.includes('purchase') || a.includes('bought') || a.includes('store'))
                    return { bg: 'rgba(218,165,32,.12)', color: '#a87d10', icon: 'payments' }
                  if (a.includes('login') || a.includes('sign') || a.includes('flag') || a.includes('block') || a.includes('suspend') || a.includes('security') || a.includes('device'))
                    return { bg: 'rgba(206,17,38,.1)', color: 'hsl(var(--destructive))', icon: 'login' }
                  if (a.includes('edit') || a.includes('update') || a.includes('chang') || a.includes('modif') || a.includes('photo') || a.includes('bio'))
                    return { bg: '#181d19', color: '#fff', icon: 'edit' }
                  if (a.includes('vote') || a.includes('poll'))
                    return { bg: '#f1f5ee', color: 'hsl(var(--primary))', icon: 'how_to_vote' }
                  return { bg: '#f1f5ee', color: 'hsl(var(--primary))', icon: 'history' }
                }
                const totalGiven = memberDonations.reduce((s, d) => s + d.amount, 0)
                const barHeights = [20,35,25,40,60,45,55,70,62,80,72,95]
                return (
                  <div className="panel-twocol">
                    <div>
                      <div className="panel" style={{ marginBottom: 20 }}>
                        <div className="ph2"><h3>Recent activity</h3><span className="meta">audit trail</span></div>
                        <div style={{ padding: '18px 24px' }}>
                          {detailLogs.length > 0 ? detailLogs.slice(0, 8).map((log, i, arr) => {
                            const s = evStyle(log.action)
                            return (
                              <div key={log.id} style={{ display: 'flex', gap: 12, padding: '12px 0', position: 'relative' }}>
                                {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 36, bottom: -12, width: 1, background: 'hsl(var(--border))' }} />}
                                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.color, flexShrink: 0, zIndex: 1 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{s.icon}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}><b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800 }}>{log.action}</b></p>
                                  <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{new Date(log.timestamp).toLocaleDateString()} · {log.adminName}</span>
                                </div>
                              </div>
                            )
                          }) : [
                            { icon: 'how_to_vote', text: 'Profile created and added to directory', time: selectedMember.joined || 'On join' },
                            { icon: 'verified',    text: 'Status set to ' + (selectedMember.status || 'Pending'), time: 'On registration' },
                            { icon: 'place',       text: 'Region assigned: ' + (selectedMember.region || '—'), time: 'Auto' },
                          ].map((e, i, arr) => (
                            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', position: 'relative' }}>
                              {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 36, bottom: -12, width: 1, background: 'hsl(var(--border))' }} />}
                              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5ee', color: 'hsl(var(--primary))', flexShrink: 0, zIndex: 1 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{e.icon}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{e.text}</p>
                                <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{e.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="panel">
                        <div className="ph2"><h3>Contribution history</h3><span className="meta">12 months · ₵</span></div>
                        <div style={{ padding: '18px 24px' }}>
                          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginBottom: 14 }}>
                            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                              <span style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', marginRight: 3 }}>₵</span>{totalGiven > 0 ? totalGiven.toLocaleString() : '0'}
                            </div>
                            <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', paddingBottom: 4 }}>lifetime · {memberDonations.length} donations</div>
                          </div>
                          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48 }}>
                            {(memberDonations.length > 0
                              ? memberDonations.slice(-12).map((d, i, arr) => ({ h: Math.max(8, Math.round((d.amount / Math.max(...arr.map(x => x.amount))) * 100)), last: i === arr.length - 1 }))
                              : barHeights.map((h, i) => ({ h, last: i === 11 }))
                            ).map(({ h, last }, i) => (
                              <div key={i} style={{ flex: 1, background: last ? 'hsl(var(--accent))' : 'hsl(var(--primary))', borderRadius: 1, opacity: last ? 1 : 0.55, height: `${h}%` }} />
                            ))}
                          </div>
                          {memberDonations.length === 0 && (
                            <p style={{ margin: '8px 0 0', fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No contributions recorded yet.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="panel" style={{ marginBottom: 20 }}>
                        <div className="ph2">
                          <h3>Identity snapshot</h3>
                          <span className={selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'pill pill-ok' : 'pill pill-warn'}>{selectedMember.status}</span>
                        </div>
                        <div style={{ padding: '18px 24px' }}>
                          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px 14px' }}>
                            {[
                              ['Full name',    selectedMember.name],
                              ['Reg number',   selectedMember.id.substring(0, 12).toUpperCase()],
                              ['Email',        selectedMember.email || '—'],
                              ['Mobile',       selectedMember.phone || '—'],
                              ['Region',       selectedMember.region || '—'],
                              ['Constituency', selectedMember.constituency || '—'],
                              ['Chapter',      selectedMember.chapter || '—'],
                              ['Joined',       selectedMember.joined || '—'],
                            ].map(([k, v]) => (
                              <Fragment key={k}>
                                <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", alignSelf: 'center' }}>{k}</dt>
                                <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{v}</dd>
                              </Fragment>
                            ))}
                          </dl>
                        </div>
                      </div>
                      <div className="panel" style={{ marginBottom: 20 }}>
                        <div className="ph2"><h3>KYC checks</h3><span className="meta">auto-run</span></div>
                        <div style={{ padding: '18px 24px' }}>
                          {[
                            { ok: !!selectedMember.phone,  label: 'Phone number on file',    detail: selectedMember.phone ? 'verified' : 'missing' },
                            { ok: !!selectedMember.email,  label: 'Email address registered', detail: selectedMember.email ? 'on file' : 'missing' },
                            { ok: selectedMember.status === 'Active' || selectedMember.status === 'Approved', label: 'Account status approved', detail: selectedMember.status },
                            { ok: !!selectedMember.region, label: 'Region assigned',          detail: selectedMember.region || 'unassigned' },
                            { ok: false, label: 'Ghana Card not uploaded',       detail: 'review' },
                          ].map((c, i, arr) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 12 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ok ? 'rgba(0,107,63,.12)' : 'rgba(218,165,32,.14)', color: c.ok ? 'hsl(var(--primary))' : '#a87d10', flexShrink: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.ok ? 'check' : 'warning'}</span>
                              </div>
                              <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, flex: 1 }}>{c.label}</b>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{c.detail}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="panel">
                        <div className="ph2"><h3>Admin notes</h3><span className="meta">internal</span></div>
                        <div style={{ padding: '14px 24px' }}>
                          {memberNotes.length > 0 ? memberNotes.slice(0, 3).map((n, i, arr) => (
                            <div key={n.id} style={{ padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5 }}>{n.author}{n.role ? ` · ${n.role}` : ''}</b>
                                <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{n.date}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{n.content}</p>
                            </div>
                          )) : (
                            <>
                              <div style={{ padding: '10px 0', borderBottom: '1px solid hsl(var(--border))' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5 }}>System</b>
                                  <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{selectedMember.joined || 'On join'}</span>
                                </div>
                                <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Member registered via {selectedMember.platform === 'DIASPORA' ? 'diaspora portal' : 'standard registration'}. Status: {selectedMember.status}.</p>
                              </div>
                              <div style={{ padding: '10px 0' }}>
                                <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontStyle: 'italic' }}>No additional notes. Open Notes tab to add one.</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Identity tab */}
              {activeDetailTab === 'identity' && (
                <div className="panel-twocol">
                  <div>
                    <div className="panel" style={{ marginBottom: 20 }}>
                      <div className="ph2">
                        <h3>Identity</h3>
                        <span className={selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'pill pill-ok' : 'pill pill-warn'}>{selectedMember.status}</span>
                      </div>
                      <div style={{ padding: '18px 24px' }}>
                        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px 14px' }}>
                          {[
                            ['Full name',    selectedMember.name],
                            ['Reg number',   selectedMember.id.substring(0, 12).toUpperCase()],
                            ['Email',        selectedMember.email || '—'],
                            ['Mobile',       selectedMember.phone || '—'],
                            ['Gender',       selectedMember.gender || '—'],
                            ['Region',       selectedMember.region || '—'],
                            ['Constituency', selectedMember.constituency || '—'],
                            ['Chapter',      selectedMember.chapter || '—'],
                            ['Country',      selectedMember.country || 'Ghana'],
                            ['Joined',       selectedMember.joined || '—'],
                            ['Type',         selectedMember.type || 'Citizen'],
                          ].map(([k, v]) => (
                            <Fragment key={k}>
                              <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", alignSelf: 'center' }}>{k}</dt>
                              <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {v}
                                {(k === 'Email' || k === 'Mobile') && v !== '—' && (
                                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(v)}>content_copy</span>
                                )}
                              </dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="panel" style={{ marginBottom: 20 }}>
                      <div className="ph2"><h3>KYC checks</h3><span className="meta">auto-run</span></div>
                      <div style={{ padding: '18px 24px' }}>
                        {[
                          { ok: !!selectedMember.phone,  label: 'Phone number on file',    detail: selectedMember.phone ? 'verified' : 'missing' },
                          { ok: !!selectedMember.email,  label: 'Email address registered', detail: selectedMember.email ? 'on file' : 'missing' },
                          { ok: selectedMember.status === 'Active' || selectedMember.status === 'Approved', label: 'Account status approved', detail: selectedMember.status },
                          { ok: !!selectedMember.region, label: 'Region assigned', detail: selectedMember.region || 'unassigned' },
                          { ok: false, label: 'Ghana Card not uploaded', detail: 'review' },
                        ].map((c, i, arr) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 12 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ok ? 'rgba(0,107,63,.12)' : 'rgba(218,165,32,.14)', color: c.ok ? 'hsl(var(--primary))' : '#a87d10', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.ok ? 'check' : 'warning'}</span>
                            </div>
                            <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, flex: 1 }}>{c.label}</b>
                            <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{c.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                      <div className="panel">
                        <div className="ph2"><h3>Actions</h3></div>
                        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button className="btn btn-outline" onClick={() => openEditModal(selectedMember)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>Edit member info
                          </button>
                          {selectedMember.status === 'Pending' && (
                            <>
                              <button className="btn btn-primary" onClick={() => handleVerify(selectedMember.id, selectedMember.name)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>Verify & admit
                              </button>
                              <button className="btn btn-dest">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>Reject application
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Donations tab */}
              {activeDetailTab === 'donations' && (
                <div>
                  <div className="panel" style={{ marginBottom: 20 }}>
                    <div className="ph2"><h3>Contribution summary</h3><span className="meta">all time</span></div>
                    <div style={{ padding: 18 }}>
                      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginBottom: 16 }}>
                        <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 36, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                          <span style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))', marginRight: 3 }}>₵</span>
                          {memberDonations.reduce((s, d) => s + d.amount, 0).toLocaleString() || '0'}
                        </div>
                        <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', paddingBottom: 5 }}>
                          lifetime · {memberDonations.length} donation{memberDonations.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 56, marginBottom: 4 }}>
                        {(memberDonations.length > 0
                          ? memberDonations.slice(-12).map((d, i, arr) => ({ h: Math.max(8, Math.round((d.amount / Math.max(...arr.map(x => x.amount))) * 100)), last: i === arr.length - 1 }))
                          : [20,35,25,40,60,45,55,70,62,80,72,95].map((h, i) => ({ h, last: i === 11 }))
                        ).map(({ h, last }, i) => (
                          <div key={i} style={{ flex: 1, background: last ? 'hsl(var(--accent))' : 'hsl(var(--primary))', borderRadius: 1, opacity: last ? 1 : 0.55, height: `${h}%` }} />
                        ))}
                      </div>
                      {memberDonations.length === 0 && (
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No donation records yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="ph2"><h3>Donation history</h3><span className="meta">{memberDonations.length} records</span></div>
                    {memberDonations.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>volunteer_activism</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No donations on record.</p>
                      </div>
                    ) : (
                      <div>
                        {memberDonations.map((d, i, arr) => (
                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(218,165,32,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#a87d10' }}>payments</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>{d.label}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{d.date} · {d.method} · ref {d.ref}</span>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--primary))' }}>₵{d.amount.toLocaleString()}</div>
                              <span style={{ fontSize: 10, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: d.cleared ? 'hsl(var(--primary))' : '#a87d10' }}>{d.cleared ? 'cleared' : 'pending'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Polls tab */}
              {activeDetailTab === 'polls' && (
                <div>
                  <div className="panel">
                    <div className="ph2"><h3>Poll participation</h3><span className="meta">{memberPollVotes.length} votes cast</span></div>
                    {memberPollVotes.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>how_to_vote</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No poll votes on record.</p>
                      </div>
                    ) : (
                      <div>
                        {memberPollVotes.map((v, i, arr) => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>how_to_vote</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>Poll #{v.pollNumber} — {v.pollTitle}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{v.date}</span>
                            </div>
                            <div style={{ flexShrink: 0, padding: '3px 10px', background: 'rgba(0,107,63,.08)', border: '1px solid rgba(0,107,63,.2)', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))' }}>
                              {v.choice}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sessions tab */}
              {activeDetailTab === 'sessions' && (
                <div>
                  <div className="panel">
                    <div className="ph2"><h3>Login sessions</h3><span className="meta">{memberSessions.length} sessions</span></div>
                    {memberSessions.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>devices</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No session records yet.</p>
                      </div>
                    ) : (
                      <div>
                        {memberSessions.map((s, i, arr) => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.current ? 'rgba(0,107,63,.1)' : 'rgba(206,17,38,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: s.current ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>login</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5 }}>{s.device}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{s.date} · {s.location} · {s.ip}</span>
                            </div>
                            {s.current && (
                              <span style={{ padding: '2px 8px', background: 'rgba(0,107,63,.1)', border: '1px solid rgba(0,107,63,.25)', borderRadius: 99, fontSize: 10, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--primary))' }}>Active</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes tab */}
              {activeDetailTab === 'notes' && (
                <div>
                  <div className="panel" style={{ marginBottom: 20 }}>
                    <div className="ph2"><h3>Add administrative note</h3><span className="meta">internal record</span></div>
                    <div style={{ padding: '18px 24px' }}>
                      <textarea name="newNoteContent" id="textarea-8e85c6"
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        placeholder="Type internal observation or status update…"
                        style={{ width: '100%', minHeight: 80, background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: 10, fontSize: 12.5, fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface))', marginBottom: 10, outline: 'none', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={isSubmittingNote || !newNoteContent.trim()}>
                          {isSubmittingNote ? 'Saving…' : 'Post internal note'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="ph2"><h3>Notes history</h3><span className="meta">{memberNotes.length + 1} records</span></div>
                    <div style={{ padding: '4px 0' }}>
                      {memberNotes.map(n => (
                        <div key={n.id} style={{ padding: '14px 24px', borderBottom: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5 }}>{n.author}</b>
                              <span style={{ fontSize: 9.5, color: 'hsl(var(--on-surface-muted))', background: 'rgba(0,0,0,.05)', padding: '1px 6px', borderRadius: 99, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, textTransform: 'uppercase' }}>{n.role}</span>
                            </div>
                            <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{n.date}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>{n.content}</p>
                        </div>
                      ))}
                      <div style={{ padding: '14px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11.5 }}>System</b>
                          <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{selectedMember.joined || 'On join'}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>Member registered via {selectedMember.platform === 'DIASPORA' ? 'diaspora portal' : 'standard registration'}. Status set to {selectedMember.status}.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card tab */}
              {activeDetailTab === 'card' && (
                <div style={{ maxWidth: 520, margin: '0 auto' }}>
                  <div ref={cardRef}>
                    <MembershipCard
                      userName={selectedMember.name}
                      userRegNo={selectedMember.id}
                      gender={selectedMember.gender}
                      country={selectedMember.country}
                      region={selectedMember.region}
                      constituency={selectedMember.constituency}
                      chapter={selectedMember.chapter}
                      status={selectedMember.status === 'Active' ? 'Active member' : selectedMember.status}
                      joinedDate={selectedMember.joined}
                      initials={selectedMember.name.split(' ').map(n => n[0]).join('')}
                      avatarUrl={selectedMember.avatarUrl}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                    <button
                      className="btn btn-outline"
                      onClick={handlePrint}
                      disabled={!selectedMember.avatarUrl}
                      title={!selectedMember.avatarUrl ? 'Member has no profile photo — card cannot be printed' : undefined}
                      style={{ opacity: selectedMember.avatarUrl ? 1 : 0.4, cursor: selectedMember.avatarUrl ? 'pointer' : 'not-allowed' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>Print card
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleDownload}
                      disabled={!selectedMember.avatarUrl}
                      title={!selectedMember.avatarUrl ? 'Member has no profile photo — card cannot be downloaded' : undefined}
                      style={{ opacity: selectedMember.avatarUrl ? 1 : 0.4, cursor: selectedMember.avatarUrl ? 'pointer' : 'not-allowed' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>Download PDF
                    </button>
                  </div>
                  {!selectedMember.avatarUrl && (
                    <p style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
                      Profile photo required to print or download this member's card.
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Audit history modal */}
      {isAuditModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setIsAuditModalOpen(false) }}>
          <div style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 4, overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '24px 28px', borderTop: '4px solid hsl(var(--destructive))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))' }}>lock</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>Audit history</h2>
                  <p style={{ margin: '2px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'rgba(255,255,255,.5)' }}>Full chain of custody for {auditTargetMember}</p>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {!viewingAuditLogs || viewingAuditLogs.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 10 }}>history</span>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>No audit records found for this resource.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {viewingAuditLogs.map(log => (
                    <div key={log.id} style={{ border: '1px solid hsl(var(--border))', borderRadius: 4, padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          <div style={{ width: 32, height: 32, background: 'hsl(var(--container-low))', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>description</span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{new Date(log.timestamp).toLocaleString()}</p>
                            <h4 style={{ margin: '4px 0 2px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13 }}>{log.action}</h4>
                            <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>Processed by: {log.adminName}</p>
                            {log.details && (
                              <div style={{ marginTop: 10, padding: '8px 12px', background: 'hsl(var(--container-low))', borderLeft: '2px solid hsl(var(--border))', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: 'hsl(var(--on-surface))' }}>
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ padding: '2px 8px', fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', borderRadius: 99, background: log.status === 'Success' ? 'rgba(0,107,63,.1)' : 'rgba(218,165,32,.1)', color: log.status === 'Success' ? 'hsl(var(--primary))' : '#a87d10', border: log.status === 'Success' ? '1px solid rgba(0,107,63,.2)' : '1px solid rgba(218,165,32,.2)', flexShrink: 0 }}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setIsAuditModalOpen(false)}>Close history</button>
            </div>
          </div>
        </div>
      )}

      {/* Leadership assignment modal */}
      {isAssignModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setIsAssignModalOpen(false) }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '24px 28px', borderTop: '4px solid hsl(var(--primary))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))' }}>military_tech</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>Appoint leadership</h2>
                  <p style={{ margin: '2px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'rgba(255,255,255,.5)' }}>
                    Assigning {assigningMembers.length} member(s) to command
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>Target chapter</label>
                <select name="name-177083" id="select-177083"
                  value={assignmentData.chapterId}
                  onChange={e => setAssignmentData({ ...assignmentData, chapterId: e.target.value })}
                  style={{ width: '100%', height: 44, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, background: '#fff', color: 'hsl(var(--on-surface))', outline: 'none' }}
                >
                  <option value="">Select a chapter hub…</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city_or_region})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 6 }}>Designated role</label>
                <select name="name-1b73e7" id="select-1b73e7"
                  value={assignmentData.role}
                  onChange={e => setAssignmentData({ ...assignmentData, role: e.target.value })}
                  style={{ width: '100%', height: 44, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, background: '#fff', color: 'hsl(var(--on-surface))', outline: 'none' }}
                >
                  <option value="Chapter Coordinator">Chapter Coordinator</option>
                  <option value="Mobilization Lead">Mobilization Lead</option>
                  <option value="Communications Officer">Communications Officer</option>
                  <option value="Logistics Commander">Logistics Commander</option>
                  <option value="Regional Liaison">Regional Liaison</option>
                </select>
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(218,165,32,.08)', borderLeft: '3px solid hsl(var(--accent))', borderRadius: 2 }}>
                <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, lineHeight: 1.6, fontStyle: 'italic' }}>
                  This appointment will be logged in the permanent audit trail. Appointed leaders gain administrative oversight for their specific chapter.
                </p>
              </div>
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirmAssignment} disabled={isSubmittingAssignment || !assignmentData.chapterId}>
                {isSubmittingAssignment ? 'Processing…' : 'Confirm appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !isDeletingMembers) setIsDeleteModalOpen(false) }}
        >
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 4, overflow: 'hidden' }}>

            {/* Dark header */}
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '28px 28px 24px', borderTop: '4px solid hsl(var(--destructive))', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, opacity: .05 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 120 }}>delete_forever</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                <div style={{ width: 44, height: 44, borderRadius: 4, background: 'rgba(206,17,38,.18)', border: '1px solid rgba(206,17,38,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--destructive))' }}>warning</span>
                </div>
                <div>
                  <div style={{ fontSize: 9.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, color: 'hsl(var(--destructive))', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Irreversible action
                  </div>
                  <h2 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-.01em' }}>
                    Remove {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''}
                  </h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Member list preview */}
              <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
                {members.filter(m => selectedIds.has(m.id)).slice(0, 4).map((m, i, arr) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'hsl(var(--border))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.avatarUrl
                        ? <img src={m.avatarUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{m.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12.5, color: 'hsl(var(--on-surface))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                      <span style={{ fontSize: 10.5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, color: 'hsl(var(--on-surface-muted))', fontVariantNumeric: 'tabular-nums' }}>{m.id.substring(0, 12).toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {selectedIds.size > 4 && (
                  <div style={{ padding: '8px 14px', background: 'rgba(206,17,38,.04)', borderTop: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      + {selectedIds.size - 4} more record{selectedIds.size - 4 !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning text */}
              <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'rgba(206,17,38,.05)', border: '1px solid rgba(206,17,38,.18)', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--destructive))', flexShrink: 0, marginTop: 1 }}>info</span>
                <p style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>
                  These records will be <strong>permanently erased</strong> from the movement database. Authentication credentials, activity history, and all associated data will be destroyed. This action <strong>cannot be undone</strong>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingMembers}
              >
                Cancel
              </button>
              <button
                className="btn btn-dest"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleConfirmDelete}
                disabled={isDeletingMembers}
              >
                {isDeletingMembers
                  ? <><span className="material-symbols-outlined" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}>refresh</span>Removing…</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete_forever</span>Confirm removal</>
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit member modal */}
      {isEditModalOpen && selectedMember && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setIsEditModalOpen(false) }}
        >
          <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 4, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', padding: '22px 28px', borderTop: '4px solid hsl(var(--primary))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--accent))' }}>edit</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff' }}>Edit member info</h2>
                  <p style={{ margin: '2px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11.5, color: 'rgba(255,255,255,.5)' }}>{selectedMember.name}</p>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {([
                { key: 'name',                label: 'Full name',            type: 'text' },
                { key: 'email',               label: 'Email address',        type: 'email' },
                { key: 'phone',               label: 'Phone number',         type: 'text' },
                { key: 'gender',              label: 'Gender',               type: 'select', options: ['Male', 'Female'] },
                { key: 'region',              label: 'Region',               type: 'text' },
                { key: 'constituency',        label: 'Constituency',         type: 'text' },
                { key: 'country',             label: 'Country',              type: 'text' },
                { key: 'chapter',             label: 'Chapter',              type: 'text' },
                { key: 'profession',          label: 'Profession',           type: 'text' },
                { key: 'city',                label: 'City / Town',          type: 'text' },
                { key: 'residentialAddress',  label: 'Residential address',  type: 'text' },
              ] as const).map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif", marginBottom: 5 }}>
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select name="name-e0c791" id="select-e0c791"
                      value={(editForm[field.key as keyof typeof editForm] as string) ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width: '100%', height: 42, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, background: '#fff', color: 'hsl(var(--on-surface))', outline: 'none', boxSizing: 'border-box' }}
                    >
                      <option value="">— select —</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input name="name-16aed2" id="input-16aed2"
                      type={field.type}
                      value={(editForm[field.key as keyof typeof editForm] as string) ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width: '100%', height: 42, border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '0 12px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)} disabled={isSavingEdit}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveEdit} disabled={isSavingEdit}>
                {isSavingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
