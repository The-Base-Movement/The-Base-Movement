import { useState, useEffect } from 'react'
import { useChapters } from '@/context/ChaptersContext'
import { adminService, type AuditLogEntry, type Member } from '@/services/adminService'
import { roleService, type AdminRoleRecord } from '@/services/roleService'
import { constituencyService } from '@/services/constituencyService'
import { toast } from 'sonner'
import { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { type ConstituencyLeader } from '@/types/admin'
import { getCroppedImg } from '@/lib/imageUtils'

export function useMembersActions(members: Member[], fetchMembers: () => void) {
  const { chapters } = useChapters()

  const [isExporting, setIsExporting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [roles, setRoles] = useState<AdminRoleRecord[]>([])
  const [constituencies, setConstituencies] = useState<
    { id: number; name: string; regionName?: string }[]
  >([])

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigningMembers, setAssigningMembers] = useState<Member[]>([])
  const [assignmentData, setAssignmentData] = useState({
    scopeType: 'chapter' as 'chapter' | 'constituency',
    chapterId: '',
    constituencyId: '',
    role: '',
  })
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)

  useEffect(() => {
    roleService.getRoles().then(setRoles).catch(console.error)
    constituencyService.listNames().then(setConstituencies).catch(console.error)
  }, [])

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
    const member = members.find((m) => m.id === id)
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
        national_id: data.ghanaCardNumber || undefined,
        joined_at: new Date().toISOString(),
        status: 'Active',
        registration_source: 'admin',
      }
      const { error: dbError } = await adminService.registerMember(newUser)
      if (dbError) throw dbError

      // Provision a login account so the new member can actually sign in
      // (directory insert alone leaves them without auth). Credentials are sent
      // by email if present, else SMS.
      if (data.email || data.contactNumber) {
        const acct = await adminService.createMemberLogin({
          reg_no: data.registrationNumber,
          name: data.fullName,
          email: data.email,
          phone: data.contactNumber,
        })
        if (acct.created > 0) {
          toast.success(`${data.fullName} added — login created and credentials sent.`)
        } else if (acct.skipped > 0) {
          toast.success(`${data.fullName} added. A login for this email/phone already existed.`)
        } else {
          toast.warning(
            `${data.fullName} was added to the directory, but creating their login failed${acct.error ? `: ${acct.error}` : ''}. They can't sign in yet.`
          )
        }
      } else {
        toast.warning(
          `${data.fullName} was added to the directory. No email or phone, so no login was created.`
        )
      }
      fetchMembers()
      setIsAdding(false)
    } catch (error: unknown) {
      console.error('[REGISTRATION] Submission failed:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred during registration.')
    } finally {
      setIsSubmittingRegistration(false)
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
    toast.success(`${successCount} member${successCount !== 1 ? 's' : ''} moved to trash.`)
    fetchMembers()
  }

  const handleOpenAssign = () => {
    if (selectedIds.size > 0) {
      setAssigningMembers(members.filter((m) => selectedIds.has(m.id)))
      setIsAssignModalOpen(true)
    }
  }

  const handleConfirmAssignment = async () => {
    const { scopeType, chapterId, constituencyId, role } = assignmentData
    const hasTarget = scopeType === 'chapter' ? !!chapterId : !!constituencyId
    if (!hasTarget || !role || assigningMembers.length === 0) return
    setIsSubmittingAssignment(true)
    try {
      if (scopeType === 'chapter') {
        const selectedChapter = chapters.find((c) => c.id === chapterId)
        if (!selectedChapter) throw new Error('Chapter not found')
        for (const member of assigningMembers) {
          await adminService.addChapterLeader(chapterId, {
            name: member.name,
            role,
            imageUrl: member.avatarUrl || '',
          })
        }
        toast.success(`${assigningMembers.length} leader(s) assigned to ${selectedChapter.name}.`)
      } else {
        const selectedConstituency = constituencies.find((c) => String(c.id) === constituencyId)
        if (!selectedConstituency) throw new Error('Constituency not found')
        for (const member of assigningMembers) {
          await constituencyService.addCommitteeMember(selectedConstituency.id, {
            memberId: member.id,
            name: member.name,
            role: role as ConstituencyLeader['role'],
            imageUrl: member.avatarUrl || undefined,
          })
        }
        toast.success(
          `${assigningMembers.length} leader(s) assigned to ${selectedConstituency.name}.`
        )
      }
      setIsAssignModalOpen(false)
      setSelectedIds(new Set())
    } catch {
      toast.error('Critical failure in leadership protocols.')
    } finally {
      setIsSubmittingAssignment(false)
    }
  }

  return {
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
    roles,
    constituencies,
    handleVerify,
    handleConfirmVerify,
    handleViewAudit,
    handleSubmitRegistration,
    handleExport,
    handleToggleSelectAll,
    handleToggleSelect,
    handleBulkVerify,
    handleBulkDelete,
    handleConfirmDelete,
    handleOpenAssign,
    handleConfirmAssignment,
    clearSelection: () => setSelectedIds(new Set()),
  }
}
