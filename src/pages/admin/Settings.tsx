import { useState, useEffect, useRef, useMemo } from 'react'
import { adminService, type AuditLogEntry, type AdminUser } from '@/services/adminService'
import type { Factor, AuthError, Session, User } from '@supabase/supabase-js'
import { authService } from '@/services/authService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

import { ProfileSettingsTab } from './settings/components/ProfileSettingsTab'
import { RolesManagementTab } from './settings/components/RolesManagementTab'
import { SystemPreferencesTab } from './settings/components/SystemPreferencesTab'
import { MovementInfoTab } from './settings/components/MovementInfoTab'
import { SecuritySettingsTab } from './settings/components/SecuritySettingsTab'
import { ButtonCustomizerTab } from './settings/components/ButtonCustomizerTab'
import { AuditLogTab } from './settings/components/AuditLogTab'
import { AboutPageTab } from './settings/components/AboutPageTab'
import { FinanceApprovalsTab } from './settings/components/FinanceApprovalsTab'

type SettingsTab =
  | 'profile'
  | 'roles'
  | 'system'
  | 'movement'
  | 'about'
  | 'security'
  | 'buttons'
  | 'audit'
  | 'finance'

interface SupabaseAuthWithMFA {
  mfa: {
    listFactors: () => Promise<{ data: { all: Factor[] }; error: AuthError | null }>
    enroll: (params: { factorType: 'totp'; friendlyName?: string; issuer?: string }) => Promise<{
      data: { id: string; totp: { qr_code: string; secret: string; uri: string } }
      error: AuthError | null
    }>
    challenge: (params: {
      factorId: string
    }) => Promise<{ data: { id: string }; error: AuthError | null }>
    verify: (params: {
      factorId: string
      challengeId: string
      code: string
    }) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthError | null }>
    unenroll: (params: { factorId: string }) => Promise<{ error: AuthError | null }>
  }
}

const tabs: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'profile', label: 'My Profile', icon: 'person' },
  { id: 'roles', label: 'Admin Roles', icon: 'shield' },
  { id: 'system', label: 'Preferences', icon: 'tune' },
  { id: 'movement', label: 'Movement Info', icon: 'campaign' },
  { id: 'about', label: 'About Page', icon: 'info' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'buttons', label: 'Buttons', icon: 'ads_click' },
  { id: 'audit', label: 'Audit Log', icon: 'history' },
  { id: 'finance', label: 'Finance Approvals', icon: 'account_balance_wallet' },
]

export default function AdminSettings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'profile'
  const setActiveTab = (tab: SettingsTab) => setSearchParams({ tab })

  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState('All Status')
  const [auditResourceFilter, setAuditResourceFilter] = useState('All Resources')
  const [auditSortOrder, setAuditSortOrder] = useState<'asc' | 'desc'>('asc')
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [adminData, setAdminData] = useState<AdminUser | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mfaFactors, setMfaFactors] = useState<Factor[]>([])
  const [showMfaDialog, setShowMfaDialog] = useState(false)
  const [mfaStep, setMfaStep] = useState<'qr' | 'verify'>('qr')
  const [mfaEnrollData, setMfaEnrollData] = useState<{ id: string; uri: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [siteSettings, setSiteSettings] = useState<Record<string, unknown>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Synchronous re-entrancy guard so a double-click can't run the enroll cleanup
  // twice and delete the factor the first call just created (see MfaSetupNag).
  const mfaEnrollingRef = useRef(false)

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatarUrl: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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
          avatarUrl: user.user_metadata?.avatar_url || '',
        })
      }
      try {
        const logs = await adminService.getSystemAuditLogs()
        setAuditLogs(logs)
        const settings = await adminService.getSiteSettings()
        const loaded = settings as Record<string, unknown>
        if (
          loaded.button_inactive_tab_bg_color === '0 0% 100%' &&
          loaded.button_inactive_tab_text_color === '0 0% 100%'
        ) {
          loaded.button_inactive_tab_text_color = '156 100% 21%'
        }
        setSiteSettings({
          button_primary_text_color: '0 0% 100%',
          button_gold_text_color: '220 15% 15%',
          button_destructive_text_color: '0 0% 100%',
          button_active_tab_bg_color: '',
          button_inactive_tab_bg_color: '0 0% 100%',
          button_inactive_tab_text_color: '156 100% 21%',
          button_border_radius: '0.125rem',
          button_font_weight: '700',
          button_neon_enabled: false,
          button_primary_hover_bg_color: '156 100% 15%',
          button_accent_hover_bg_color: '45 80% 35%',
          button_destructive_hover_bg_color: '0 85% 35%',
          button_active_tab_hover_bg_color: '156 100% 15%',
          button_inactive_tab_hover_bg_color: '0 0% 95%',
          ...loaded,
        })
      } catch (err) {
        console.error('[SETTINGS] Failed to synchronize audit telemetry:', err)
        toast.error('Failed to synchronize administrative audit logs')
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchMfa = async () => {
      const { data, error } = await (
        supabase.auth as unknown as SupabaseAuthWithMFA
      ).mfa.listFactors()
      if (!error && data) setMfaFactors(data.all || [])
    }
    fetchMfa()
  }, [])

  const handleStartMfaEnroll = async () => {
    if (mfaEnrollingRef.current) return
    mfaEnrollingRef.current = true
    try {
      const auth = supabase.auth as unknown as SupabaseAuthWithMFA
      // Drop any dangling unverified factors first — each enroll mints a fresh
      // secret, so a leftover unverified factor makes the scanned code verify
      // against the wrong secret and collides on the default friendly name.
      const existing = await auth.mfa.listFactors()
      if (!existing.error) {
        await Promise.all(
          (existing.data?.all ?? [])
            .filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
            .map((f) => auth.mfa.unenroll({ factorId: f.id }))
        )
      }
      const { data, error } = await auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator (${new Date().toISOString()})`,
        issuer: 'The Base Movement',
      })
      if (error) throw error
      setMfaEnrollData({ id: data.id, uri: data.totp.uri })
      setMfaStep('qr')
      setShowMfaDialog(true)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to start MFA enrollment')
    } finally {
      mfaEnrollingRef.current = false
    }
  }

  const handleVerifyMfa = async () => {
    if (!mfaEnrollData || !mfaCode) return
    setIsSaving(true)
    try {
      const auth = supabase.auth as unknown as SupabaseAuthWithMFA
      const challenge = await auth.mfa.challenge({ factorId: mfaEnrollData.id })
      if (challenge.error) throw challenge.error
      const verify = await auth.mfa.verify({
        factorId: mfaEnrollData.id,
        challengeId: challenge.data.id,
        code: mfaCode,
      })
      if (verify.error) throw verify.error
      toast.success('MFA successfully enabled!')
      setShowMfaDialog(false)
      const { data } = await auth.mfa.listFactors()
      setMfaFactors(data?.all || [])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'MFA verification failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnenrollMfa = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable MFA? This will reduce your account security.'))
      return
    try {
      const { error } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.unenroll({
        factorId,
      })
      if (error) throw error
      toast.success('MFA disabled')
      const { data } = await (supabase.auth as unknown as SupabaseAuthWithMFA).mfa.listFactors()
      setMfaFactors(data?.all || [])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to disable MFA')
    }
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB')
      return
    }
    setIsUploading(true)
    const toastId = toast.loading('Uploading avatar…')
    try {
      const user = authService.getUser()
      if (!user) throw new Error('Not authenticated')
      const fileName = `${user.id}/${Date.now()}.webp`
      const { error } = await adminService.uploadAvatar(fileName, file)
      if (error) throw error
      const publicUrl = adminService.getAvatarPublicUrl(fileName)
      setProfileForm((prev) => ({ ...prev, avatarUrl: publicUrl }))
      toast.success('Avatar uploaded. Remember to save your profile changes.', { id: toastId })
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Upload failed', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  const sortedLogs = useMemo(() => {
    const list = auditLogs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.resource.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.adminName.toLowerCase().includes(auditSearch.toLowerCase())
      const matchesStatus = auditFilter === 'All Status' || log.status === auditFilter
      const matchesResource =
        auditResourceFilter === 'All Resources' || log.resource.includes(auditResourceFilter)
      return matchesSearch && matchesStatus && matchesResource
    })
    return list.sort((a, b) => {
      const actA = a.action || ''
      const actB = b.action || ''
      return auditSortOrder === 'asc' ? actA.localeCompare(actB) : actB.localeCompare(actA)
    })
  }, [auditLogs, auditSearch, auditFilter, auditResourceFilter, auditSortOrder])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    const toastId = toast.loading('Syncing profile changes…')
    try {
      const user = authService.getUser()
      if (!user) throw new Error('Not authenticated')
      await authService.updateProfile({
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone: profileForm.phone,
      })
      const { error: dbError } = await adminService.updatePublicUserProfile(user.id, {
        full_name: profileForm.fullName,
        avatar_url: profileForm.avatarUrl,
        phone_number: profileForm.phone,
      })
      if (dbError) throw dbError
      const updatedData = await adminService.getAdminData(user.id)
      if (updatedData) {
        setAdminData(updatedData)
        setProfileForm((prev) => ({
          ...prev,
          fullName: updatedData.name,
          phone: updatedData.phone || '',
          avatarUrl: updatedData.avatarUrl || '',
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
    const toastId = toast.loading('Preparing movement audit report…')
    try {
      const headers = ['Timestamp', 'Officer', 'Action', 'Resource', 'Status', 'Technical Details']
      const rows = auditLogs.map((log) => [
        new Date(log.timestamp).toLocaleString(),
        log.adminName,
        log.action,
        log.resource,
        log.status,
        log.details ? JSON.stringify(log.details).replace(/"/g, '""') : 'N/A',
      ])
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
        ),
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
    const toastId = toast.loading('Syncing button architecture…')
    try {
      const settingsToUpdate = [
        'button_border_radius',
        'button_font_weight',
        'button_neon_enabled',
        'button_primary_text_color',
        'button_gold_text_color',
        'button_destructive_text_color',
        'button_active_tab_bg_color',
        'button_inactive_tab_bg_color',
        'button_inactive_tab_text_color',
        'button_primary_hover_bg_color',
        'button_accent_hover_bg_color',
        'button_destructive_hover_bg_color',
        'button_active_tab_hover_bg_color',
        'button_inactive_tab_hover_bg_color',
      ]
      await Promise.all(
        settingsToUpdate
          .filter((key) => siteSettings[key] !== undefined)
          .map((key) => adminService.updateSiteSetting(key, siteSettings[key]))
      )
      window.dispatchEvent(new CustomEvent('site_settings_updated'))
      toast.success('Button architecture synchronized', { id: toastId })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update button telemetry', {
        id: toastId,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="System settings"
        icon="settings"
        description="Manage your administrative identity and platform configuration."
      />

      <div className="settings-outer">
        {/* Tab navigation */}
        <nav className="settings-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: isActive ? 'hsl(var(--primary))' : 'transparent',
                  color: isActive ? '#fff' : 'hsl(var(--on-surface-muted))',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                  width: '100%',
                  justifyContent: 'flex-start',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  {tab.icon}
                </span>
                {tab.label}
                {isActive && (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14, marginLeft: 'auto', opacity: 0.5 }}
                  >
                    chevron_right
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
          {activeTab === 'roles' && <RolesManagementTab />}
          {activeTab === 'system' && <SystemPreferencesTab adminData={adminData} toast={toast} />}
          {activeTab === 'movement' && (
            <MovementInfoTab
              siteSettings={siteSettings}
              setSiteSettings={setSiteSettings}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              toast={toast}
            />
          )}
          {activeTab === 'about' && (
            <AboutPageTab
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
          {activeTab === 'finance' && <FinanceApprovalsTab />}
          {activeTab === 'audit' && (
            <AuditLogTab
              auditSearch={auditSearch}
              setAuditSearch={setAuditSearch}
              auditFilter={auditFilter}
              setAuditFilter={setAuditFilter}
              auditResourceFilter={auditResourceFilter}
              setAuditResourceFilter={setAuditResourceFilter}
              filteredLogs={sortedLogs}
              auditSortOrder={auditSortOrder}
              onAuditSortChange={setAuditSortOrder}
              handleExportLogs={handleExportLogs}
            />
          )}
        </div>
      </div>
    </div>
  )
}
