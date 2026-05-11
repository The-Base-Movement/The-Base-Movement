import { useState, useEffect, useRef } from 'react'

import { 
  User as UserIcon, 
  Shield, 
  Globe, 
  Lock,
  ChevronRight,
  History,
  MousePointer2,
  Megaphone,
  type LucideIcon
} from 'lucide-react'

import { adminService, type AuditLogEntry, type AdminUser } from '@/services/adminService'
import type { Factor, AuthError, Session, User } from '@supabase/supabase-js'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { Button } from '@/components/ui/neon-button'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'react-router-dom'

// Modular Tab Components
import { ProfileSettingsTab } from './settings/components/ProfileSettingsTab'
import { RolesManagementTab } from './settings/components/RolesManagementTab'
import { SystemPreferencesTab } from './settings/components/SystemPreferencesTab'
import { MovementInfoTab } from './settings/components/MovementInfoTab'
import { SecuritySettingsTab } from './settings/components/SecuritySettingsTab'
import { ButtonCustomizerTab } from './settings/components/ButtonCustomizerTab'
import { AuditLogTab } from './settings/components/AuditLogTab'

type InterfaceDensity = 'Comfortable' | 'Compact' | 'High Density';
type SettingsTab = 'profile' | 'roles' | 'system' | 'movement' | 'security' | 'buttons' | 'audit'

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
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'profile'

  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams({ tab })
  }

  const tabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'roles', label: 'Admin Roles', icon: Shield },
    { id: 'system', label: 'Preferences', icon: Globe },
    { id: 'movement', label: 'Movement Info', icon: Megaphone },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'buttons', label: 'Buttons', icon: MousePointer2 },
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
        // Ensure defaults are present for new keys
        setSiteSettings({
          button_primary_text_color: '0 0% 100%',
          button_gold_text_color: '220 15% 15%',
          button_destructive_text_color: '0 0% 100%',
          ...settings
        })
      } catch (err) {
        console.error('[SETTINGS] Failed to synchronize audit telemetry:', err)
        toast.error('Failed to synchronize administrative audit logs')
      }
    }
    fetchData()
  }, [])


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

  const handleSaveButtonSettings = async () => {
    setIsSaving(true)
    const toastId = toast.loading('Syncing button architecture...')
    try {
      const settingsToUpdate = [
        { key: 'button_border_radius', value: siteSettings.button_border_radius },
        { key: 'button_font_weight', value: siteSettings.button_font_weight },
        { key: 'button_neon_enabled', value: siteSettings.button_neon_enabled },
        { key: 'button_primary_text_color', value: siteSettings.button_primary_text_color },
        { key: 'button_gold_text_color', value: siteSettings.button_gold_text_color },
        { key: 'button_destructive_text_color', value: siteSettings.button_destructive_text_color },
        { key: 'button_active_tab_bg_color', value: siteSettings.button_active_tab_bg_color },
        { key: 'button_active_tab_text_color', value: siteSettings.button_active_tab_text_color },
        { key: 'button_inactive_tab_bg_color', value: siteSettings.button_inactive_tab_bg_color },
        { key: 'button_inactive_tab_text_color', value: siteSettings.button_inactive_tab_text_color }
      ]
      
      await Promise.all(settingsToUpdate.map(s => 
        adminService.updateSiteSetting(s.key, s.value)
      ))

      window.dispatchEvent(new CustomEvent('site_settings_updated'))
      toast.success('Button architecture synchronized', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update button telemetry', { id: toastId })
    } finally {
      setIsSaving(false)
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
                variant={isActive ? "active-tab" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-sm text-micro font-bold tracking-tight transition-all group h-12 active:scale-95",
                  !isActive && "text-stone-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={cn("w-4 h-4", isActive ? "text-[hsl(var(--active-tab-text))]" : "text-stone-300 group-hover:text-white/60")} />
                  {tab.label}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--active-tab-text))]/60" />}
              </Button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <ProfileSettingsTab
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              isUploading={isUploading}
              isSaving={isSaving}
              adminData={adminData}
              fileInputRef={fileInputRef}
              handleAvatarClick={handleAvatarClick}
              handleFileChange={handleFileChange}
              handleSaveProfile={handleSaveProfile}
            />
          )}

          {activeTab === 'roles' && (
            <RolesManagementTab />
          )}

          {activeTab === 'system' && (
            <SystemPreferencesTab
              interfaceDensity={interfaceDensity}
              setInterfaceDensity={setInterfaceDensity}
              toast={toast}
            />
          )}

          {activeTab === 'movement' && (
            <MovementInfoTab
              siteSettings={siteSettings}
              setSiteSettings={setSiteSettings}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              toast={toast}
            />
          )}

          {activeTab === 'buttons' && (
            <ButtonCustomizerTab
              siteSettings={siteSettings}
              setSiteSettings={setSiteSettings}
              isSaving={isSaving}
              handleSave={handleSaveButtonSettings}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              isSaving={isSaving}
              handleUpdatePassword={handleUpdatePassword}
              mfaFactors={mfaFactors}
              handleStartMfaEnroll={handleStartMfaEnroll}
              handleUnenrollMfa={handleUnenrollMfa}
              showMfaDialog={showMfaDialog}
              setShowMfaDialog={setShowMfaDialog}
              mfaStep={mfaStep}
              setMfaStep={setMfaStep}
              mfaEnrollData={mfaEnrollData}
              mfaCode={mfaCode}
              setMfaCode={setMfaCode}
              handleVerifyMfa={handleVerifyMfa}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogTab
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              auditFilter={auditFilter}
              setAuditFilter={setAuditFilter}
              auditResourceFilter={auditResourceFilter}
              setAuditResourceFilter={setAuditResourceFilter}
              filteredLogs={filteredLogs}
              handleExportLogs={handleExportLogs}
            />
          )}
        </div>
      </div>
    </div>
  )
}
