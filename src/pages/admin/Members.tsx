import { useState, useRef, useEffect } from 'react'
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
  UserCheck
} from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { adminService, type AuditLogEntry, type Member } from '@/services/adminService'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import RegistrationForm from '@/components/admin/RegistrationForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import MembershipCard from '@/components/MembershipCard'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


export default function MembersList() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('search') || ''
    }
    return ''
  })
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoading(true)
      const data = await adminService.getMembers()
      setMembers(data)
      setIsLoading(false)
    }
    fetchMembers()
  }, [])

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
        // Refresh members
        const data = await adminService.getMembers()
        setMembers(data)
      }
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

  const filteredMembers = members.filter(m => {
    const term = searchTerm.toLowerCase()
    return (
      m.name?.toLowerCase().includes(term) || 
      m.id?.toLowerCase().includes(term) ||
      m.email?.toLowerCase().includes(term) ||
      m.phone?.toLowerCase().includes(term) ||
      m.region?.toLowerCase().includes(term) ||
      m.constituency?.toLowerCase().includes(term)
    )
  })
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
      const data = await adminService.getMembers()
      setMembers(data)
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
      const data = await adminService.getMembers()
      setMembers(data)
    }
  }

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

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
                <Button variant="ghost" className="h-9 px-4 text-micro font-bold tracking-tight text-white hover:bg-white/10">
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
                <tr className="bg-muted/30 border-b border-border/40">
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
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Contact info</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Location details</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Status</th>
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
                  <tr key={member.id} className="hover:bg-muted/30 transition-all group">
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
                        "px-3 py-1 text-micro font-bold tracking-tight rounded-full border inline-flex items-center gap-1.5",
                        member.status === 'Active' 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : member.status === 'Pending'
                          ? "bg-accent/10 text-accent border-accent/20"
                          : "bg-destructive/10 text-destructive border-destructive/20"
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", 
                          member.status === 'Active' ? "bg-primary" : member.status === 'Pending' ? "bg-accent" : "bg-destructive"
                        )} />
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
              {filteredMembers.length > 0 ? (
                <p className="text-micro font-medium text-muted-foreground/80">
                  Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} records
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
          />
        </div>
      )}

      {/* Member Card Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] md:max-w-[600px] p-0 border-none bg-transparent shadow-none [&>button]:hidden">
          {selectedMember && (
            <div className="flex flex-col gap-4">
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
              <Button 
                variant="ghost"
                size="icon"
                className="absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                onClick={() => setSelectedMember(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="default"
                  onClick={handlePrint}
                  className="h-14 bg-white hover:bg-muted/10 border border-border/60 text-on-surface font-bold tracking-tight text-micro shadow-lg rounded-none transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">print</span>
                  Print card
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleDownload}
                  className="h-14 flex-1 rounded-sm text-micro font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">download</span>
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  )
}
