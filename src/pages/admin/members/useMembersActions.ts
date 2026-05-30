import { useRef, useState } from 'react'
import { useChapters } from '@/context/ChaptersContext'
import { adminService, type AuditLogEntry, type Member } from '@/services/adminService'
import { toast } from 'sonner'
import { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { getCroppedImg } from '@/lib/imageUtils'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function useMembersActions(
  members: Member[],
  selectedMember: Member | null,
  setSelectedMember: (m: Member | null) => void,
  fetchMembers: () => void
) {
  const { chapters } = useChapters()
  const cardRef = useRef<HTMLDivElement>(null)

  const [isExporting, setIsExporting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false)

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

  const [viewingAuditLogs, setViewingAuditLogs] = useState<AuditLogEntry[] | null>(null)
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditTargetMember, setAuditTargetMember] = useState<string | null>(null)

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyingMembers, setVerifyingMembers] = useState<Member[]>([])
  const [isVerifyingMembers, setIsVerifyingMembers] = useState(false)

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

  const handleVerify = async (id: string, _name: string) => {
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
      setVerifyingMembers([member])
      setIsVerifyModalOpen(true)
    }
  }

  const handleConfirmVerify = async () => {
    setIsVerifyingMembers(true)
    let successCount = 0
    for (const member of verifyingMembers) {
      const success = await adminService.verifyMember(
        member.id,
        true,
        verifyingMembers.length > 1 ? 'Bulk Administrative Approval' : 'Administrative Approval'
      )
      if (success) successCount++
    }
    setIsVerifyingMembers(false)
    setIsVerifyModalOpen(false)
    if (successCount > 0) {
      toast.success(
        `Successfully admitted ${successCount} member${successCount > 1 ? 's' : ''} into the movement.`
      )
      if (verifyingMembers.length > 1) setSelectedIds(new Set())
      fetchMembers()
    }
  }

  const handleViewAudit = async (member: Member) => {
    setAuditTargetMember(member.name)
    const logs = await adminService.getAuditLogsForResource(`MEMBERS/${member.id}`)
    setViewingAuditLogs(logs)
    setIsAuditModalOpen(true)
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
        emergency_name: data.emergencyContactName,
        emergency_relationship: data.emergencyRelationship,
        emergency_phone: data.emergencyNumber,
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

  const handleToggleSelectAll = (paginatedMembers: Member[]) => {
    if (selectedIds.size === paginatedMembers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(paginatedMembers.map((m) => m.id)))
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkVerify = async () => {
    if (!adminService.can('VERIFY_MEMBER', 'MEMBERS')) {
      toast.error('You lack the authority for bulk verification.')
      return
    }
    const selectedMembers = members.filter((m) => selectedIds.has(m.id))
    if (selectedMembers.length === 0) return
    setVerifyingMembers(selectedMembers)
    setIsVerifyModalOpen(true)
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
    fetchMembers()
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

  const handleSaveEdit = async () => {
    if (!selectedMember) return
    setIsSavingEdit(true)
    try {
      await adminService.updateMemberProfile(selectedMember.id, editForm)
      toast.success('Member profile updated.')
      setIsEditModalOpen(false)
      setSelectedMember({ ...selectedMember, ...editForm } as Member)
      fetchMembers()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred while updating.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  return {
    cardRef,
    isExporting,
    isAdding,
    setIsAdding,
    isSubmittingRegistration,
    selectedIds,
    isAssignModalOpen,
    setIsAssignModalOpen,
    assigningMembers,
    assignmentData,
    setAssignmentData,
    isSubmittingAssignment,
    isEditModalOpen,
    setIsEditModalOpen,
    editForm,
    setEditForm,
    isSavingEdit,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeletingMembers,
    viewingAuditLogs,
    isAuditModalOpen,
    setIsAuditModalOpen,
    auditTargetMember,
    isVerifyModalOpen,
    setIsVerifyModalOpen,
    verifyingMembers,
    isVerifyingMembers,
    chapters,
    handleVerify,
    handleConfirmVerify,
    handleViewAudit,
    handleSubmitRegistration,
    handlePrint,
    handleDownload,
    handleExport,
    handleToggleSelectAll,
    handleToggleSelect,
    handleBulkVerify,
    handleBulkDelete,
    handleConfirmDelete,
    handleOpenAssign,
    handleConfirmAssignment,
    openEditModal,
    handleSaveEdit,
    clearSelection: () => setSelectedIds(new Set()),
  }
}
