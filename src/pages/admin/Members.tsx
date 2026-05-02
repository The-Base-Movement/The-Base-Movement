import { useState, useRef, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck,
  UserPlus,
  ArrowUpDown,
  MessageSquare,
  History,
  RotateCcw,
  X,
  Lock,
  FileText
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
  const itemsPerPage = 5
  const cardRef = useRef<HTMLDivElement>(null)

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
    setIsExporting(true)
    toast({
      title: "PREPARING MEMBER EXPORT",
      description: "Generating high-fidelity regional membership directory...",
    })
    
    setTimeout(() => {
      setIsExporting(false)
      toast({
        title: "EXPORT COMPLETE",
        description: "Membership directory successfully secured and ready for download.",
        variant: "default",
      })
    }, 2000)
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

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Member Directory</h1>
          <p className="text-stone-500 text-sm mt-1">Manage and coordinate the movement's registered members.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            className="rounded-none border-stone-200 text-[9px] sm:text-[10px] px-2 sm:px-4 font-black uppercase tracking-widest hover:bg-stone-50 hover:text-stone-900 flex-1 sm:flex-none"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">{isExporting ? 'GENERATING...' : 'Export List'}</span>
            <span className="sm:hidden ml-1">{isExporting ? '...' : 'Export'}</span>
          </Button>
          <Button 
            className="rounded-none bg-[var(--brand-black)] text-white text-[9px] sm:text-[10px] px-2 sm:px-4 font-black uppercase tracking-widest hover:bg-stone-800 flex-1 sm:flex-none"
            onClick={handleAddMember}
          >
            <UserPlus className="w-3.5 h-3.5 sm:mr-2" />
            <span className="hidden sm:inline">Add New Member</span>
            <span className="sm:hidden ml-1">Add Member</span>
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="rounded-none border-stone-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input 
                placeholder="Search by name, ID, phone, profession, region..." 
                className="pl-10 h-11 rounded-none border-stone-200 focus:ring-[var(--brand-green)]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button variant="outline" className="flex-1 lg:w-32 h-11 px-2 rounded-none border-stone-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 mr-1 sm:mr-2" /> Region
              </Button>
              <Button variant="outline" className="flex-1 lg:w-32 h-11 px-2 rounded-none border-stone-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 sm:mr-2" /> Status
              </Button>
              <div className="h-11 w-px bg-stone-200 mx-1 sm:mx-2 hidden sm:block" />
              <Button 
                variant="ghost" 
                size="icon"
                className="h-11 w-11 shrink-0 text-stone-400 hover:text-[var(--brand-red)] hover:bg-stone-100"
                onClick={() => {
                  setSearchTerm('')
                  setCurrentPage(1)
                }}
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4">
                    <button className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest group">
                      Member Details <ArrowUpDown className="w-3 h-3 group-hover:text-stone-600 transition-colors" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Region / Constituency</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
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
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500 font-bold uppercase tracking-widest text-xs">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--brand-black)] text-white flex items-center justify-center font-bold text-xs rounded-none shadow-md overflow-hidden shrink-0">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[var(--brand-black)] leading-tight">{member.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">{member.id}</p>
                            <span className="text-[9px] text-stone-300">•</span>
                            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest truncate max-w-[80px] sm:max-w-none">{member.gender}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                          <Mail className="w-3 h-3 text-stone-400" /> {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                          <Phone className="w-3 h-3 text-stone-400" /> {member.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[var(--brand-red)] mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-stone-900">{member.region}</p>
                          <p className="text-[10px] font-medium text-stone-500 uppercase tracking-wide">{member.constituency}</p>
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{member.country} • {member.chapter}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-none border inline-block",
                        member.status === 'Active' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : member.status === 'Pending'
                          ? "bg-amber-50 text-amber-600 border-amber-100"
                          : "bg-red-50 text-red-600 border-red-100"
                      )}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)] hover:bg-stone-100"
                          title="Direct Message"
                          onClick={() => toast({ title: "DIRECT MESSAGE", description: `Opening secure channel with ${member.name}...` })}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)] hover:bg-stone-100"
                          title="Audit History"
                          onClick={() => handleViewAudit(member)}
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
                        {member.status === 'Pending' && adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-amber-500 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Verify Patriot"
                            onClick={() => handleVerify(member.id, member.name)}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <div className="w-px h-4 bg-stone-200 mx-1" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)] hover:bg-stone-100"
                          title="View Digital Card"
                          onClick={() => setSelectedMember(member)}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 text-stone-400 hover:text-[var(--brand-red)] hover:bg-red-50"
                          title="Manage Status"
                          onClick={() => toast({ title: "MANAGE MEMBER", description: `Opening administrative controls for ${member.name}...` })}
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
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Showing {filteredMembers.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-none border-stone-200 disabled:opacity-50" 
                disabled={currentPage === 1}
                onClick={handlePrevPage}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-none border-stone-200 disabled:opacity-50"
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
