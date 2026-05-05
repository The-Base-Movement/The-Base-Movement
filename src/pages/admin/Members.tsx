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
import { adminService, type AuditLogEntry, type Member } from '@/services/adminService'
import { Button } from '@/components/ui/Button'
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
  const [searchTerm, setSearchTerm] = useState('')
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
      toast({ title: "PERMISSION DENIED", description: "You do not have authorization to verify patriots.", variant: "destructive" })
      return
    }

    if (window.confirm(`Are you sure you want to verify and admit ${name} into the movement?`)) {
      const success = await adminService.verifyMember(id, true, 'Administrative Approval')
      if (success) {
        toast({ title: "PATRIOT VERIFIED", description: `${name} has been successfully admitted.` })
        // Refresh members
        const data = await adminService.getMembers()
        setMembers(data)
      }
    }
  }

  const handlePrint = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 4, useCORS: true, backgroundColor: '#ffffff', logging: false })
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
              @page { size: 85.6mm 53.98mm; margin: 0; }
              body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; -webkit-print-color-adjust: exact; color-adjust: exact; }
              img { width: 85.6mm; height: 53.98mm; display: block; image-rendering: -webkit-optimize-contrast; }
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
      title: "PREPARING MEMBER EXPORT",
      description: "Generating high-fidelity national membership directory...",
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
          title: "EXPORT COMPLETE",
          description: "Membership directory successfully secured and downloaded.",
        })
      }, 1000)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
      toast({
        title: "EXPORT FAILED",
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
      title: "PATRIOT REGISTERED",
      description: "Identity successfully established in the National Database.",
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
      toast({ title: "PERMISSION DENIED", description: "You lack the authority for bulk verification.", variant: "destructive" })
      return
    }

    const count = selectedIds.size
    if (window.confirm(`Are you sure you want to verify and admit all ${count} selected patriots?`)) {
      let successCount = 0
      for (const id of selectedIds) {
        const success = await adminService.verifyMember(id, true, 'Bulk Administrative Approval')
        if (success) successCount++
      }
      
      toast({ 
        title: "BULK VERIFICATION COMPLETE", 
        description: `Successfully admitted ${successCount} patriots into the movement.` 
      })
      
      setSelectedIds(new Set())
      const data = await adminService.getMembers()
      setMembers(data)
    }
  }

  const handleBulkDelete = async () => {
    if (!adminService.can('DELETE_MEMBER', 'MEMBERS')) {
      toast({ title: "PERMISSION DENIED", description: "You lack the authority for member removal.", variant: "destructive" })
      return
    }

    if (window.confirm(`Are you sure you want to PERMANENTLY REMOVE ${selectedIds.size} records from the national database? This cannot be undone.`)) {
      toast({ title: "REMOVING RECORDS", description: "Processing secure deletion..." })
      
      let successCount = 0
      for (const id of selectedIds) {
        const success = await adminService.deleteMember(id)
        if (success) successCount++
      }

      toast({ 
        title: "REMOVAL COMPLETE", 
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black font-meta text-stone-900 uppercase tracking-tighter">Member Directory</h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Manage and coordinate the movement's registered members across all territories.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-11 px-5 rounded-xl border-stone-200 text-[11px] font-bold uppercase tracking-widest hover:bg-stone-50 hover:text-stone-900 shadow-sm transition-all"
            onClick={handleExport}
            disabled={isExporting || members.length === 0}
          >
            <Download className="w-4 h-4 mr-2 text-stone-300" />
            {isExporting ? 'Generating...' : 'Export Members Data'}
          </Button>
          <Button 
            className="h-11 px-6 rounded-xl bg-stone-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-stone-800 shadow-lg shadow-stone-200 transition-all"
            onClick={handleAddMember}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: stats.total, icon: Users, color: 'text-stone-600', bg: 'bg-stone-50' },
          { label: 'Active Status', value: stats.active, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Pending Verification', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50/50' },
          { label: 'Regions Represented', value: stats.regions, icon: Globe2, color: 'text-blue-600', bg: 'bg-blue-50/50' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border-stone-100 shadow-sm overflow-hidden group hover:border-stone-200 transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-stone-900">{stat.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Combined Filter Bar */}
      <Card className="rounded-2xl border-stone-100 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-2 md:p-3">
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                placeholder="Search by name, ID, phone, profession, region..." 
                className="pl-12 h-12 rounded-xl border-none bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-stone-100 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-stone-50/50 md:bg-transparent rounded-xl md:rounded-none">
              <div className="h-8 w-px bg-stone-200 mx-2 hidden md:block" />
              
              <Button variant="ghost" className="flex-1 md:flex-none h-10 px-4 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm transition-all text-[11px] font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4 mr-2 text-stone-300" /> Region
              </Button>
              
              <Button variant="ghost" className="flex-1 md:flex-none h-10 px-4 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-sm transition-all text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 mr-2 text-stone-300" /> Status
              </Button>

              {(searchTerm !== '') && (
                <Button 
                  variant="ghost" 
                  className="h-10 px-4 rounded-xl text-[var(--brand-red)] hover:bg-red-50 text-[11px] font-bold uppercase tracking-wider transition-all"
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="rounded-2xl border-stone-100 shadow-sm overflow-hidden bg-white">
        {selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-stone-900 text-white flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {selectedIds.size} Members Selected
              </p>
              <div className="h-4 w-px bg-stone-700" />
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={handleBulkVerify}
                  className="h-8 px-3 text-[10px] font-bold text-white hover:bg-white/10 uppercase tracking-widest"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-2" /> Verify
                </Button>
                <Button variant="ghost" className="h-8 px-3 text-[10px] font-bold text-white hover:bg-white/10 uppercase tracking-widest">
                  <Globe2 className="w-3.5 h-3.5 mr-2" /> Assign Chapter
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleBulkDelete}
                  className="h-8 px-3 text-[10px] font-bold text-[var(--brand-red)] hover:bg-red-500/10 uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
                </Button>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-8 w-8 p-0 text-stone-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                      checked={selectedIds.size === paginatedMembers.length && paginatedMembers.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">
                    <button className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest group">
                      Member details <ArrowUpDown className="w-3 h-3 group-hover:text-stone-600 transition-colors" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Contact information</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Current status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-stone-100 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-stone-100 w-3/4" />
                            <div className="h-3 bg-stone-100 w-1/2" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-stone-50 w-full" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-stone-50 w-full" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-stone-50 w-16" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-stone-50 ml-auto" /></td>
                    </tr>
                  ))
                ) : paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20">
                      {members.length === 0 ? (
                        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                          <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-stone-300" />
                          </div>
                          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">No members registered</h3>
                          <p className="text-xs text-stone-500 font-medium mt-2 leading-relaxed">
                            The National Directory is currently empty. Start building the movement by establishing your first administrative entries.
                          </p>
                          <Button 
                            onClick={handleAddMember}
                            className="mt-6 h-10 px-6 rounded-xl bg-stone-900 text-white text-[11px] font-bold uppercase tracking-widest"
                          >
                            <Plus className="w-3.5 h-3.5 mr-2" /> Add your first member
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center max-w-sm mx-auto">
                          <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-6">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                          </div>
                          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">No results found</h3>
                          <p className="text-xs text-stone-500 font-medium mt-2 leading-relaxed">
                            We couldn't find any members matching "{searchTerm}". Try adjusting your filters or search terms.
                          </p>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setSearchTerm('')
                              setCurrentPage(1)
                            }}
                            className="mt-6 h-10 px-6 rounded-xl border-stone-200 text-stone-600 text-[11px] font-bold uppercase tracking-widest"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Clear all filters
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                        checked={selectedIds.has(member.id)}
                        onChange={() => handleToggleSelect(member.id)}
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xs rounded-xl shadow-sm overflow-hidden shrink-0 border border-stone-200 transition-transform group-hover:scale-105">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-stone-900 leading-tight group-hover:text-[var(--brand-red)] transition-colors">{member.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">ID: {member.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                          <Mail className="w-3 h-3 text-stone-300" /> {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                          <Phone className="w-3 h-3 text-stone-300" /> {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-xs font-bold text-stone-900">{member.region}</p>
                        <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">{member.constituency}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border inline-flex items-center gap-1.5",
                        member.status === 'Active' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : member.status === 'Pending'
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        <div className={cn("w-1 h-1 rounded-full", 
                          member.status === 'Active' ? "bg-emerald-500" : member.status === 'Pending' ? "bg-amber-500" : "bg-red-500"
                        )} />
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-sm transition-all"
                          title="Audit History"
                          onClick={() => handleViewAudit(member)}
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        {member.status === 'Pending' && adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-amber-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Quick Verify"
                            onClick={() => handleVerify(member.id, member.name)}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-stone-900 hover:bg-white hover:shadow-sm transition-all"
                          title="View Digital Identity"
                          onClick={() => setSelectedMember(member)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-[var(--brand-red)] hover:bg-red-50 transition-all"
                          title="Administrative Controls"
                          onClick={() => toast({ title: "ADMIN CONTROLS", description: `Opening secure vault for ${member.name}...` })}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
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
          <div className="px-6 py-5 border-t border-stone-100 bg-stone-50/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Showing {filteredMembers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} records in national directory
            </p>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border-stone-200 disabled:opacity-30 transition-all hover:bg-white hover:shadow-sm" 
                disabled={currentPage === 1}
                onClick={handlePrevPage}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <div key={i} className={cn("w-1.5 h-1.5 rounded-full", currentPage === i + 1 ? "bg-stone-900" : "bg-stone-200")} />
                ))}
              </div>
              <Button 
                variant="outline" 
                className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-xl border-stone-200 disabled:opacity-30 transition-all hover:bg-white hover:shadow-sm"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
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
                status={selectedMember.status === 'Active' ? 'Active Member' : selectedMember.status}
                joinedDate={selectedMember.joined}
                initials={selectedMember.name.split(' ').map(n => n[0]).join('')}
                avatarUrl={selectedMember.avatarUrl}
              />
              <Button 
                variant="outline"
                size="icon"
                className="absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white"
                onClick={() => setSelectedMember(null)}
              >
                <X className="w-4 h-4" />
              </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handlePrint}
                  className="h-12 bg-white hover:bg-stone-50 border border-stone-200 text-stone-900 font-meta font-black uppercase tracking-widest text-[10px] shadow-lg rounded-none"
                >
                  <span className="material-symbols-outlined text-[18px] mr-2">print</span>
                  Print Card
                </Button>
                <Button 
                  onClick={handleDownload}
                  className="h-12 bg-[var(--brand-black)] hover:bg-stone-800 text-white font-meta font-black uppercase tracking-widest text-[10px] shadow-lg rounded-none"
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
          <div className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-[var(--brand-gold)]" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight font-meta">Audit Vault History</h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                  Full chain of custody for: {auditTargetMember}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            {!viewingAuditLogs || viewingAuditLogs.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                No audit records found for this resource.
              </div>
            ) : (
              <div className="space-y-4">
                {viewingAuditLogs.map((log) => (
                  <div key={log.id} className="border border-stone-100 p-5 group hover:border-[var(--brand-gold)] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-stone-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-stone-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          <h4 className="text-sm font-black text-stone-900 mt-1 uppercase tracking-tight">{log.action}</h4>
                          <p className="text-xs text-stone-500 font-medium mt-1">Processed by: {log.adminName}</p>
                          {log.details && (
                            <div className="mt-3 p-3 bg-stone-50 text-[10px] font-mono text-stone-600 break-all border-l-2 border-stone-200">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                        log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      )}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-stone-50/50 flex justify-end">
            <Button 
              onClick={() => setIsAuditModalOpen(false)}
              className="bg-[var(--brand-black)] text-white text-[10px] font-black uppercase tracking-widest rounded-none h-11 px-8"
            >
              Close Vault
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
