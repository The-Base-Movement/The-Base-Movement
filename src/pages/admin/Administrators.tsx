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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { AdminRole, AdminPermission } from '@/types/admin'

const DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  'SUPER_ADMIN': [
    { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
    { action: 'DELETE_MEMBER', resource: 'MEMBERS' },
    { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
    { action: 'MANAGE_POLLS', resource: 'POLLS' },
    { action: 'MANAGE_INVENTORY', resource: 'STORE' },
    { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
    { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
    { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' }
  ],
  'REGIONAL_DIRECTOR': [
    { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
    { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
    { action: 'MANAGE_POLLS', resource: 'POLLS' },
    { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' }
  ],
  'CONSTITUENCY_LEAD': [
    { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
    { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' }
  ],
  'VERIFIER': [
    { action: 'VERIFY_MEMBER', resource: 'MEMBERS' }
  ]
}

export default function Administrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [newAdmin, setNewAdmin] = useState({ id: '', role: 'VERIFIER' as AdminRole })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchAdmins = async () => {
    setIsLoading(true)
    const data = await adminService.getAdministrators()
    setAdmins(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleProvision = async () => {
    if (!newAdmin.id) {
      toast({ title: "Validation Error", description: "Please enter a valid Patriot ID.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    try {
      const success = await adminService.provisionAdministrator(
        newAdmin.id, 
        newAdmin.role, 
        DEFAULT_PERMISSIONS[newAdmin.role]
      )

      if (success) {
        toast({ title: "Access granted", description: `Credentials provisioned for ${newAdmin.id}.` })
        setIsProvisionModalOpen(false)
        setNewAdmin({ id: '', role: 'VERIFIER' })
        fetchAdmins()
      } else {
        toast({ title: "Provisioning failed", description: "Ensure the ID exists and is not already an admin.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke administrative access for ${name}?`)) return

    const success = await adminService.revokeAdministrator(id)
    if (success) {
      toast({ title: "Access revoked", description: `${name} has been decommissioned.` })
      fetchAdmins()
    } else {
      toast({ title: "Revocation failed", description: "An error occurred while revoking access.", variant: "destructive" })
    }
  }

  const handleUpdatePermissions = async () => {
    if (!selectedAdmin) return
    toast({ title: "Permissions updated", description: `Access controls refined for ${selectedAdmin.name}.` })
    setIsPermissionsModalOpen(false)
  }

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
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-stone-900" />
            Administrators
          </h1>
          <p className="text-stone-500 text-sm mt-1">Authorized personnel with leadership credentials.</p>
        </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm"
            onClick={() => setIsProvisionModalOpen(true)}
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
              className="w-full pl-10 pr-4 h-11 bg-stone-50 border border-stone-100 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[11px] outline-none font-bold placeholder:text-stone-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Table (Desktop) */}
      <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400">Administrator</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400">Access level</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400">Region</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 text-right">Actions</th>
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
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 font-bold text-xs normal-case">
                      No authorized personnel found.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center font-bold text-xs shadow-md overflow-hidden rounded-lg",
                            admin.role === 'SUPER_ADMIN' ? "bg-red-600 text-white" : "bg-stone-900 text-white"
                          )}>
                            {admin.avatarUrl ? (
                              <img src={admin.avatarUrl} alt={admin.name} className="w-full h-full object-cover" />
                            ) : (
                              admin.name.split(' ').map(n => n[0]).join('')
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900 tracking-tight">{admin.name}</p>
                            <p className="text-[10px] font-bold text-stone-400 mt-0.5">{admin.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          {admin.role === 'SUPER_ADMIN' ? (
                            <ShieldAlert className="w-4 h-4 text-red-600" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className={cn(
                            "text-[10px] font-bold",
                            admin.role === 'SUPER_ADMIN' ? "text-red-600" : "text-emerald-600"
                          )}>
                            {admin.role.charAt(0).toUpperCase() + admin.role.slice(1).toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-xs font-bold text-stone-600">
                          {admin.region || 'National HQ'}
                        </p>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-400 hover:text-stone-900"
                            onClick={() => {
                              setSelectedAdmin(admin)
                              setIsActivityModalOpen(true)
                              toast({ title: "Identity verified", description: `Full audit trail active for ${admin.name}.` })
                            }}
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-8 h-8 text-stone-400 hover:text-red-600"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl border-stone-200">
                              <DropdownMenuLabel className="text-[10px] font-bold text-stone-400">Admin Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-xs font-bold py-2 cursor-pointer"
                                onSelect={() => {
                                  setSelectedAdmin(admin)
                                  setIsPermissionsModalOpen(true)
                                }}
                              >
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-xs font-bold py-2 cursor-pointer"
                                onSelect={() => {
                                  setSelectedAdmin(admin)
                                  setIsActivityModalOpen(true)
                                }}
                              >
                                Activity Logs
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-xs font-bold text-red-600 py-2 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                                onSelect={() => handleRevoke(admin.id, admin.name)}
                              >
                                Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Admins Grid (Mobile) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl border-stone-200 shadow-sm animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 bg-stone-100 w-32" />
                    <div className="h-3 bg-stone-100 w-24" />
                  </div>
                </div>
                <div className="h-8 bg-stone-100 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-10 text-stone-400 font-bold text-xs">
            No authorized personnel found.
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <Card key={admin.id} className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 flex items-center justify-center font-bold text-sm shadow-md overflow-hidden rounded-xl",
                      admin.role === 'SUPER_ADMIN' ? "bg-red-600 text-white" : "bg-stone-900 text-white"
                    )}>
                      {admin.avatarUrl ? (
                        <img src={admin.avatarUrl} alt={admin.name} className="w-full h-full object-cover" />
                      ) : (
                        admin.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 tracking-tight">{admin.name}</h4>
                      <p className="text-[10px] font-bold text-stone-400 mt-0.5 uppercase tracking-widest">{admin.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-50 rounded-full border border-stone-100">
                    {admin.role === 'SUPER_ADMIN' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter",
                      admin.role === 'SUPER_ADMIN' ? "text-red-600" : "text-emerald-600"
                    )}>
                      {admin.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Region</span>
                    <span className="text-[10px] font-bold text-stone-900 uppercase">{admin.region || 'National HQ'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-10 rounded-xl border-stone-200 text-stone-600 text-[10px] font-bold hover:bg-stone-50"
                      onClick={() => {
                        setSelectedAdmin(admin)
                        setIsActivityModalOpen(true)
                      }}
                    >
                      <Zap className="w-3.5 h-3.5 mr-2" /> Activity
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-10 px-4 rounded-xl border-stone-200 text-stone-400 hover:text-red-600"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-stone-200">
                        <DropdownMenuLabel className="text-[10px] font-bold text-stone-400">Admin Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-xs font-bold py-2"
                          onSelect={() => {
                            setSelectedAdmin(admin)
                            setIsPermissionsModalOpen(true)
                          }}
                        >
                          Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-xs font-bold text-red-600 py-2 hover:bg-red-50 focus:bg-red-50"
                          onSelect={() => handleRevoke(admin.id, admin.name)}
                        >
                          Revoke Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Advisory */}
      <div className="bg-stone-50 border border-stone-200 p-8 text-stone-600 relative overflow-hidden rounded-xl shadow-sm">
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-12 h-12 bg-stone-100 flex items-center justify-center shrink-0 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-stone-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">Security protocol</h3>
            <p className="text-stone-500 text-xs leading-relaxed max-w-2xl font-medium">
              Administrative access is governed by movement encryption standards. All actions within the command center are logged in the audit vault for transparency and security.
            </p>
          </div>
        </div>
      </div>

      {/* Provision Modal */}
      <Dialog open={isProvisionModalOpen} onOpenChange={setIsProvisionModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Provision administrator</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Assign administrative credentials to an existing movement patriot.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400">Patriot ID (Registration Number)</label>
              <Input 
                placeholder="e.g. PATRIOT-123456" 
                value={newAdmin.id}
                onChange={(e) => setNewAdmin({ ...newAdmin, id: e.target.value })}
                className="rounded-lg border-stone-200 text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400">Access Level / Role</label>
              <select 
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as AdminRole })}
                className="w-full h-10 px-3 text-xs font-bold border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
              >
                <option value="VERIFIER">Verifier</option>
                <option value="CONSTITUENCY_LEAD">Constituency Lead</option>
                <option value="REGIONAL_DIRECTOR">Regional Director</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="rounded-lg h-10 text-xs font-bold border-stone-200"
              onClick={() => setIsProvisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="rounded-lg h-10 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800"
              onClick={handleProvision}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Provisioning...' : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Modal */}
      <Dialog open={isPermissionsModalOpen} onOpenChange={setIsPermissionsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Access control / Permissions</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Refine administrative privileges for {selectedAdmin?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                'Verify member', 'Delete member', 'Manage chapter', 
                'Manage polls', 'Manage inventory', 'View audit logs'
              ].map((perm) => (
                <div key={perm} className="flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-lg">
                  <span className="text-[10px] font-bold text-stone-600 tracking-tight">{perm}</span>
                  <div className="w-8 h-4 bg-stone-900 rounded-full relative">
                    <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="rounded-lg h-10 text-xs font-bold border-stone-200"
              onClick={() => setIsPermissionsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="rounded-lg h-10 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800"
              onClick={handleUpdatePermissions}
            >
              Update Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Logs Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Audit vault / Activity logs</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Complete movement engagement history for {selectedAdmin?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {[
              { action: 'Member verified', target: 'PAT-88291', time: '14 minutes ago' },
              { action: 'Chapter modified', target: 'Ashanti Central', time: '2 hours ago' },
              { action: 'Poll launched', target: 'National Sentiment 2026', time: 'Yesterday' }
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-stone-50/50 border border-stone-100 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-stone-900 tracking-tight">{log.action}</span>
                  <span className="text-[9px] font-bold text-stone-400 mt-0.5">{log.target}</span>
                </div>
                <span className="text-[9px] font-bold text-stone-400">{log.time}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              className="rounded-lg h-10 text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 w-full"
              onClick={() => setIsActivityModalOpen(false)}
            >
              Close Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
