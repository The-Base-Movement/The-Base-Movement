# Admin Settings Modularization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modularize the `AdminSettings.tsx` file (1.6k lines) into focused sub-components to improve maintainability and resolve tag mismatch issues.

**Architecture:** Extract each tab into a dedicated component in `src/pages/admin/settings/components/`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide icons, Shadcn UI.

---

### Task 1: Extract SecuritySettingsTab

**Files:**
- Create: `src/pages/admin/settings/components/SecuritySettingsTab.tsx`

- [ ] **Step 1: Implement SecuritySettingsTab**
Extract password and MFA logic from `Settings.tsx`.

```tsx
import { Smartphone, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import type { Factor } from '@supabase/supabase-js'

interface SecuritySettingsTabProps {
  passwordForm: any
  setPasswordForm: (form: any) => void
  isSaving: boolean
  handleUpdatePassword: () => void
  mfaFactors: Factor[]
  handleStartMfaEnroll: () => void
  handleUnenrollMfa: (id: string) => void
  showMfaDialog: boolean
  setShowMfaDialog: (show: boolean) => void
  mfaStep: 'qr' | 'verify'
  setMfaStep: (step: 'qr' | 'verify') => void
  mfaEnrollData: any
  mfaCode: string
  setMfaCode: (code: string) => void
  handleVerifyMfa: () => void
}

export function SecuritySettingsTab({
  passwordForm,
  setPasswordForm,
  isSaving,
  handleUpdatePassword,
  mfaFactors,
  handleStartMfaEnroll,
  handleUnenrollMfa,
  showMfaDialog,
  setShowMfaDialog,
  mfaStep,
  setMfaStep,
  mfaEnrollData,
  mfaCode,
  setMfaCode,
  handleVerifyMfa
}: SecuritySettingsTabProps) {
  return (
    <div className="space-y-8">
      {/* Password Card */}
      <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
          <CardTitle className="text-sm font-bold text-stone-900">Security Credentials</CardTitle>
          <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Rotate your password regularly to maintain account integrity.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-md space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-micro font-bold text-stone-500 normal-case">New password</Label>
                <Input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="h-10 rounded-sm border-stone-200" 
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-micro font-bold text-stone-500 normal-case">Confirm new password</Label>
                <Input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="h-10 rounded-sm border-stone-200" 
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button 
              variant="primary"
              size="lg"
              onClick={handleUpdatePassword}
              disabled={isSaving || !passwordForm.newPassword}
              className="w-full rounded-sm text-micro font-bold capitalize tracking-tight h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
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
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-micro font-bold text-emerald-600 tracking-tight">
                      Protected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-micro font-bold text-amber-600 tracking-tight">
                      Not configured
                    </span>
                  )}
                </div>
                <p className="text-tiny text-stone-400 font-medium mt-1 leading-relaxed">
                  Add an extra layer of security to your admin account by requiring a verification code from your mobile device.
                </p>
                <div className="flex gap-3 mt-4">
                  {mfaFactors.length > 0 ? (
                    <Button 
                      variant="outline-destructive" 
                      onClick={() => handleUnenrollMfa(mfaFactors[0].id)}
                      className="h-10 px-6 rounded-sm transition-all active:scale-95"
                    >
                      Disable protection
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleStartMfaEnroll}
                      className="h-10 px-6 text-micro font-bold capitalize tracking-tight border-stone-200 rounded-sm transition-all active:scale-95"
                    >
                      Enable MFA Protection
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
                  <img src={mfaEnrollData?.qr} alt="MFA QR Code" className="w-48 h-48" decoding="async" loading="lazy" />
                </div>
                <div className="space-y-2 text-center max-w-xs">
                  <p className="text-tiny font-bold text-stone-900">Scan this QR Code</p>
                  <p className="text-micro text-stone-400 leading-relaxed font-medium">
                    Use Google Authenticator, Authy, or any TOTP app to scan the code above.
                  </p>
                </div>
                <Button 
                  variant="primary"
                  onClick={() => setMfaStep('verify')}
                  className="w-full text-white font-bold capitalize tracking-tight text-micro h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                >
                  I've scanned it, proceed
                </Button>
              </div>
            )}

            {mfaStep === 'verify' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-micro font-bold tracking-tight text-stone-500">Verification code</Label>
                  <Input 
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="000 000"
                    className="h-12 text-center text-lg font-bold tracking-[0.5em] border-stone-200 rounded-sm"
                    maxLength={6}
                  />
                  <p className="text-micro text-stone-400 font-medium text-center">
                    Enter the 6-digit code shown in your authenticator app.
                  </p>
                </div>
                <Button 
                  variant="primary"
                  onClick={handleVerifyMfa}
                  disabled={isSaving || mfaCode.length < 6}
                  className="w-full text-white font-bold capitalize tracking-tight text-micro h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify and Enable MFA"}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setMfaStep('qr')}
                  className="w-full text-micro font-bold text-stone-400 capitalize tracking-tight hover:text-stone-600 h-auto p-2"
                >
                  Go back to QR code
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

---

### Task 2: Extract ButtonCustomizerTab

**Files:**
- Create: `src/pages/admin/settings/components/ButtonCustomizerTab.tsx`

- [ ] **Step 1: Implement ButtonCustomizerTab**
Extract button architecture and preview logic.

```tsx
import { Smartphone, Upload } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface ButtonCustomizerTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: any) => void
  isSaving: boolean
  handleSave: () => void
}

export function ButtonCustomizerTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  handleSave
}: ButtonCustomizerTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
        <CardTitle className="text-sm font-bold text-stone-900">Button Architecture</CardTitle>
        <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Configure the movement's global interactive element parameters and visual feedback systems.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-micro font-bold text-stone-500 normal-case">Global border radius</Label>
                <span className="text-micro font-mono font-bold text-primary">{(siteSettings.button_border_radius as string) || '0.125rem'}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Square', value: '0px' },
                  { label: 'XS', value: '0.125rem' },
                  { label: 'SM', value: '0.25rem' },
                  { label: 'MD', value: '0.5rem' },
                  { label: 'Full', value: '9999px' }
                ].map((radius) => (
                  <Button
                    key={radius.value}
                    variant={siteSettings.button_border_radius === radius.value ? "primary" : "default"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_border_radius: radius.value })}
                    className="h-10 text-[10px] font-bold px-0 rounded-none"
                  >
                    {radius.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Visual Feedback Systems</Label>
              <div className="flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50">
                <div>
                  <p className="text-xs font-bold text-stone-900">Neon Glow Effects</p>
                  <p className="text-micro text-stone-400 font-medium">Toggle administrative glow signatures on hover.</p>
                </div>
                <button 
                  onClick={() => setSiteSettings({ ...siteSettings, button_neon_enabled: !siteSettings.button_neon_enabled })}
                  className={cn(
                    "w-10 h-5 rounded-full flex items-center px-1 transition-colors",
                    siteSettings.button_neon_enabled ? "bg-emerald-500 justify-end" : "bg-stone-200 justify-start"
                  )}
                >
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            </div>

            {/* Typography Weight */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Typography Weight</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Normal', value: '400' },
                  { label: 'Bold', value: '700' },
                  { label: 'Black', value: '900' }
                ].map((weight) => (
                  <Button
                    key={weight.value}
                    variant={siteSettings.button_font_weight === weight.value ? "primary" : "default"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_font_weight: weight.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {weight.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Primary Button Text */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Primary Button Text</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Light Text', value: '0 0% 100%' },
                  { label: 'Dark Text', value: '220 15% 15%' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={siteSettings.button_primary_text_color === option.value ? "primary" : "default"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_primary_text_color: option.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-stone-50/50 p-8 rounded-sm border border-stone-100 relative">
            <style>
              {`
                .preview-gallery-container {
                  --button-radius: ${siteSettings.button_border_radius || '0.125rem'};
                  --button-font-weight: ${siteSettings.button_font_weight || '700'};
                }
                .preview-gallery-container button {
                  border-radius: var(--button-radius) !important;
                  font-weight: var(--button-font-weight) !important;
                }
              `}
            </style>

            <div className="preview-gallery-container space-y-8">
              <h4 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2 mb-6">
                <Smartphone className="w-4 h-4 text-primary" />
                Component Preview Gallery (Unsaved)
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Primary / Action</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary" neon={siteSettings.button_neon_enabled as boolean}>Join Movement</Button>
                    <Button variant="primary" size="sm" neon={siteSettings.button_neon_enabled as boolean}>Action</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Accent / Gold</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="gold" neon={siteSettings.button_neon_enabled as boolean}>Official Vision</Button>
                    <Button variant="gold" size="sm" neon={siteSettings.button_neon_enabled as boolean}>Vision</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-end border-t border-stone-100">
          <Button 
            variant="active-tab"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-sm text-micro font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
          >
            {isSaving ? 'Syncing...' : 'Save Button Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### Task 3: Extract AuditLogTab

**Files:**
- Create: `src/pages/admin/settings/components/AuditLogTab.tsx`

- [ ] **Step 1: Implement AuditLogTab**
Extract audit log table and filtering logic.

```tsx
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/services/adminService'

interface AuditLogTabProps {
  auditSearch: string
  setAuditSearch: (val: string) => void
  auditFilter: string
  setAuditFilter: (val: string) => void
  auditResourceFilter: string
  setAuditResourceFilter: (val: string) => void
  filteredLogs: AuditLogEntry[]
  handleExportLogs: () => void
}

export function AuditLogTab({
  auditSearch,
  setAuditSearch,
  auditFilter,
  setAuditFilter,
  auditResourceFilter,
  setAuditResourceFilter,
  filteredLogs,
  handleExportLogs
}: AuditLogTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-stone-900">Audit Log</CardTitle>
          <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Full traceability of administrative decisions and system modifications.</CardDescription>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleExportLogs}
          className="h-10 px-6 text-micro font-bold capitalize tracking-tight border-stone-200 rounded-sm hover:bg-stone-50 transition-all active:scale-95"
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
              className="pl-9 h-9 text-tiny border-stone-200 bg-white rounded-sm focus:ring-0"
            />
          </div>
          <select 
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none"
          >
            <option>All Status</option>
            <option>Success</option>
            <option>Warning</option>
            <option>Failure</option>
          </select>
          <select 
            value={auditResourceFilter}
            onChange={(e) => setAuditResourceFilter(e.target.value)}
            className="h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none"
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
                <th className="p-4 pl-8 text-micro font-bold tracking-tight text-stone-400">Timestamp</th>
                <th className="p-4 text-micro font-bold tracking-tight text-stone-400">Admin</th>
                <th className="p-4 text-micro font-bold tracking-tight text-stone-400">Action</th>
                <th className="p-4 pr-8 text-right text-micro font-bold tracking-tight text-stone-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredLogs.length > 0 ? (
                filteredLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 pl-8 text-micro font-medium text-stone-400">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-xs font-bold text-stone-900">{log.adminName.split(' ')[0]}</td>
                    <td className="p-4 text-tiny font-medium text-stone-600 italic">{log.action.toLowerCase()}</td>
                    <td className="p-4 pr-8 text-right">
                      <div className={cn("w-1.5 h-1.5 rounded-full inline-block", 
                        log.status === 'Success' ? "bg-emerald-500" : 
                        log.status === 'Warning' ? "bg-amber-500" : "bg-destructive"
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
  )
}
```

---

### Task 4: Refactor AdminSettings.tsx

**Files:**
- Modify: `src/pages/admin/Settings.tsx`

- [ ] **Step 1: Update Imports and Component usage**
Import all extracted components and use them in the `switch` or conditional rendering block. Remove the inline card logic for each tab.

- [ ] **Step 2: Verification**
Ensure all state and handlers are correctly passed as props. Verify that the UI remains functional and looks identical.

- [ ] **Step 3: Cleanup**
Remove unused imports and ensure the file is significantly smaller and more readable.
