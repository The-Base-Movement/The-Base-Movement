import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { 
  Search, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  ArrowUpDown,
  History,
  RotateCcw,
  X,
  Lock,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Globe2,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  UserCheck,
  Crown
} from 'lucide-react'
import { useChapters } from '@/context/ChaptersContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePerformance } from '@/context/PerformanceContext'
import { BrandLine } from '@/components/ui/BrandLine'
import { adminService, type AuditLogEntry, type Member, type MemberDonation, type MemberPollVote, type MemberSession, type MemberNote } from '@/services/adminService'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import RegistrationForm, { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { getCroppedImg } from '@/lib/imageUtils'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import MembershipCard from '@/components/MembershipCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


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
  const { toast } = useToast()
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
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assigningMembers, setAssigningMembers] = useState<Member[]>([])
  const [assignmentData, setAssignmentData] = useState({
    chapterId: '',
    role: 'Chapter Coordinator'
  })
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false)

  const handleOpenAssign = () => {
    if (selectedIds.size > 0) {
      const selected = members.filter(m => selectedIds.has(m.id))
      setAssigningMembers(selected)
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

      toast({
        title: "Leadership Appointed",
        description: `Successfully assigned ${assigningMembers.length} leader(s) to ${selectedChapter.name}.`,
      })
      setIsAssignModalOpen(false)
      setSelectedIds(new Set())
    } catch {
      toast({
        title: "Assignment Failed",
        description: "Critical failure in leadership protocols.",
        variant: "destructive"
      })
    } finally {
      setIsSubmittingAssignment(false)
    }
  }

  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    const { data, totalCount: total } = await adminService.getMembersPaginated(currentPage, itemsPerPage, searchTerm)
    setMembers(data)
    setTotalMembers(total)
    setIsLoading(false)
  }, [currentPage, searchTerm])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const [totalMembers, setTotalMembers] = useState(0)

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
    
    // Fetch Audit Logs
    adminService.getAuditLogsForResource(`MEMBERS/${selectedMember.id}`)
      .then(setDetailLogs).catch(() => {})

    // Fetch detail sections
    Promise.allSettled([
      adminService.getMemberDonations(selectedMember.id).then(setMemberDonations),
      adminService.getMemberPollVotes(selectedMember.id).then(setMemberPollVotes),
      adminService.getMemberSessions(selectedMember.id).then(setMemberSessions),
      adminService.getMemberNotes(selectedMember.id).then(setMemberNotes),
    ])
  }, [selectedMember])

  // Audit Vault State
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
      toast({ title: "Permission denied", description: "You do not have authorization to verify members.", variant: "destructive" })
      return
    }

    if (window.confirm(`Are you sure you want to verify and admit ${name} into the movement?`)) {
      const success = await adminService.verifyMember(id, true, 'Administrative Approval')
      if (success) {
        toast({ title: "Member verified", description: `${name} has been successfully admitted.` })
        fetchMembers()
      }
    }
  }

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !selectedMember) return
    
    setIsSubmittingNote(true)
    try {
      const admin = adminService.getCurrentUser()
      const authorName = admin?.name || 'Admin'
      const authorRole = admin?.role || 'Staff'
      
      const newNote = await adminService.addMemberNote(
        selectedMember.id,
        authorName,
        authorRole,
        newNoteContent
      )
      
      if (newNote) {
        setMemberNotes(prev => [newNote, ...prev])
        setNewNoteContent('')
        toast({ title: "Note added", description: "Successfully recorded in member history." })
      }
    } catch (error) {
      console.error('[ADMIN] Note submission failed:', error)
      toast({ title: "Note failed", description: "Failed to persist administrative note.", variant: "destructive" })
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleSubmitRegistration = async (data: RegistrationSubmission) => {
    setIsSubmittingRegistration(true)
    try {
      let finalAvatarUrl = null
      
      // 1. Process and upload avatar if present
      if (data.photoUrl && data.croppedAreaPixels) {
        try {
          const croppedBlob = await getCroppedImg(data.photoUrl, data.croppedAreaPixels)
          if (croppedBlob) {
            const fileName = `${data.registrationNumber}.jpg`
            const { error: uploadError } = await adminService.uploadAvatar(fileName, croppedBlob)
            if (!uploadError) {
              finalAvatarUrl = adminService.getAvatarPublicUrl(fileName)
            } else {
              console.error('[REGISTRATION] Avatar upload failed:', uploadError)
            }
          }
        } catch (err) {
          console.error('[REGISTRATION] Image processing failed:', err)
        }
      }

      // 2. Prepare user record
      const newUser = {
        id: crypto.randomUUID(), // Generate a new UUID for the member
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
        status: 'Active'
      }

      // 3. Persist to database
      const { error: dbError } = await adminService.registerMember(newUser)
      
      if (dbError) throw dbError

      toast({
        title: "Member Registered",
        description: `${data.fullName} has been successfully added to the directory.`,
      })

      // Refresh the list
      fetchMembers()
      setIsAdding(false)

    } catch (error: unknown) {
      console.error('[REGISTRATION] Submission failed:', error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred during registration."
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      })
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
        windowHeight: document.documentElement.offsetHeight
      })
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(`
        <html>
          <head>
            <title>THE BASE - Official Membership Card</title>
            <style>
              @page { 
                size: 85.6mm 54mm; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 85.6mm;
                height: 54mm;
                overflow: hidden;
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                color-adjust: exact; 
              }
              img { 
                width: 85.6mm; 
                height: 54mm; 
                display: block; 
                object-fit: contain;
                image-rendering: -webkit-optimize-contrast; 
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); }, 200);" />
          </body>
        </html>
      `)
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
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${selectedMember.id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handleExport = async () => {
    if (members.length === 0) return

    setIsExporting(true)
    toast({
      title: "Preparing export",
      description: "Generating membership directory records...",
    })
    
    try {
      // Create CSV content
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Region', 'Constituency', 'Status', 'Joined', 'Type', 'Chapter', 'Country']
      const rows = members.map(m => [
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
        m.country
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `the-base-members-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        setIsExporting(false)
        toast({
          title: "Export complete",
          description: "Membership directory successfully downloaded.",
        })
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      toast({
        title: "Export failed",
        description: "An error occurred while generating the directory.",
        variant: "destructive"
      })
    }
  }

  const handleAddMember = () => {
    setIsAdding(true)
  }

  const handleAddSuccess = () => {
    setIsAdding(false)
    toast({
      title: "Member registered",
      description: "Identity successfully registered in the database.",
      variant: "default",
    })
  }

  // Bulk Actions
  const handleBulkVerify = async () => {
    if (!adminService.can('VERIFY_MEMBER', 'MEMBERS')) {
      toast({ title: "Permission denied", description: "You lack the authority for bulk verification.", variant: "destructive" })
      return
    }

    const count = selectedIds.size
    if (window.confirm(`Are you sure you want to verify and admit all ${count} selected members?`)) {
      let successCount = 0
      for (const id of selectedIds) {
        const success = await adminService.verifyMember(id, true, 'Bulk Administrative Approval')
        if (success) successCount++
      }
      
      toast({ 
        title: "Bulk verification complete", 
        description: `Successfully admitted ${successCount} members into the movement.` 
      })
      
      setSelectedIds(new Set())
      fetchMembers()
    }
  }

  const handleBulkDelete = async () => {
    if (!adminService.can('DELETE_MEMBER', 'MEMBERS')) {
      toast({ title: "Permission denied", description: "You lack the authority for member removal.", variant: "destructive" })
      return
    }

    if (window.confirm(`Are you sure you want to permanently remove ${selectedIds.size} records from the database? This cannot be undone.`)) {
      toast({ title: "Removing records", description: "Processing secure deletion..." })
      
      let successCount = 0
      for (const id of selectedIds) {
        const success = await adminService.deleteMember(id)
        if (success) successCount++
      }

      toast({ 
        title: "Removal complete", 
        description: `Successfully removed ${successCount} records from the database.` 
      })

      setSelectedIds(new Set())
      fetchMembers()
    }
  }

  const totalPages = Math.ceil(totalMembers / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = members

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1)
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedMembers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedMembers.map(m => m.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Summary Stats
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'Active').length,
    pending: members.filter(m => m.status === 'Pending').length,
    regions: new Set(members.filter(m => m.region).map(m => m.region)).size
  }

  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Users className="w-8 h-8 text-on-surface" />
            Member directory
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Movement registration database, identity verification, and regional deployment oversight.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="default" 
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-10 border-border/40 h-12 shadow-sm transition-all active:scale-95"
            onClick={handleExport}
            disabled={isExporting || members.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Ingesting records...' : 'Export intelligence'}
          </Button>
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleAddMember}
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Summary Strip - Balanced Grid */}
      <div className="grid-stats mb-8" style={{ '--grid-min-width': '220px' } as React.CSSProperties}>
        {[
          { label: 'Total members', value: stats.total, icon: Users, color: 'text-on-surface/80', bg: 'bg-muted/10' },
          { label: 'Active status', value: stats.active, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Pending verification', value: stats.pending, icon: Clock, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Regions represented', value: stats.regions, icon: Globe2, color: 'text-primary', bg: 'bg-primary/5' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-sm border-border/40 shadow-sm overflow-hidden group hover:border-border/60 transition-all bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 h-full flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex-1 flow" style={{ '--flow-space': '0.1rem' } as React.CSSProperties}>
                <p className="text-micro font-bold text-muted-foreground/80 m-0 tracking-tight">{stat.label}</p>
                {isLoading ? (
                  <div className="h-7 w-16 bg-muted/20 animate-pulse rounded-sm mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-on-surface leading-tight m-0">
                    {stat.value.toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Combined Filter Bar */}
      <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-2 md:p-3">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
              <Input 
                placeholder="Search by name, ID, phone, profession, region..." 
                className="pl-12 h-12 rounded-sm border-none bg-muted/10 focus:bg-white focus:ring-2 focus:ring-on-surface/20 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-muted/10 md:bg-transparent rounded-sm md:rounded-none">
              <div className="h-8 w-px bg-border/40 mx-2 hidden md:block" />
              
              <div className="flex flex-col w-full md:w-auto">
                <span className="text-micro font-bold text-muted-foreground/80 px-2 md:hidden mb-1">Quick Filters</span>
                <div className="flex flex-row gap-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 md:flex-none h-10 px-6 rounded-sm text-micro font-bold tracking-tight text-on-surface/60 hover:text-on-surface hover:bg-stone-50 transition-all border border-border/40 md:border-none active:scale-95"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground/40" /> Origins
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="flex-1 md:flex-none h-10 px-6 rounded-sm text-micro font-bold tracking-tight text-on-surface/60 hover:text-on-surface hover:bg-stone-50 transition-all border border-border/40 md:border-none active:scale-95"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2 text-muted-foreground/40" /> Statuses
                  </Button>
                </div>
              </div>

              {(searchTerm !== '') && (
                <Button 
                  variant="ghost" 
                  className="h-10 px-4 rounded-sm text-destructive hover:bg-destructive/10 text-micro font-bold tracking-tight transition-all active:scale-95"
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-on-surface text-white flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              <p className="text-micro font-bold tracking-tight text-white/90">
                {selectedIds.size} members selected
              </p>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={handleBulkVerify}
                  className="h-10 px-6 text-micro font-bold tracking-tight text-white hover:bg-white/10 active:scale-95"
                >
                  <UserCheck className="w-4 h-4 mr-2 text-primary" /> Verify
                </Button>
                <Button 
                  variant="ghost" 
                  className="h-9 px-4 text-micro font-bold tracking-tight text-white hover:bg-white/10"
                  onClick={handleOpenAssign}
                >
                  <Globe2 className="w-4 h-4 mr-2 text-primary" /> Assign
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBulkDelete}
                  className="h-10 px-6 text-micro font-bold tracking-tight text-red-400 hover:bg-red-500/10 active:scale-95"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Purge
                </Button>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 w-8 p-0 text-muted-foreground/80 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--container-low)] border-b border-border">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-border/40 text-on-surface focus:ring-on-surface/20"
                      checked={selectedIds.size === paginatedMembers.length && paginatedMembers.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">
                    <Button variant="ghost" className="flex items-center gap-2 text-micro font-bold text-muted-foreground/80 tracking-tight group hover:bg-transparent p-0 h-auto">
                      Member details <ArrowUpDown className="w-3 h-3 group-hover:text-on-surface transition-colors" />
                    </Button>
                  </th>
                  <th className="px-6 py-4 text-[9.5px] font-bold text-on-surface-muted uppercase tracking-[0.06em] font-meta text-left">Contact info</th>
                  <th className="px-6 py-4 text-[9.5px] font-bold text-on-surface-muted uppercase tracking-[0.06em] font-meta text-left">Location details</th>
                  <th className="px-6 py-4 text-[9.5px] font-bold text-on-surface-muted uppercase tracking-[0.06em] font-meta text-left">Status</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-muted/10 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted/10 w-3/4" />
                            <div className="h-3 bg-muted/10 w-1/2" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-full rounded" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-full rounded" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-muted/20 w-16 rounded" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-muted/20 ml-auto rounded" /></td>
                    </tr>
                  ))
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20">
                      {members.length === 0 ? (
                        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                          <div className="w-16 h-16 rounded-sm bg-muted/30 flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                          <h3 className="text-xl font-bold text-on-surface tracking-tight">No members yet</h3>
                          <p className="text-muted-foreground/80 text-sm mt-1 font-medium">Create your first member record to get started.</p>
                          <Button 
                            variant="primary"
                            size="lg"
                            className="mt-6 rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                            onClick={handleAddMember}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add first member
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                          <div className="w-16 h-16 rounded-sm bg-accent/10 flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-accent" />
                          </div>
                          <h3 className="text-sm font-bold text-on-surface tracking-tight">No results found</h3>
                          <p className="text-xs text-muted-foreground/80 font-medium mt-2 leading-relaxed">
                            We couldn't find any members matching "{searchTerm}". Try adjusting your filters or search terms.
                          </p>
                          <Button 
                            variant="default"
                            onClick={() => {
                              setSearchTerm('')
                              setCurrentPage(1)
                            }}
                            className="mt-6 h-11 px-10 rounded-sm text-micro tracking-tight font-bold border-border/40 transition-all active:scale-95"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" /> Clear filters
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                  <tr key={member.id} className={cn("transition-all group", !lowBandwidthMode && "hover:bg-muted/30")}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded border-border/40 text-on-surface focus:ring-on-surface/20"
                        checked={selectedIds.has(member.id)}
                        onChange={() => handleToggleSelect(member.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted/30 text-on-surface/80 flex items-center justify-center font-bold text-xs rounded-sm shadow-sm overflow-hidden shrink-0 border border-border/60 transition-transform group-hover:scale-105">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                          ) : (
                            member.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface leading-tight group-hover:text-destructive transition-colors">{member.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">ID: {member.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-on-surface/80 font-medium">
                          <Mail className="w-3 h-3 text-muted-foreground/40" /> {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface/80 font-medium">
                          <Phone className="w-3 h-3 text-muted-foreground/40" /> {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{member.region}</p>
                        <p className="text-micro font-medium text-muted-foreground/80 tracking-tight mt-0.5">{member.constituency}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "pill",
                        member.status === 'Active' || member.status === 'Approved'
                          ? "pill-ok"
                          : member.status === 'Pending'
                          ? "pill-warn"
                          : "pill-err"
                      )}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 text-muted-foreground/80 hover:text-on-surface hover:bg-stone-50 hover:shadow-sm transition-all active:scale-95"
                          title="Audit History"
                          onClick={() => handleViewAudit(member)}
                        >
                          <History className="w-5 h-5" />
                        </Button>
                        {member.status === 'Pending' && adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-10 h-10 text-accent hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                            title="Quick Verify"
                            onClick={() => handleVerify(member.id, member.name)}
                          >
                            <UserCheck className="w-5 h-5" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 text-muted-foreground/80 hover:text-on-surface hover:bg-stone-50 hover:shadow-sm transition-all active:scale-95"
                          title="View Digital Identity"
                          onClick={() => setSelectedMember(member)}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-10 h-10 text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                          title="Administrative Controls"
                          onClick={() => toast({ title: "Admin controls", description: `Opening secure vault for ${member.name}...` })}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-5 border-t border-border/40 bg-muted/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="min-w-[140px]">
              {members.length > 0 ? (
                <p className="text-micro font-medium text-muted-foreground/80">
                  Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalMembers)} of {totalMembers} records
                </p>
              ) : (
                <p className="text-micro font-medium text-muted-foreground/80">
                  No records found
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="default" 
                className="h-11 px-8 text-micro font-bold tracking-tight rounded-sm border-border/40 disabled:opacity-30 transition-all hover:bg-stone-50 active:scale-95" 
                disabled={currentPage === 1}
                onClick={handlePrevPage}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", currentPage === i + 1 ? "bg-on-surface" : "bg-border/40")} />
                ))}
              </div>
              <Button 
                variant="default" 
                className="h-11 px-8 text-micro font-bold tracking-tight rounded-sm border-border/40 disabled:opacity-30 transition-all hover:bg-stone-50 active:scale-95"
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={handleNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Hub Registration Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <RegistrationForm 
            onClose={() => setIsAdding(false)} 
            onSuccess={handleAddSuccess} 
            onSubmitData={handleSubmitRegistration}
          />
          {isSubmittingRegistration && (
            <div className="absolute inset-0 z-[110] bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-on-surface font-bold tracking-tight text-micro">Finalizing registration...</p>
            </div>
          )}
        </div>
      )}

      {/* Member Detail Panel */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-end"
          style={{ background: 'rgba(15,19,16,.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedMember(null) }}
        >
          <div className="h-full w-full max-w-[900px] overflow-y-auto animate-in slide-in-from-right duration-300" style={{ background: '#f1f5ee' }}>
            {/* Dark gradient profile header */}
            <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', color: '#fff', padding: '24px 28px', position: 'relative', overflow: 'hidden', borderTop: '3px solid hsl(var(--destructive))', borderBottom: '3px solid hsl(var(--brand-green))' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'radial-gradient(circle,rgba(218,165,32,.15),transparent 70%)' }} />
              {/* Close */}
              <button onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}>
                <X className="w-4 h-4" />
              </button>
              {/* Avatar + identity */}
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid hsl(var(--accent))', flexShrink: 0, overflow: 'hidden', background: '#2a332b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedMember.avatarUrl
                    ? <img src={selectedMember.avatarUrl} alt={selectedMember.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 24, color: '#fff' }}>{selectedMember.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, color: 'hsl(var(--accent))', fontFamily: "'Public Sans'", fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'Verified patriot' : 'Pending verification'} · since {selectedMember.joined?.split('-')[0] || '2025'}
                  </div>
                  <h2 style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', marginTop: 4, lineHeight: 1.1 }}>{selectedMember.name}</h2>
                  <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12, color: 'hsl(var(--accent))', marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '.04em' }}>
                    {selectedMember.id.substring(0, 12).toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(218,165,32,.1)', border: '1px solid rgba(218,165,32,.36)', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5, color: 'hsl(var(--accent))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified</span>
                      {selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'KYC verified' : 'Pending KYC'}
                    </span>
                    {selectedMember.constituency && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.constituency}</span>}
                    {selectedMember.region && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.region}</span>}
                    {selectedMember.gender && <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase' }}>{selectedMember.gender}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                  <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.18)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>Message
                  </button>
                  <button className="btn btn-sm btn-dest" onClick={() => toast({ title: 'Flag account', description: `Flagging ${selectedMember.name}…` })}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>flag</span>Flag
                  </button>
                </div>
              </div>
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.08)' }}>
                {[
                  { label: 'Lifetime contribution', val: '₵0',  sub: 'No donations yet' },
                  { label: 'Polls voted',            val: '—',  sub: 'No poll activity' },
                  { label: 'Chapter activity',       val: '—',  sub: 'Events attended YTD' },
                  { label: 'Membership tier',        val: selectedMember.type || 'Citizen', sub: 'Active tier', accent: true },
                ].map((s, i) => (
                  <div key={i} style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,.08)' : 'none', padding: i === 0 ? '0 18px 0 0' : '0 18px' }}>
                    <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.5)', fontFamily: "'Public Sans'", fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 22, letterSpacing: '-.015em', marginTop: 6, fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: s.accent ? 'hsl(var(--accent))' : '#fff' }}>{s.val}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.6)', fontFamily: "'Public Sans'", fontWeight: 700, marginTop: 4 }}>{s.sub}</div>
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
                  style={{ padding: '14px 16px', fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12, color: activeDetailTab === id ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))', background: 'none', border: 'none', borderBottom: activeDetailTab === id ? '2px solid hsl(var(--destructive))' : '2px solid transparent', cursor: 'pointer', letterSpacing: '-.005em', whiteSpace: 'nowrap' }}>
                  {label}
                  {count > 0 && (
                    <span style={{ marginLeft: 6, padding: '1px 7px', background: '#f1f5ee', borderRadius: 99, fontSize: 9, fontFamily: "'Public Sans'", fontWeight: 800 }}>{count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{ padding: '14px' }}>

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
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                  <div>
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph2"><h3>Recent activity</h3><span className="meta">audit trail</span></div>
                      <div className="tl">
                        {detailLogs.length > 0 ? detailLogs.slice(0, 8).map((log, i, arr) => {
                          const s = evStyle(log.action)
                          return (
                          <div key={log.id} style={{ display: 'flex', gap: 12, padding: '12px 0', position: 'relative' }}>
                            {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 36, bottom: -12, width: 1, background: 'hsl(var(--border))' }} />}
                            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.color, flexShrink: 0, zIndex: 1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{s.icon}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}><b style={{ fontFamily: "'Public Sans'", fontWeight: 800 }}>{log.action}</b></p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{new Date(log.timestamp).toLocaleDateString()} · {log.adminName}</span>
                            </div>
                          </div>
                          )
                        }) : [
                          { icon: 'how_to_vote', text: 'Profile created and added to directory', time: selectedMember.joined || 'On join' },
                          { icon: 'verified',    text: 'Status set to ' + (selectedMember.status || 'Pending'),     time: 'On registration' },
                          { icon: 'place',       text: 'Region assigned: ' + (selectedMember.region || '—'),         time: 'Auto' },
                        ].map((e, i, arr) => (
                          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', position: 'relative' }}>
                            {i < arr.length - 1 && <div style={{ position: 'absolute', left: 13, top: 36, bottom: -12, width: 1, background: 'hsl(var(--border))' }} />}
                            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5ee', color: 'hsl(var(--primary))', flexShrink: 0, zIndex: 1 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{e.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{e.text}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{e.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="panel">
                      <div className="ph2"><h3>Contribution history</h3><span className="meta">12 months · ₵</span></div>
                      <div style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginBottom: 14 }}>
                          <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 30, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
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
                          <p style={{ margin: '8px 0 0', fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>No contributions recorded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph2"><h3>Identity snapshot</h3><span className="ph2-meta"><span className={cn('pill', selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'pill-ok' : 'pill-warn')}>{selectedMember.status}</span></span></div>
                      <div style={{ padding: '14px 18px' }}>
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
                              <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans'", alignSelf: 'center' }}>{k}</dt>
                              <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans'", fontWeight: 700 }}>{v}</dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    </div>
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph2"><h3>KYC checks</h3><span className="meta">auto-run</span></div>
                      <div style={{ padding: '14px 18px' }}>
                        {[
                          { ok: true,  label: 'Phone number on file',    detail: selectedMember.phone ? 'verified' : 'missing' },
                          { ok: true,  label: 'Email address registered', detail: selectedMember.email ? 'on file' : 'missing' },
                          { ok: selectedMember.status === 'Active' || selectedMember.status === 'Approved', label: 'Account status approved', detail: selectedMember.status },
                          { ok: !!selectedMember.region, label: 'Region assigned',          detail: selectedMember.region || 'unassigned' },
                          { ok: false, warn: true, label: 'Ghana Card not uploaded',       detail: 'review' },
                        ].map((c, i, arr) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 12 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ok ? 'rgba(0,107,63,.12)' : 'rgba(218,165,32,.14)', color: c.ok ? 'hsl(var(--primary))' : '#a87d10', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.ok ? 'check' : 'warning'}</span>
                            </div>
                            <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, flex: 1 }}>{c.label}</b>
                            <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700, marginLeft: 'auto' }}>{c.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="panel">
                      <div className="ph2"><h3>Admin notes</h3><span className="meta">internal</span></div>
                      <div style={{ padding: '12px 18px' }}>
                        {memberNotes.length > 0 ? memberNotes.slice(0, 3).map((n, i, arr) => (
                          <div key={n.id} style={{ padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5 }}>{n.author}{n.role ? ` · ${n.role}` : ''}</b>
                              <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{n.date}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{n.content}</p>
                          </div>
                        )) : (
                          <>
                            <div style={{ padding: '10px 0', borderBottom: '1px solid hsl(var(--border))' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5 }}>System</b>
                                <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{selectedMember.joined || 'On join'}</span>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
                  <div>
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph2"><h3>Identity</h3><span className={cn('pill', selectedMember.status === 'Active' || selectedMember.status === 'Approved' ? 'pill-ok' : 'pill-warn')}>{selectedMember.status}</span></div>
                      <div style={{ padding: '14px 18px' }}>
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
                              <dt style={{ fontSize: 9.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.06em', textTransform: 'uppercase', fontFamily: "'Public Sans'", alignSelf: 'center' }}>{k}</dt>
                              <dd style={{ margin: 0, fontSize: 12.5, fontFamily: "'Public Sans'", fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
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
                    <div className="panel" style={{ marginBottom: 14 }}>
                      <div className="ph2"><h3>KYC checks</h3><span className="meta">auto-run</span></div>
                      <div style={{ padding: '14px 18px' }}>
                        {[
                          { ok: true,  label: 'Phone number on file',    detail: selectedMember.phone ? 'verified' : 'missing' },
                          { ok: true,  label: 'Email address registered', detail: selectedMember.email ? 'on file' : 'missing' },
                          { ok: selectedMember.status === 'Active' || selectedMember.status === 'Approved', label: 'Account status approved', detail: selectedMember.status },
                          { ok: !!selectedMember.region, label: 'Region assigned', detail: selectedMember.region || 'unassigned' },
                          { ok: false, warn: true, label: 'Ghana Card not uploaded', detail: 'review' },
                        ].map((c, i, arr) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 12 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.ok ? 'rgba(0,107,63,.12)' : 'rgba(218,165,32,.14)', color: c.ok ? 'hsl(var(--primary))' : '#a87d10', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.ok ? 'check' : 'warning'}</span>
                            </div>
                            <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, flex: 1 }}>{c.label}</b>
                            <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700, marginLeft: 'auto' }}>{c.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {adminService.can('VERIFY_MEMBER', 'MEMBERS') && selectedMember.status === 'Pending' && (
                      <div className="panel" style={{ marginBottom: 14 }}>
                        <div className="ph2"><h3>Actions</h3></div>
                        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button className="btn btn-primary" onClick={() => handleVerify(selectedMember.id, selectedMember.name)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>Verify & admit
                          </button>
                          <button className="btn btn-dest">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>Reject application
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Donations tab */}
              {activeDetailTab === 'donations' && (
                <div>
                  <div className="panel" style={{ marginBottom: 14 }}>
                    <div className="ph2"><h3>Contribution summary</h3><span className="meta">all time</span></div>
                    <div style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', marginBottom: 16 }}>
                        <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 36, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
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
                        <p style={{ margin: '6px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>No donation records yet — wire the <code>member_donations</code> table to populate.</p>
                      )}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="ph2"><h3>Donation history</h3><span className="meta">{memberDonations.length} records</span></div>
                    {memberDonations.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>volunteer_activism</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>No donations on record.</p>
                      </div>
                    ) : (
                      <div>
                        {memberDonations.map((d, i, arr) => (
                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(218,165,32,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#a87d10' }}>payments</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5 }}>{d.label}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{d.date} · {d.method} · ref {d.ref}</span>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 13, color: 'hsl(var(--primary))' }}>₵{d.amount.toLocaleString()}</div>
                              <span style={{ fontSize: 10, fontFamily: "'Public Sans'", fontWeight: 700, color: d.cleared ? 'hsl(var(--primary))' : '#a87d10' }}>{d.cleared ? 'cleared' : 'pending'}</span>
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
                    <div className="ph2">
                      <h3>Poll participation</h3>
                      <span className="meta">{memberPollVotes.length} votes cast</span>
                    </div>
                    {memberPollVotes.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>how_to_vote</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>No poll votes on record.</p>
                      </div>
                    ) : (
                      <div>
                        {memberPollVotes.map((v, i, arr) => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>how_to_vote</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5 }}>Poll #{v.pollNumber} — {v.pollTitle}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{v.date}</span>
                            </div>
                            <div style={{ flexShrink: 0, padding: '3px 10px', background: 'rgba(0,107,63,.08)', border: '1px solid rgba(0,107,63,.2)', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))' }}>
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
                    <div className="ph2">
                      <h3>Login sessions</h3>
                      <span className="meta">{memberSessions.length} sessions</span>
                    </div>
                    {memberSessions.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))', display: 'block', marginBottom: 8 }}>devices</span>
                        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>No session records yet.</p>
                      </div>
                    ) : (
                      <div>
                        {memberSessions.map((s, i, arr) => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.current ? 'rgba(0,107,63,.1)' : 'rgba(206,17,38,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 15, color: s.current ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>login</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 12.5 }}>{s.device}</p>
                              <span style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{s.date} · {s.location} · {s.ip}</span>
                            </div>
                            {s.current && (
                              <span style={{ padding: '2px 8px', background: 'rgba(0,107,63,.1)', border: '1px solid rgba(0,107,63,.25)', borderRadius: 99, fontSize: 10, fontFamily: "'Public Sans'", fontWeight: 800, color: 'hsl(var(--primary))' }}>Active</span>
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
                  <div className="panel" style={{ marginBottom: 14 }}>
                    <div className="ph2"><h3>Add administrative note</h3><span className="meta">internal record</span></div>
                    <div style={{ padding: '14px 18px' }}>
                      <textarea 
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Type internal observation or status update..."
                        style={{ width: '100%', minHeight: '80px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 4, padding: '10px', fontSize: 12.5, fontFamily: "'Public Sans'", color: 'hsl(var(--on-surface))', marginBottom: 10, outline: 'none', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-primary btn-sm" 
                          onClick={handleAddNote} 
                          disabled={isSubmittingNote || !newNoteContent.trim()}
                        >
                          {isSubmittingNote ? 'Saving...' : 'Post internal note'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="ph2">
                      <h3>Notes history</h3>
                      <span className="meta">{memberNotes.length + 1} records</span>
                    </div>
                    <div style={{ padding: '4px 0' }}>
                      {memberNotes.map((n) => (
                        <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid hsl(var(--border))' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5 }}>{n.author}</b>
                              <span style={{ fontSize: 9.5, color: 'hsl(var(--on-surface-muted))', background: 'hsl(var(--muted)/0.1)', padding: '1px 6px', borderRadius: 99, fontFamily: "'Public Sans'", fontWeight: 800, textTransform: 'uppercase' }}>{n.role}</span>
                            </div>
                            <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{n.date}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface))', lineHeight: 1.6 }}>{n.content}</p>
                        </div>
                      ))}
                      <div style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <b style={{ fontFamily: "'Public Sans'", fontWeight: 800, fontSize: 11.5 }}>System</b>
                          <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans'", fontWeight: 700 }}>{selectedMember.joined || 'On join'}</span>
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
                    <button className="btn btn-outline" onClick={handlePrint}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>Print card
                    </button>
                    <button className="btn btn-primary" onClick={handleDownload}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>Download PDF
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Audit Vault History Modal */}
      <Dialog open={isAuditModalOpen} onOpenChange={setIsAuditModalOpen}>
        <DialogContent className="max-w-2xl border-none rounded-none p-0 overflow-hidden bg-white">
          <div className="p-8 bg-on-surface text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-accent to-primary"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight font-meta">Audit history</h2>
                <p className="text-micro font-medium text-muted-foreground/80 mt-1">
                  Full chain of custody for {auditTargetMember}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {!viewingAuditLogs || viewingAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight">
                No audit records found for this resource.
              </div>
            ) : (
              <div className="space-y-4">
                {viewingAuditLogs.map((log) => (
                  <div key={log.id} className="border border-border/40 p-5 group hover:border-accent transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-muted/30 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground/80" />
                        </div>
                        <div>
                          <p className="text-micro font-bold tracking-tight text-muted-foreground/80">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <h4 className="text-sm font-bold text-on-surface mt-1 tracking-tight">{log.action}</h4>
                          <p className="text-xs text-muted-foreground/80 font-medium mt-1">Processed by: {log.adminName}</p>
                          {log.details && (
                            <div className="mt-3 p-3 bg-muted/30 text-micro font-mono text-on-surface/80 break-all border-l-2 border-border/60">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-bold tracking-tight border",
                        log.status === 'Success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'
                      )}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border/40 bg-stone-50/50 flex justify-end">
            <Button 
              onClick={() => setIsAuditModalOpen(false)}
              className="bg-on-surface text-white text-micro font-bold tracking-tight rounded-sm h-11 px-8 shadow-md transition-all active:scale-95"
            >
              Close history
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leadership Assignment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md border-none rounded-none p-0 overflow-hidden bg-white">
          <div className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight font-meta">Appoint leadership</h2>
                <p className="text-micro font-medium text-white/60 mt-1">
                  Assigning {assigningMembers.length} member(s) to command
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-micro font-bold text-muted-foreground/40 normal-case">Target Chapter</label>
              <Select 
                value={assignmentData.chapterId} 
                onValueChange={(val) => setAssignmentData({...assignmentData, chapterId: val})}
              >
                <SelectTrigger className="h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm">
                  <SelectValue placeholder="Select a chapter hub..." />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.city_or_region})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-micro font-bold text-muted-foreground/40 normal-case">Designated Role</label>
              <Select 
                value={assignmentData.role} 
                onValueChange={(val) => setAssignmentData({...assignmentData, role: val})}
              >
                <SelectTrigger className="h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm">
                  <SelectValue placeholder="Select leadership role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chapter Coordinator">Chapter Coordinator</SelectItem>
                  <SelectItem value="Mobilization Lead">Mobilization Lead</SelectItem>
                  <SelectItem value="Communications Officer">Communications Officer</SelectItem>
                  <SelectItem value="Logistics Commander">Logistics Commander</SelectItem>
                  <SelectItem value="Regional Liaison">Regional Liaison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted/20 border-l-2 border-accent">
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                Note: This appointment will be logged in the permanent audit trail. Appointed leaders gain administrative oversight for their specific chapter infrastructure.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-border/40 bg-stone-50/50 flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="flex-1 text-micro font-bold tracking-tight rounded-sm h-12 shadow-sm transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignment}
              disabled={isSubmittingAssignment || !assignmentData.chapterId}
              className="flex-1 bg-on-surface text-white text-micro font-bold tracking-tight rounded-sm h-12 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSubmittingAssignment ? 'Processing...' : 'Confirm Appointment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
