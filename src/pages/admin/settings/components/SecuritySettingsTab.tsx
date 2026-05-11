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

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface MfaEnrollData {
  id: string
  qr: string
}

interface SecuritySettingsTabProps {
  passwordForm: PasswordForm
  setPasswordForm: (form: PasswordForm) => void
  isSaving: boolean
  handleUpdatePassword: () => void
  mfaFactors: Factor[]
  handleStartMfaEnroll: () => void
  handleUnenrollMfa: (id: string) => void
  showMfaDialog: boolean
  setShowMfaDialog: (show: boolean) => void
  mfaStep: 'qr' | 'verify'
  setMfaStep: (step: 'qr' | 'verify') => void
  mfaEnrollData: MfaEnrollData | null
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
