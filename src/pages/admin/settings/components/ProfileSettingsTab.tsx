import { Camera, Loader2 } from 'lucide-react'
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
import type { AdminUser } from '@/services/adminService'

interface ProfileForm {
  fullName: string
  email: string
  phone: string
  avatarUrl: string
}

interface ProfileSettingsTabProps {
  profileForm: ProfileForm
  setProfileForm: (form: ProfileForm) => void
  isUploading: boolean
  isSaving: boolean
  adminData: AdminUser | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleAvatarClick: () => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSaveProfile: () => void
}

export function ProfileSettingsTab({
  profileForm,
  setProfileForm,
  isUploading,
  isSaving,
  adminData,
  fileInputRef,
  handleAvatarClick,
  handleFileChange,
  handleSaveProfile
}: ProfileSettingsTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
        <CardTitle className="text-sm font-bold text-stone-900">Profile</CardTitle>
        <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Manage your public and internal administrative identity.</CardDescription>
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
                  <img src={profileForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" decoding="async" loading="lazy" />
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
              <p className="text-micro text-stone-400 font-medium mt-1">PNG, JPG up to 2MB</p>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-micro font-bold text-stone-500 normal-case">Full name</Label>
              <Input 
                value={profileForm.fullName} 
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="h-10 rounded-sm border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-micro font-bold text-stone-500 normal-case">Email address</Label>
              <Input value={profileForm.email} disabled className="h-10 rounded-sm border-stone-100 bg-stone-50 text-stone-400 text-xs font-medium cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <Label className="text-micro font-bold text-stone-500 normal-case">Administrative role</Label>
              <div className="h-10 px-3 flex items-center rounded-sm border border-stone-100 bg-stone-50 text-stone-400 text-micro font-bold normal-case">
                {adminData?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                 adminData?.role === 'REGIONAL_DIRECTOR' ? 'Regional Director' :
                 adminData?.role === 'CONSTITUENCY_LEAD' ? 'Constituency Lead' :
                 adminData?.role || (adminData ? 'Standard Staff' : 'HQ Officer')}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-micro font-bold text-stone-500 normal-case">Phone number</Label>
              <Input 
                value={profileForm.phone} 
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+233 XX XXX XXXX"
                className="h-10 rounded-sm border-stone-200 bg-white focus:ring-[var(--brand-red)]/10 focus:border-[var(--brand-red)] transition-all text-xs font-medium" 
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end border-t border-stone-100">
            <Button 
              variant="active-tab"
              size="lg"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="rounded-sm text-micro font-bold tracking-tight px-8 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
            >
              {isSaving ? 'Syncing...' : 'Synchronize Profile'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
