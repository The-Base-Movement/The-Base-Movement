import { useState } from 'react'
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
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import RegistrationForm from '@/components/admin/RegistrationForm'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import MembershipCard from '@/components/MembershipCard'

// Mock Data for Members
const membersData = [
  { id: 'TBM-GH-24001', name: 'Kwame Mensah', email: 'kwame.m@example.com', phone: '+233 24 123 4567', region: 'Greater Accra', constituency: 'Ayawaso West', status: 'Active', joined: '2024-01-15', gender: 'Male / 26 - 40', country: 'Ghana', chapter: 'The Base - Accra Chapter', profession: 'Engineer', avatarUrl: 'https://i.pravatar.cc/150?u=kwame' },
  { id: 'TBM-GH-24002', name: 'Abena Osei', email: 'abena.o@example.com', phone: '+233 20 987 6543', region: 'Ashanti', constituency: 'Bantama', status: 'Active', joined: '2024-02-10', gender: 'Female / 26 - 40', country: 'Ghana', chapter: 'The Base - Ashanti Chapter', profession: 'Teacher', avatarUrl: 'https://i.pravatar.cc/150?u=abena' },
  { id: 'TBM-GH-24003', name: 'Kofi Amoah', email: 'kofi.a@example.com', phone: '+233 55 555 5555', region: 'Western', constituency: 'Sekondi', status: 'Pending', joined: '2024-03-01', gender: 'Male / 18 - 25', country: 'Ghana', chapter: 'The Base - Western Chapter', profession: 'Student', avatarUrl: null },
  { id: 'TBM-GH-24004', name: 'Efua Forson', email: 'efua.f@example.com', phone: '+233 24 444 4444', region: 'Central', constituency: 'Cape Coast South', status: 'Active', joined: '2024-03-12', gender: 'Female / 18 - 25', country: 'Ghana', chapter: 'The Base - Central Chapter', profession: 'Nurse', avatarUrl: 'https://i.pravatar.cc/150?u=efua' },
  { id: 'TBM-GH-24005', name: 'Yaw Boateng', email: 'yaw.b@example.com', phone: '+233 27 777 7777', region: 'Eastern', constituency: 'New Juaben South', status: 'Suspended', joined: '2024-03-20', gender: 'Male / 41+', country: 'Ghana', chapter: 'The Base - Eastern Chapter', profession: 'Entrepreneur', avatarUrl: 'https://i.pravatar.cc/150?u=yaw' },
  { id: 'TBM-GH-24006', name: 'Akua Addo', email: 'akua.a@example.com', phone: '+233 24 111 2222', region: 'Greater Accra', constituency: 'Korle Klottey', status: 'Active', joined: '2024-03-25', gender: 'Female / 26 - 40', country: 'Ghana', chapter: 'The Base - Accra Chapter', profession: 'Trader', avatarUrl: null },
  { id: 'TBM-GH-24007', name: 'Osei Tutu', email: 'osei.t@example.com', phone: '+233 50 333 4444', region: 'Ashanti', constituency: 'Manhyia', status: 'Active', joined: '2024-04-02', gender: 'Male / 41+', country: 'Ghana', chapter: 'The Base - Ashanti Chapter', profession: 'Lawyer', avatarUrl: 'https://i.pravatar.cc/150?u=osei' },
  { id: 'TBM-GH-24008', name: 'Ama Serwaa', email: 'ama.s@example.com', phone: '+233 20 555 6666', region: 'Bono', constituency: 'Sunyani East', status: 'Pending', joined: '2024-04-05', gender: 'Female / 26 - 40', country: 'Ghana', chapter: 'The Base - Bono Chapter', profession: 'Accountant', avatarUrl: 'https://i.pravatar.cc/150?u=ama' },
  { id: 'TBM-GH-24009', name: 'Esi Owusu', email: 'esi.o@example.com', phone: '+233 27 888 9999', region: 'Central', constituency: 'Effutu', status: 'Active', joined: '2024-04-10', gender: 'Female / 18 - 25', country: 'Ghana', chapter: 'The Base - Central Chapter', profession: 'Student', avatarUrl: null },
  { id: 'TBM-GH-24010', name: 'Kwabena Yeboah', email: 'kwabena.y@example.com', phone: '+233 24 000 1111', region: 'Western', constituency: 'Tarkwa', status: 'Active', joined: '2024-04-15', gender: 'Male / 26 - 40', country: 'Ghana', chapter: 'The Base - Western Chapter', profession: 'IT Consultant', avatarUrl: 'https://i.pravatar.cc/150?u=kwabena' },
  { id: 'TBM-GH-24011', name: 'Adwoa Mansa', email: 'adwoa.m@example.com', phone: '+233 55 222 3333', region: 'Eastern', constituency: 'Aburi', status: 'Suspended', joined: '2024-04-18', gender: 'Female / 41+', country: 'Ghana', chapter: 'The Base - Eastern Chapter', profession: 'Teacher', avatarUrl: 'https://i.pravatar.cc/150?u=adwoa' },
  { id: 'TBM-GH-24012', name: 'Kweku Baah', email: 'kweku.b@example.com', phone: '+233 20 777 8888', region: 'Volta', constituency: 'Ho Central', status: 'Active', joined: '2024-04-20', gender: 'Male / 26 - 40', country: 'Ghana', chapter: 'The Base - Volta Chapter', profession: 'Doctor', avatarUrl: null },
]

export default function MembersList() {
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedMember, setSelectedMember] = useState<typeof membersData[0] | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  const filteredMembers = membersData.filter(m => {
    const term = searchTerm.toLowerCase()
    return (
      m.name.toLowerCase().includes(term) || 
      m.id.toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term) ||
      m.phone.toLowerCase().includes(term) ||
      m.region.toLowerCase().includes(term) ||
      m.constituency.toLowerCase().includes(term) ||
      m.profession.toLowerCase().includes(term) ||
      m.country.toLowerCase().includes(term)
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
                {paginatedMembers.map((member) => (
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
                          onClick={() => toast({ title: "AUDIT LOG", description: `Retrieving activity history for ${member.id}...` })}
                        >
                          <History className="w-3.5 h-3.5" />
                        </Button>
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
                ))}
                {paginatedMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-500 font-bold uppercase tracking-widest text-xs">
                      No members found matching your search.
                    </td>
                  </tr>
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
            <div className="relative">
              <MembershipCard 
                userName={selectedMember.name}
                userRegNo={selectedMember.id}
                gender={selectedMember.gender}
                country={selectedMember.country}
                region={selectedMember.region}
                constituency={selectedMember.constituency}
                chapter={selectedMember.chapter}
                status={selectedMember.status}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
