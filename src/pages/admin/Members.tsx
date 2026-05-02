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
  ArrowUpDown
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

// Mock Data for Members
const membersData = [
  { id: 'BASE-001', name: 'Kwame Mensah', email: 'kwame.m@example.com', phone: '+233 24 123 4567', region: 'Greater Accra', constituency: 'Ayawaso West', status: 'Active', joined: '2024-01-15' },
  { id: 'BASE-002', name: 'Abena Osei', email: 'abena.o@example.com', phone: '+233 20 987 6543', region: 'Ashanti', constituency: 'Bantama', status: 'Active', joined: '2024-02-10' },
  { id: 'BASE-003', name: 'Kofi Amoah', email: 'kofi.a@example.com', phone: '+233 55 555 5555', region: 'Western', constituency: 'Sekondi', status: 'Pending', joined: '2024-03-01' },
  { id: 'BASE-004', name: 'Efua Forson', email: 'efua.f@example.com', phone: '+233 24 444 4444', region: 'Central', constituency: 'Cape Coast South', status: 'Active', joined: '2024-03-12' },
  { id: 'BASE-005', name: 'Yaw Boateng', email: 'yaw.b@example.com', phone: '+233 27 777 7777', region: 'Eastern', constituency: 'New Juaben South', status: 'Suspended', joined: '2024-03-20' },
]

export default function MembersList() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Member Directory</h1>
          <p className="text-stone-500 text-sm mt-1">Manage and coordinate the movement's registered members.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 text-[10px] uppercase font-bold tracking-widest border-stone-200">
            <Download className="w-4 h-4 mr-2" /> Export List
          </Button>
          <Button variant="primary" className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            <UserPlus className="w-4 h-4 mr-2" /> Add New Member
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
                placeholder="Search by name, ID, or email..." 
                className="pl-10 h-11 rounded-none border-stone-200 focus:ring-[var(--brand-green)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button variant="outline" className="flex-1 lg:w-32 h-11 rounded-none border-stone-200 text-[10px] font-bold uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5 mr-2" /> Region
              </Button>
              <Button variant="outline" className="flex-1 lg:w-32 h-11 rounded-none border-stone-200 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 mr-2" /> Status
              </Button>
              <div className="h-11 w-px bg-stone-200 mx-2 hidden lg:block" />
              <Button variant="ghost" className="h-11 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-[var(--brand-red)]">
                Reset
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
                {membersData.map((member) => (
                  <tr key={member.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--brand-black)] text-white flex items-center justify-center font-bold text-xs rounded-none shadow-md">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--brand-black)] leading-tight">{member.name}</p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">{member.id}</p>
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
                    <td className="px-6 py-5 text-right">
                      <Button variant="ghost" size="icon" className="text-stone-400 hover:text-[var(--brand-black)]">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Showing 1-5 of 45,280 members</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-none border-stone-200 disabled:opacity-50" disabled>Previous</Button>
              <Button variant="outline" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-none border-stone-200">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
