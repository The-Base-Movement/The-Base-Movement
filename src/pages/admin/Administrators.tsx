import { useState, useEffect } from 'react'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  Bolt, 
  MoreHorizontal, 
  Trash2, 
  Activity,
  UserCheck,
  MapPin
} from 'lucide-react'
import { adminService, type AdminUser } from '@/services/adminService'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { cn } from '@/lib/utils'


const formatRole = (role: string) =>
  role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

const isHighPrivilege = (role: string) =>
  role === 'SUPER_ADMIN' || role === 'FOUNDER'

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const fetchAdmins = async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getAdministrators()
      setAdmins(data)
    } catch (err) {
      console.error('Failed to fetch admins:', err)
      toast.error('Failed to load administrative roster.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  const filteredAdmins = admins.filter(a => {
    const term = searchTerm.toLowerCase()
    return (
      a.name?.toLowerCase().includes(term) ||
      a.id?.toLowerCase().includes(term) ||
      a.role?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏛️ Header */}
      <div className="flex-columns items-center">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-on-surface" />
            Personnel & Security
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Authorized personnel with leadership credentials and platform oversight.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold capitalize tracking-tight px-8 h-10 transition-all shadow-lg shadow-brand-green/20 active:scale-95"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Provision Credentials
          </Button>
        </div>
      </div>

      {/* 📊 Intelligence Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-8">
        <TacticalKPI 
          label="Total Admins"
          value={admins.length}
          variant="black"
          description="Authorized platform overseers"
          delta="▲ Stable"
        />
        <TacticalKPI 
          label="Super Admins"
          value={admins.filter(a => isHighPrivilege(a.role)).length}
          variant="red"
          description="Tier-1 security clearance"
          delta="High Risk"
        />
        <TacticalKPI 
          label="Regional Leads"
          value={admins.filter(a => a.role === 'REGIONAL_DIRECTOR').length}
          variant="gold"
          description="Zonal operations command"
          delta="Coordinated"
        />
        <TacticalKPI 
          label="Security Status"
          value="Online"
          variant="green"
          description="Encrypted administrative link"
          trend={{ direction: 'up', value: 'Active' }}
        />
      </div>

      {/* 🔍 Search & Filter */}
      <Card className="rounded-sm border-border/60 shadow-sm mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <input 
              type="text" 
              placeholder="Filter by name, ID or role..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/5 border-none text-micro font-bold normal-case rounded-sm focus:ring-1 focus:ring-on-surface shadow-inner"
            />
          </div>
        </CardContent>
      </Card>

      {/* 📋 Roster Table */}
      <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/5 border-b border-border/10 px-6 py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-bold normal-case font-meta">Administrator Roster</CardTitle>
            <span className="text-micro font-bold normal-case text-muted-foreground/40">{filteredAdmins.length} records active</span>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/5">
                <th className="px-6 py-3 text-left text-micro font-bold normal-case text-muted-foreground/60 tracking-wider">Administrator</th>
                <th className="px-6 py-3 text-left text-micro font-bold normal-case text-muted-foreground/60 tracking-wider">Access level</th>
                <th className="px-6 py-3 text-left text-micro font-bold normal-case text-muted-foreground/60 tracking-wider">Region</th>
                <th className="px-6 py-3 text-right text-micro font-bold normal-case text-muted-foreground/60 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-muted/10 rounded-sm w-48" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-muted/10 rounded-full w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted/10 rounded-sm w-32" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-muted/10 rounded-sm w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-muted/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-sm flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden",
                        isHighPrivilege(admin.role) ? "bg-destructive text-white" : "bg-on-surface text-white"
                      )}>
                        {admin.avatarUrl ? (
                          <img src={admin.avatarUrl} alt={admin.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                        ) : admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold tracking-tight text-on-surface">{admin.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 font-mono">{admin.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isHighPrivilege(admin.role) ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className={cn(
                        "text-micro font-bold normal-case",
                        isHighPrivilege(admin.role) ? "text-destructive" : "text-primary"
                      )}>
                        {formatRole(admin.role)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground/80">
                      <MapPin className="w-3 h-3" />
                      <span className="text-micro font-bold normal-case">{admin.region || 'National HQ'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-sm hover:bg-accent hover:text-black">
                        <Bolt className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-sm"
                          onClick={() => setOpenMenuId(openMenuId === admin.id ? null : admin.id)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        {openMenuId === admin.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border/10 rounded-sm shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                            <button className="w-full text-left px-4 py-2 text-micro font-bold hover:bg-muted/5 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" /> View Activity
                            </button>
                            <button className="w-full text-left px-4 py-2 text-micro font-bold hover:bg-muted/5 flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5" /> Edit Permissions
                            </button>
                            <div className="h-px bg-border/5 my-1" />
                            <button className="w-full text-left px-4 py-2 text-micro font-bold text-destructive hover:bg-destructive/5 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Revoke Access
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 🛡️ Security Footer */}
      <div className="mt-8 p-6 rounded-sm border border-border/40 bg-muted/5 flex items-start gap-4">
        <div className="w-12 h-12 bg-on-surface/5 rounded-sm flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight mb-1">Administrative Security Protocol</h3>
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-2xl">
            Access to these credentials is restricted to authorized personnel. Every action performed in this command center is recorded in the permanent audit ledger for movement integrity.
          </p>
        </div>
      </div>
      
      {openMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  )
}
