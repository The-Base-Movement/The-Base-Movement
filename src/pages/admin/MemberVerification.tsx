import { useState } from 'react'
import { 
  ShieldCheck, 
  XCircle, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  UserCheck
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

// Mock Data for Pending Verifications
const pendingMembers = [
  { id: 'REG-882', name: 'Emmanuel Tetteh', region: 'Greater Accra', constituency: 'Tema West', type: 'Premium', submitted: '2 hours ago', status: 'Pending' },
  { id: 'REG-881', name: 'Yaa Konadu', region: 'Ashanti', constituency: 'Oforikrom', type: 'Standard', submitted: '5 hours ago', status: 'In Review' },
  { id: 'REG-880', name: 'Ishmael Mensah', region: 'Western', constituency: 'Effia', type: 'Standard', submitted: '1 day ago', status: 'Pending' },
  { id: 'REG-879', name: 'Sarah Owusu', region: 'Central', constituency: 'KEEA', type: 'Premium', submitted: '1 day ago', status: 'Pending' },
]

export default function MemberVerification() {
  const [selectedMember, setSelectedMember] = useState<any>(null)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Identity Verification</h1>
          <p className="text-stone-500 text-sm mt-1">Review and approve new member registrations for movement security.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-amber-50 border border-amber-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">24 Pending Reviews</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Pending List */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input placeholder="Search registrations..." className="pl-9 h-9 text-xs rounded-none border-stone-200" />
              </div>
              <Button variant="outline" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-none border-stone-200">
                <Filter className="w-3.5 h-3.5 mr-2" /> Recent First
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-stone-50">
                {pendingMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className={cn(
                      "p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all",
                      selectedMember?.id === member.id ? "bg-[var(--brand-black)] text-white" : "hover:bg-stone-50"
                    )}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 flex items-center justify-center font-bold text-xs shadow-inner",
                        selectedMember?.id === member.id ? "bg-white/10" : "bg-stone-100 text-stone-400"
                      )}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm font-black uppercase tracking-tight leading-none",
                          selectedMember?.id === member.id ? "text-white" : "text-[var(--brand-black)]"
                        )}>
                          {member.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{member.id}</span>
                          <span className="w-1 h-1 bg-current opacity-20 rounded-full" />
                          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{member.submitted}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-tight">{member.region}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">{member.constituency}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                        member.status === 'In Review' 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-stone-500/10 text-stone-500 border-stone-500/20"
                      )}>
                        {member.status}
                      </div>
                      <ArrowRight className={cn(
                        "w-4 h-4 transition-transform",
                        selectedMember?.id === member.id ? "translate-x-1 opacity-100" : "opacity-20"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Panel */}
        <div className="xl:col-span-1">
          {selectedMember ? (
            <div className="space-y-6 sticky top-8">
              <Card className="rounded-none border-stone-900 bg-[var(--brand-black)] text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck className="w-32 h-32 rotate-12" />
                </div>
                <CardHeader className="p-8 border-b border-white/10 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-[var(--brand-red)] uppercase tracking-[0.2em]">Reviewing File</span>
                      <CardTitle className="text-2xl font-black font-meta uppercase tracking-tighter mt-1">{selectedMember.name}</CardTitle>
                    </div>
                    <div className="w-16 h-16 bg-white/10 p-1">
                      <div className="w-full h-full bg-stone-800 flex items-center justify-center text-[10px] font-bold uppercase text-stone-500 italic">
                        Photo
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8 relative z-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Voter ID Status</p>
                      <p className="text-xs font-black uppercase flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">Membership Type</p>
                      <p className="text-xs font-black uppercase text-[var(--brand-gold)]">{selectedMember.type}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Verification Steps</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Database Cross-reference</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Email/Phone Verification</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5">
                        <div className="w-4 h-4 rounded-full border border-stone-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-stone-600" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tight text-stone-500">Regional Chapter Approval</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button variant="outline" className="h-12 border-white/10 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-all text-[10px] font-black uppercase tracking-widest">
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button variant="primary" className="h-12 bg-[var(--brand-green)] text-white hover:bg-emerald-600 transition-all text-[10px] font-black uppercase tracking-widest">
                      <UserCheck className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none border-stone-200 shadow-sm">
                <CardContent className="p-6">
                  <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-black)]">
                    <Eye className="w-4 h-4 mr-2" /> View Full Registration Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-[400px] border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 gap-4">
              <ShieldCheck className="w-12 h-12 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">Select a file to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
