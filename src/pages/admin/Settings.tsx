import { useState, useEffect, useRef } from 'react'

import { 
  User as UserIcon, 
  Shield, 
  Globe, 
  Lock,
  Users,

  Camera,
  Loader2,
  ChevronRight,
  Smartphone,
  History,
  Search,
  Megaphone,
  Mail,
  Image as ImageIcon,
  Upload,
  Twitter,
  Building2,
  Palette,
  FileText
} from 'lucide-react'

import { adminService, type AuditLogEntry, type AdminUser } from '@/services/adminService'
import type { Factor, AuthError, Session, User } from '@supabase/supabase-js'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type InterfaceDensity = 'Comfortable' | 'Compact' | 'High Density';

interface SupabaseAuthWithMFA {
  mfa: {
    listFactors: () => Promise<{ data: { all: Factor[] }, error: AuthError | null }>;
    enroll: (params: { factorType: 'totp' }) => Promise<{ data: { id: string, totp: { qr_code: string } }, error: AuthError | null }>;
    challenge: (params: { factorId: string }) => Promise<{ data: { id: string }, error: AuthError | null }>;
    verify: (params: { factorId: string, challengeId: string, code: string }) => Promise<{ data: { session: Session | null, user: User | null }, error: AuthError | null }>;
    unenroll: (params: { factorId: string }) => Promise<{ error: AuthError | null }>;
  };
}


export default function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'roles', label: 'Admin Roles', icon: Shield },
    { id: 'system', label: 'Preferences', icon: Globe },
    { id: 'movement', label: 'Movement Info', icon: Megaphone },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'audit', label: 'Audit Log', icon: History },
  ]

  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState('All Status')
  const [auditResourceFilter, setAuditResourceFilter] = useState('All Resources')
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [adminData, setAdminData] = useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([])
  const [showMfaDialog, setShowMfaDialog] = useState(false)
  const [mfaStep, setMfaStep] = useState<'qr' | 'verify'>('qr')
  const [mfaEnrollData, setMfaEnrollData] = useState<{ id: string, qr: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [interfaceDensity, setInterfaceDensity] = useState<InterfaceDensity>(
    (localStorage.getItem('admin_interface_density') as InterfaceDensity) || 'Comfortable'
  )
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)


  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: ''
  })

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      const user = authService.getUser()
      if (user) {
        const data = await adminService.getAdminData(user.id)
        setAdminData(data)

        setProfileForm({
          fullName: data?.name || user.user_metadata?.full_name || '',
          email: data?.email || user.email || '',
          phone: data?.phone || user.user_metadata?.phone || '',
          avatarUrl: user.user_metadata?.avatar_url || ''
        })
      }

      try {
        const logs = await adminService.getSystemAuditLogs()
        setAuditLogs(logs)
        
        const settings = await adminService.getSiteSettings()
        setSiteSettings(settings)
      } catch (err) {
        console.error('[SETTINGS] Failed to synchronize audit telemetry:', err)
        toast.error('Failed to synchronize administrative audit logs')
      }
    }
    fetchData()
  }, [])

  const handleBrandingUpload = async (key: string, file: File) => {
    setIsSaving(true)
    const toastId = toast.loading(`Uploading ${key} to movement vault...`)
    try {
      const fileName = `${key}-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await adminService.uploadBrandingAsset(fileName, file)
      if (error) throw error
      
      const publicUrl = adminService.getBrandingAssetUrl(fileName)
      await adminService.updateSiteSetting(key, publicUrl)
      
      setSiteSettings(prev => ({ ...prev, [key]: publicUrl }))
      window.dispatchEvent(new CustomEvent('site_settings_updated'))
      toast.success(`${key} synchronized successfully`, { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to synchronize ${key}`, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch MFA factors
  useEffect(() => {
    const fetchMfa = async () => {
      const { data, error } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.listFactors();
      if (!error && data) {
        setMfaFactors(data.all || []);
      }
    };
    fetchMfa();
  }, []);

  const handleStartMfaEnroll = async () => {
    try {
      const { data, error } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      setMfaEnrollData({
        id: data.id,
        qr: data.totp.qr_code
      });
      setMfaStep('qr');
      setShowMfaDialog(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to start MFA enrollment");
    }
  };

  const handleVerifyMfa = async () => {
    if (!mfaEnrollData || !mfaCode) return;
    setIsSaving(true);
    
    try {
      const auth = supabase.auth as unknown as SupabaseAuthWithMFA;
      const challenge = await auth.mfa.challenge({ factorId: mfaEnrollData.id });
      if (challenge.error) throw challenge.error;

      const verify = await auth.mfa.verify({
        factorId: mfaEnrollData.id,
        challengeId: challenge.data.id,
        code: mfaCode
      });
      
      if (verify.error) throw verify.error;

      toast.success("MFA successfully enabled!");
      setShowMfaDialog(false);
      // Refresh factors
      const { data } = await auth.mfa.listFactors();
      setMfaFactors(data?.all || []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "MFA verification failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnenrollMfa = async (factorId: string) => {
    if (!confirm("Are you sure you want to disable MFA? This will reduce your account security.")) return;
    
    try {
      const { error } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.unenroll({ factorId });
      if (error) throw error;
      
      toast.success("MFA disabled");
      const { data } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.listFactors();
      setMfaFactors(data?.all || []);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to disable MFA");
    }
  };


  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }

    setIsUploading(true)
    const toastId = toast.loading('Uploading avatar...')
    
    try {
      const user = authService.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { error } = await adminService.uploadAvatar(fileName, file)
      if (error) throw error

      const publicUrl = adminService.getAvatarPublicUrl(fileName)
      setProfileForm(prev => ({ ...prev, avatarUrl: publicUrl }))
      toast.success('Avatar uploaded. Remember to save your profile changes.', { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }


  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.resource.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.adminName.toLowerCase().includes(auditSearch.toLowerCase())
    
    const matchesStatus = auditFilter === 'All Status' || log.status === auditFilter
    const matchesResource = auditResourceFilter === 'All Resources' || log.resource.includes(auditResourceFilter)
    
    return matchesSearch && matchesStatus && matchesResource
  })




  const handleSaveProfile = async () => {
    setIsSaving(true)
    const toastId = toast.loading('Syncing profile changes...')
    try {
      const user = authService.getUser()
      if (!user) throw new Error('Not authenticated')

      // 1. Update Auth metadata
      await authService.updateProfile({
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone: profileForm.phone
      })

      // 2. Update public.users table to ensure DB visibility
      const { error: dbError } = await adminService.updatePublicUserProfile(user.id, {
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone_number: profileForm.phone
      })

      if (dbError) throw dbError

      // 3. Refresh local data to confirm persistence
      const updatedData = await adminService.getAdminData(user.id)
      if (updatedData) {
        setAdminData(updatedData)
        setProfileForm(prev => ({
          ...prev,
          fullName: updatedData.name,
          phone: updatedData.phone || '',
          avatarUrl: updatedData.avatarUrl || ''
        }))
      }


      toast.success('Profile updated successfully', { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }



  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      await authService.updatePassword(passwordForm.newPassword)
      toast.success('Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportLogs = () => {
    if (auditLogs.length === 0) {
      toast.error('No administrative logs available for export')
      return
    }

    const toastId = toast.loading('Preparing movement audit report...')

    try {
      // Use full auditLogs for export to ensure "the log we have" is completely captured
      const logsToExport = auditLogs
      
      const headers = ['Timestamp', 'Officer', 'Action', 'Resource', 'Status', 'Technical Details']
      const rows = logsToExport.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.adminName,
        log.action,
        log.resource,
        log.status,
        log.details ? JSON.stringify(log.details).replace(/"/g, '""') : 'N/A'
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          const content = String(cell ?? '')
          return `"${content.replace(/"/g, '""')}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      link.setAttribute('href', url)
      link.setAttribute('download', `base_audit_report_${timestamp}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
      
      toast.success('Movement audit report exported successfully', { id: toastId })
    } catch (error) {
      console.error('[SETTINGS] Critical export failure:', error)
      toast.error('Failed to generate audit report', { id: toastId })
    }
  }

  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Globe className="w-8 h-8 text-on-surface" />
            System settings
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Manage your administrative identity and platform configuration.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Settings Navigation */}
        <div className="w-full lg:w-64 space-y-1 lg:sticky lg:top-24 self-start">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Button
                key={tab.id}
                variant={isActive ? "outline" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-sm text-[10px] font-bold tracking-tight transition-all group h-12 active:scale-95",
                  isActive 
                    ? "bg-white text-stone-900 shadow-sm border-stone-200" 
                    : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={cn("w-4 h-4", isActive ? "text-stone-900" : "text-stone-300 group-hover:text-stone-400")} />
                  {tab.label}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-stone-300" />}
              </Button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                <CardTitle className="text-sm font-bold text-stone-900">Profile</CardTitle>
                <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Manage your public and internal administrative identity.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-10">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200 overflow-hidden relative">
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                            <Loader2 className="w-5 h-5 text-stone-900 animate-spin" />
                          </div>
                        )}
                        {profileForm.avatarUrl ? (
                          <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                        ) : (
                          <span className="text-stone-400 font-bold text-sm">
                            {profileForm.fullName.split(' ').map(n => n[0]).join('') || 'HQ'}
                          </span>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        onClick={handleAvatarClick}
                        disabled={isUploading}
                        className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full z-20"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-stone-900">Profile Image</p>
                      <p className="text-[10px] text-stone-400 font-medium mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-stone-500 normal-case">Full name</Label>
                      <Input 
                        value={profileForm.fullName} 
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="h-10 rounded-lg border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-stone-500 normal-case">Email address</Label>
                      <Input value={profileForm.email} disabled className="h-10 rounded-lg border-stone-100 bg-stone-50 text-stone-400 text-xs font-medium cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-stone-500 normal-case">Administrative role</Label>
                      <div className="h-10 px-3 flex items-center rounded-lg border border-stone-100 bg-stone-50 text-stone-400 text-[10px] font-bold normal-case">
                        {adminData?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                         adminData?.role === 'REGIONAL_DIRECTOR' ? 'Regional Director' :
                         adminData?.role === 'CONSTITUENCY_LEAD' ? 'Constituency Lead' :
                         adminData?.role || (adminData ? 'Standard Staff' : 'HQ Officer')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-stone-500 normal-case">Phone number</Label>
                      <Input 
                        value={profileForm.phone} 
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+233 XX XXX XXXX"
                        className="h-10 rounded-lg border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium" 
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end border-t border-stone-100">
                    <Button 
                      variant="primary"
                      size="lg"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="rounded-sm text-[10px] font-bold tracking-tight px-8 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                    >
                      {isSaving ? 'Syncing...' : 'Synchronize Profile'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'roles' && (
            <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                <CardTitle className="text-sm font-bold text-stone-900">Administrative Roles</CardTitle>
                <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Summary of active permission tiers across the movement infrastructure.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-stone-50">
                  {[
                    { role: 'Super Admin', desc: 'Full system sovereignty and configuration rights.', count: 2, icon: Shield, color: 'text-[var(--brand-red)]' },
                    { role: 'Regional Admin', desc: 'Operational oversight within assigned regional boundaries.', count: 16, icon: Globe, color: 'text-stone-900' },
                    { role: 'Chapter Lead', desc: 'Local verification and mobilization management.', count: 124, icon: Users, color: 'text-stone-900' },
                    { role: 'Audit View', desc: 'Read-only access to financial and telemetry streams.', count: 4, icon: History, color: 'text-stone-500' },
                  ].map((item) => (
                    <div key={item.role} className="p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center", item.color)}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{item.role}</p>
                          <p className="text-[10px] text-stone-400 font-medium mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-stone-50 border border-stone-100 rounded-full text-[9px] font-bold text-stone-400 normal-case">
                        {item.count} active
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-8 bg-stone-50/50 border-t border-stone-100 text-center">
                  <p className="text-[10px] text-stone-400 font-medium italic">Role assignments are managed by System Administrators only.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                <CardTitle className="text-sm font-bold text-stone-900">Preferences</CardTitle>
                <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Configure your personal interface and notification behavior.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-stone-400 normal-case">Interface density</p>
                  <div className="grid grid-cols-3 gap-4">
                    {['Comfortable', 'Compact', 'High Density'].map((mode) => (
                      <Button 
                        key={mode} 
                        variant={mode === interfaceDensity ? "primary" : "outline"}
                        onClick={() => {
                          setInterfaceDensity(mode as InterfaceDensity)
                          localStorage.setItem('admin_interface_density', mode)
                          toast.success(`Density set to ${mode}`)
                          // Trigger a global style update if needed
                          window.dispatchEvent(new Event('admin_density_changed'))
                        }}
                        className={cn(
                          "p-4 rounded-sm border text-[10px] font-bold tracking-tight transition-all text-center h-12 active:scale-95",
                          mode === interfaceDensity 
                            ? "shadow-lg shadow-brand-green/20" 
                            : "border-stone-200 text-stone-400 hover:border-stone-300 bg-white"
                        )}
                      >
                        {mode}
                      </Button>
                    ))}
                  </div>

                </div>

                <div className="h-px bg-stone-100" />

                <div className="space-y-6">
                  <p className="text-[10px] font-bold text-stone-400 normal-case">Notifications</p>
                  <div className="space-y-4">
                    {[
                      { id: 'reg', label: 'New Member Registrations', desc: 'Real-time alerts for regional growth' },
                      { id: 'sec', label: 'Security Login Alerts', desc: 'Notify on new device recognition' },
                      { id: 'audit', label: 'Critical Audit Events', desc: 'Alert on system modification' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50">
                        <div>
                          <p className="text-xs font-bold text-stone-900">{item.label}</p>
                          <p className="text-[10px] text-stone-400 font-medium">{item.desc}</p>
                        </div>
                        <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center justify-end px-1 cursor-pointer">
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'movement' && (
            <div className="space-y-8">
              <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                  <CardTitle className="text-sm font-bold text-stone-900">Authoritative Communications</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Configure the movement's primary contact points and newsletter dispatch parameters.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="max-w-2xl space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-stone-500 normal-case">Primary contact email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                          <Input 
                            value={(siteSettings.primary_email as string) || ''} 
                            onChange={(e) => setSiteSettings({ ...siteSettings, primary_email: e.target.value })}
                            className="pl-10 h-11 rounded-lg border-stone-200 text-xs font-medium" 
                          />
                        </div>
                        <p className="text-[9px] text-stone-400 italic">Used for contact forms and general inquiries.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-stone-500 normal-case">Newsletter dispatch email</Label>
                        <div className="relative">
                          <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                          <Input 
                            value={(siteSettings.newsletter_email as string) || ''} 
                            onChange={(e) => setSiteSettings({ ...siteSettings, newsletter_email: e.target.value })}
                            className="pl-10 h-11 rounded-lg border-stone-200 text-xs font-medium" 
                          />
                        </div>
                        <p className="text-[9px] text-stone-400 italic">Authoritative sender for all movement broadcasts.</p>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-stone-100">
                      <h3 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" />
                        Movement Palette Control
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                          { key: 'primary_color', label: 'Primary Brand (Green)', desc: 'HSL value for the dominant identity color.' },
                          { key: 'accent_color', label: 'Accent Highlight (Gold)', desc: 'HSL value for secondary emphasis.' },
                          { key: 'destructive_color', label: 'Destructive/Alert (Red)', desc: 'HSL value for high-urgency elements.' },
                          { key: 'muted_foreground_color', label: 'Muted Text (General)', desc: 'HSL value for secondary labels/hints.' },
                          { key: 'on_surface_muted_color', label: 'Muted Text (Dark)', desc: 'HSL value for text on dark backgrounds.' }
                        ].map((color) => (
                          <div key={color.key} className="space-y-2">
                            <Label className="text-[10px] font-bold text-stone-500 normal-case">{color.label}</Label>
                            <div className="flex gap-3">
                              <div 
                                className="w-11 h-11 rounded-lg border border-stone-200 shrink-0" 
                                style={{ backgroundColor: `hsl(${siteSettings[color.key]})` }}
                              />
                              <Input 
                                value={(siteSettings[color.key] as string) || ''} 
                                onChange={(e) => setSiteSettings({ ...siteSettings, [color.key]: e.target.value })}
                                className="h-11 rounded-lg border-stone-200 text-xs font-medium font-mono"
                                placeholder="0 0% 0%"
                              />
                            </div>
                            <p className="text-[9px] text-stone-400 italic leading-tight">{color.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-stone-100">
                      <h3 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        Tactical Typography Orchestration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <Label className="text-[10px] font-bold text-stone-500 normal-case">Global font scale</Label>
                            <span className="text-[10px] font-mono font-bold text-primary">{(siteSettings.font_scale_global as number || 1.0).toFixed(2)}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.8" 
                            max="1.5" 
                            step="0.05"
                            value={(siteSettings.font_scale_global as number) || 1.0}
                            onChange={(e) => setSiteSettings({ ...siteSettings, font_scale_global: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <p className="text-[9px] text-stone-400 italic leading-tight">Adjusts the base font size for all paragraphs and body text.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <Label className="text-[10px] font-bold text-stone-500 normal-case">Heading emphasis scale</Label>
                            <span className="text-[10px] font-mono font-bold text-primary">{(siteSettings.font_scale_headings as number || 1.0).toFixed(2)}x</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.8" 
                            max="2.0" 
                            step="0.05"
                            value={(siteSettings.font_scale_headings as number) || 1.0}
                            onChange={(e) => setSiteSettings({ ...siteSettings, font_scale_headings: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <p className="text-[9px] text-stone-400 italic leading-tight">Specifically scales H1-H6 headings for high-impact visibility.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end border-t border-stone-100">
                      <Button 
                        variant="primary"
                        size="lg"
                        onClick={async () => {
                          setIsSaving(true)
                          const toastId = toast.loading('Syncing movement configurations...')
                          try {
                            const settingsToUpdate = [
                              { key: 'primary_email', value: siteSettings.primary_email },
                              { key: 'newsletter_email', value: siteSettings.newsletter_email },
                              { key: 'primary_color', value: siteSettings.primary_color },
                              { key: 'accent_color', value: siteSettings.accent_color },
                              { key: 'destructive_color', value: siteSettings.destructive_color },
                              { key: 'registration_form_ghana_url', value: siteSettings.registration_form_ghana_url },
                              { key: 'registration_form_diaspora_url', value: siteSettings.registration_form_diaspora_url },
                              { key: 'font_scale_global', value: siteSettings.font_scale_global },
                              { key: 'font_scale_headings', value: siteSettings.font_scale_headings },
                              { key: 'muted_foreground_color', value: siteSettings.muted_foreground_color },
                              { key: 'on_surface_muted_color', value: siteSettings.on_surface_muted_color }
                            ]
                            
                            await Promise.all(settingsToUpdate.map(s => 
                              adminService.updateSiteSetting(s.key, s.value)
                            ))

                            window.dispatchEvent(new CustomEvent('site_settings_updated'))
                            toast.success('Movement configurations synchronized', { id: toastId })
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : 'Failed to update movement telemetry', { id: toastId })
                          } finally {
                            setIsSaving(false)
                          }
                        }}
                        disabled={isSaving}
                        className="rounded-sm text-[10px] font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                      >
                        {isSaving ? 'Synchronizing...' : 'Commit Configurations'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                  <CardTitle className="text-sm font-bold text-stone-900">Official Documentation</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Manage the movement's authoritative documents and registration forms.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="max-w-2xl space-y-12">
                    {/* Ghana Form */}
                    <div className="p-6 rounded-lg border border-stone-100 bg-stone-50/30 group transition-all hover:border-brand-green/20">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-brand-green/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-brand-green" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">Ghana Membership Form (PDF)</p>
                            <p className="text-[10px] text-stone-400 font-medium">Linked to "Download Form" for Ghana-based platform users.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white border border-stone-200 rounded-sm px-4 h-10 flex items-center overflow-hidden">
                          <p className="text-[10px] font-mono text-stone-500 truncate">
                            {siteSettings.registration_form_ghana_url as string || 'No form uploaded'}
                          </p>
                        </div>
                        <label className="cursor-pointer bg-brand-green text-white px-6 h-10 rounded-sm text-[10px] font-bold capitalize tracking-tight flex items-center gap-2 hover:bg-brand-green/90 transition-all active:scale-95 shadow-lg shadow-brand-green/10">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBrandingUpload('registration_form_ghana_url', file)
                            }}
                          />
                        </label>
                      </div>
                      
                      {!!siteSettings.registration_form_ghana_url && (
                        <div className="mt-4 flex justify-end">
                          <a 
                            href={siteSettings.registration_form_ghana_url as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-brand-green hover:underline flex items-center gap-1.5"
                          >
                            <Globe className="w-3 h-3" />
                            Verify Live Link
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Diaspora Form */}
                    <div className="p-6 rounded-lg border border-stone-100 bg-stone-50/30 group transition-all hover:border-blue-600/20">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">Diaspora Membership Form (PDF)</p>
                            <p className="text-[10px] text-stone-400 font-medium">Linked to "Download Form" for Diaspora platform users.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-white border border-stone-200 rounded-sm px-4 h-10 flex items-center overflow-hidden">
                          <p className="text-[10px] font-mono text-stone-500 truncate">
                            {siteSettings.registration_form_diaspora_url as string || 'No form uploaded'}
                          </p>
                        </div>
                        <label className="cursor-pointer bg-blue-600 text-white px-6 h-10 rounded-sm text-[10px] font-bold capitalize tracking-tight flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/10">
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleBrandingUpload('registration_form_diaspora_url', file)
                            }}
                          />
                        </label>
                      </div>
                      
                      {!!siteSettings.registration_form_diaspora_url && (
                        <div className="mt-4 flex justify-end">
                          <a 
                            href={siteSettings.registration_form_diaspora_url as string} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <Globe className="w-3 h-3" />
                            Verify Live Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                  <CardTitle className="text-sm font-bold text-stone-900">Brand Assets & Social</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Authorized social media touchpoints and movement links.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { key: 'logo_url', label: 'Movement Logo', icon: ImageIcon, desc: 'Authoritative brand identifier used across the platform.' },
                      { key: 'favicon_url', label: 'Site Favicon', icon: Globe, desc: 'Browser tab and bookmark icon (32x32 recommended).' },
                      { key: 'og_image_url', label: 'Open Graph Image', icon: ImageIcon, desc: 'Shared visual when links are posted to social platforms.' },
                      { key: 'twitter_card_url', label: 'Twitter Card', icon: Twitter, desc: 'Specific optimized visual for X/Twitter previews.' },
                      { key: 'founder_image_url', label: 'Founder Portrait', icon: UserIcon, desc: 'Official portrait of the Movement Leader.' },
                      { key: 'hero_bg_url', label: 'Hero Background', icon: ImageIcon, desc: 'Main landing page background visualization.' },
                      { key: 'banner_image_url', label: 'Base Banner', icon: Megaphone, desc: 'Authoritative banner for movement messaging.' },
                      { key: 'party_hq_image_url', label: 'HQ Visualization', icon: Building2, desc: 'Authoritative image of Movement Headquarters.' }
                    ].map((asset) => (
                      <div key={asset.key} className="space-y-4 p-6 rounded-lg border border-stone-100 bg-stone-50/30 group transition-all hover:border-brand-green/20">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center">
                              <asset.icon className="w-4 h-4 text-stone-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-900">{asset.label}</p>
                              <p className="text-[10px] text-stone-400 font-medium">{asset.desc}</p>
                            </div>
                          </div>
                        </div>

                        {siteSettings[asset.key] ? (
                          <div className="relative aspect-video rounded-sm overflow-hidden border border-stone-200 bg-stone-100">
                            <img 
                              src={siteSettings[asset.key] as string} 
                              alt={asset.label}
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer bg-white text-stone-900 px-3 py-1.5 rounded-sm text-[9px] font-bold capitalize tracking-tight flex items-center gap-2">

                                <Upload className="w-3 h-3" />
                                Replace Asset
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleBrandingUpload(asset.key, file)
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center aspect-video rounded-sm border-2 border-dashed border-stone-200 bg-stone-50/50 cursor-pointer hover:bg-stone-100 transition-all group-hover:border-brand-green/30">
                            <Upload className="w-5 h-5 text-stone-300 mb-2" />
                            <p className="text-[10px] font-bold text-stone-400">UPLOAD ASSET</p>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleBrandingUpload(asset.key, file)
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Password Card */}
              <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
                  <CardTitle className="text-sm font-bold text-stone-900">Security Credentials</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Rotate your password regularly to maintain account integrity.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="max-w-md space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-stone-500 normal-case">New password</Label>
                        <Input 
                          type="password" 
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="h-10 rounded-lg border-stone-200" 
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-stone-500 normal-case">Confirm new password</Label>
                        <Input 
                          type="password" 
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="h-10 rounded-lg border-stone-200" 
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                      <Button 
                        variant="primary"
                        size="lg"
                        onClick={handleUpdatePassword}
                        disabled={isSaving || !passwordForm.newPassword}
                        className="w-full rounded-sm text-[10px] font-bold capitalize tracking-tight h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                      >
                      {isSaving ? 'Hardening...' : 'Harden Security Credentials'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* MFA Card */}
              <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8">
                   <div className="flex items-start gap-6">
                     <div className={cn(
                       "w-12 h-12 rounded-sm flex items-center justify-center border transition-all",
                       mfaFactors.length > 0 ? "bg-emerald-50 border-emerald-100" : "bg-stone-50 border-stone-100"
                     )}>
                       <Smartphone className={cn(
                         "w-6 h-6",
                         mfaFactors.length > 0 ? "text-emerald-500" : "text-stone-400"
                       )} />
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-sm font-bold text-stone-900">Two-Factor Authentication</h4>
                          {mfaFactors.length > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-600 tracking-tight">
                              Protected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[9px] font-bold text-amber-600 tracking-tight">
                              Not configured
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 font-medium mt-1 leading-relaxed">
                          Add an extra layer of security to your admin account by requiring a verification code from your mobile device.
                        </p>
                        <div className="flex gap-3 mt-4">
                          {mfaFactors.length > 0 ? (
                            <Button 
                              variant="outline" 
                              onClick={() => handleUnenrollMfa(mfaFactors[0].id)}
                              className="h-10 px-6 text-[10px] font-bold capitalize tracking-tight border-destructive/20 text-destructive hover:bg-destructive/5 rounded-sm transition-all active:scale-95"
                            >
                              Disable protection
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleStartMfaEnroll}
                              className="h-10 px-6 text-[10px] font-bold capitalize tracking-tight border-stone-200 rounded-sm transition-all active:scale-95"
                            >
                              Establish MFA Protection
                            </Button>
                          )}
                        </div>
                     </div>
                   </div>
                </CardContent>
              </Card>

              {/* MFA Setup Dialog */}
              <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
                <DialogContent className="max-w-md bg-white border-stone-200">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-stone-900">Configure Multi-Factor Authentication</DialogTitle>
                    <DialogDescription className="text-xs text-stone-500 font-medium">
                      Follow these steps to secure your administrative account.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-6 space-y-6">
                    {mfaStep === 'qr' && mfaEnrollData && (
                      <div className="space-y-6 flex flex-col items-center">
                        <div className="p-4 bg-stone-50 rounded-sm border border-stone-100">
                          <img src={mfaEnrollData?.qr} 
                            alt="MFA QR Code"
                            className="w-48 h-48"
                           decoding="async" loading="lazy" />

                        </div>
                        <div className="space-y-2 text-center max-w-xs">
                          <p className="text-[11px] font-bold text-stone-900">Scan this QR Code</p>
                          <p className="text-[10px] text-stone-400 leading-relaxed font-medium">
                            Use Google Authenticator, Authy, or any TOTP app to scan the code above.
                          </p>
                        </div>
                        <Button 
                          variant="primary"
                          onClick={() => setMfaStep('verify')}
                          className="w-full text-white font-bold capitalize tracking-tight text-[10px] h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                        >
                          I've scanned it, proceed
                        </Button>
                      </div>
                    )}

                    {mfaStep === 'verify' && (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-bold tracking-tight text-stone-500">Verification code</Label>
                          <Input 
                            value={mfaCode}
                            onChange={(e) => setMfaCode(e.target.value)}
                            placeholder="000 000"
                            className="h-12 text-center text-lg font-bold tracking-[0.5em] border-stone-200 rounded-sm"
                            maxLength={6}
                          />
                          <p className="text-[10px] text-stone-400 font-medium text-center">
                            Enter the 6-digit code shown in your authenticator app.
                          </p>
                        </div>
                        <Button 
                          variant="primary"
                          onClick={handleVerifyMfa}
                          disabled={isSaving || mfaCode.length < 6}
                          className="w-full text-white font-bold capitalize tracking-tight text-[10px] h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                        >
                          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify and Enable MFA"}
                        </Button>
                        <button 
                          onClick={() => setMfaStep('qr')}
                          className="w-full text-[10px] font-bold text-stone-400 capitalize tracking-tight hover:text-stone-600"
                        >
                          Go back to QR code
                        </button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

            </div>
          )}

          {activeTab === 'audit' && (
            <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-stone-900">Audit Log</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-stone-400 mt-1">Full traceability of administrative decisions and system modifications.</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-10 px-6 text-[10px] font-bold capitalize tracking-tight border-stone-200 rounded-sm hover:bg-stone-50 transition-all active:scale-95"
                  onClick={handleExportLogs}
                >
                  Export Audit report
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-4 p-6 bg-stone-50/50 border-b border-stone-100">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <Input 
                      placeholder="Search by action or resource..." 
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="pl-9 h-9 text-[11px] border-stone-200 bg-white rounded-lg focus:ring-0"
                    />
                  </div>
                  <select 
                    value={auditFilter}
                    onChange={(e) => setAuditFilter(e.target.value)}
                    className="h-9 px-3 text-[11px] font-bold text-stone-600 border border-stone-200 bg-white rounded-lg focus:ring-0 outline-none"
                  >
                    <option>All Status</option>
                    <option>Success</option>
                    <option>Warning</option>
                    <option>Failure</option>
                  </select>

                  <select 
                    value={auditResourceFilter}
                    onChange={(e) => setAuditResourceFilter(e.target.value)}
                    className="h-9 px-3 text-[11px] font-bold text-stone-600 border border-stone-200 bg-white rounded-lg focus:ring-0 outline-none"
                  >
                    <option>All Resources</option>
                    <option>MEMBERS</option>
                    <option>CHAPTERS</option>
                    <option>STORE</option>
                    <option>SYSTEM</option>
                    <option>BLOGS</option>
                  </select>
                </div>


                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/30 border-b border-stone-100">
                        <th className="p-4 pl-8 text-[9px] font-bold tracking-tight text-stone-400">Timestamp</th>
                        <th className="p-4 text-[9px] font-bold tracking-tight text-stone-400">Admin</th>
                        <th className="p-4 text-[9px] font-bold tracking-tight text-stone-400">Action</th>
                        <th className="p-4 pr-8 text-right text-[9px] font-bold tracking-tight text-stone-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredLogs.length > 0 ? (
                        filteredLogs.slice(0, 15).map((log) => (

                          <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="p-4 pl-8 text-[10px] font-medium text-stone-400">
                              {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="p-4 text-xs font-bold text-stone-900">{log.adminName.split(' ')[0]}</td>
                            <td className="p-4 text-[11px] font-medium text-stone-600 italic">{log.action.toLowerCase()}</td>
                            <td className="p-4 pr-8 text-right">
                              <div className={cn("w-1.5 h-1.5 rounded-full inline-block", 
                                log.status === 'Success' ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-20 text-center text-stone-400 text-xs italic">No activity logs recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

