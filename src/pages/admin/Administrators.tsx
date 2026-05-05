import { useState, useEffect } from 'react'
import { 
  Shield, 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  ShieldCheck,
  ShieldAlert,
  Zap
} from 'lucide-react'
import { adminService, type AdminUser } from '@/services/adminService'
import { Button } from '@/components/ui/Button'
import { 
  Card, 
  CardContent
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true)
      const data = await adminService.getAdministrators()
      setAdmins(data)
      setIsLoading(false)
    }
    fetchAdmins()
  }, [])

  const filteredAdmins = admins.filter(a => {
    const term = searchTerm.toLowerCase()
    return (
      a.name?.toLowerCase().includes(term) || 
      a.id?.toLowerCase().includes(term) ||
      a.role?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] tracking-tighter flex items-center gap-3">
            <Shield className="w-8 h-8 text-stone-900" />
            Administrators
          </h1>
          <p className="text-stone-500 text-sm mt-1 font-medium">Authorized personnel with leadership credentials.</p>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold tracking-wider hover:bg-stone-800 shadow-sm"
            onClick={() => toast({ title: "Authorization required", description: "Please use the Identity Vault to provision new administrators.", variant: "destructive" })}
          >
            <UserPlus className="w-3.5 h-3.5 mr-2" />
            Provision administrator
          </Button>
        </div>
      </div>

      {/* Search Card */}
      <Card className="rounded-xl border-stone-200 shadow-sm">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              placeholder="Search by name, ID or role..." 
              className="w-full pl-10 pr-4 h-11 bg-stone-50 border border-stone-100 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[11px] outline-none font-bold tracking-wide placeholder:text-stone-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-wider">Administrator</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-wider">Access level</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-wider">Region</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6"><div className="h-10 bg-stone-100 w-48" /></td>
                      <td className="px-6 py-6"><div className="h-6 bg-stone-100 w-24" /></td>
                      <td className="px-6 py-6"><div className="h-4 bg-stone-100 w-32" /></td>
                      <td className="px-6 py-6 text-right"><div className="h-8 w-8 bg-stone-100 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-bold uppercase tracking-widest text-xs">
                      No authorized personnel found.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center font-bold text-xs shadow-md",
                            admin.role === 'SUPER_ADMIN' ? "bg-[var(--brand-red)] text-white" : "bg-[var(--brand-black)] text-white"
                          )}>
                            {admin.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--brand-black)] uppercase tracking-tight">{admin.name}</p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter mt-0.5">{admin.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          {admin.role === 'SUPER_ADMIN' ? (
                            <ShieldAlert className="w-4 h-4 text-[var(--brand-red)]" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className={cn(
                            "text-[10px] font-bold tracking-wider",
                            admin.role === 'SUPER_ADMIN' ? "text-[var(--brand-red)]" : "text-emerald-600"
                          )}>
                            {admin.role.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-xs font-bold text-stone-600 uppercase tracking-wide">
                          {admin.region || 'National HQ'}
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)]"
                            onClick={() => toast({ title: "IDENTITY VERIFIED", description: `Full audit trail active for ${admin.name}.` })}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-400 hover:text-[var(--brand-red)]"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Security Advisory */}
      <div className="bg-stone-900 p-8 text-white relative overflow-hidden rounded-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-stone-700" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-12 h-12 bg-white/10 flex items-center justify-center shrink-0 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-stone-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wider mb-1">Security protocol</h3>
            <p className="text-stone-400 text-xs leading-relaxed max-w-2xl font-medium">
              Administrative access is governed by movement encryption standards. All actions within the command center are logged in the audit vault for transparency and security.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
