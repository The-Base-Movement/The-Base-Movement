import { ArrowRight, Zap, Loader2, Eye, EyeOff, Upload } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { cn } from '@/lib/utils'
import type { RegistrationFormData, Region, Constituency } from '@/types/registration'

interface RegistrationFormProps {
  platform: string
  formStep: number
  formData: RegistrationFormData
  isLoading: boolean
  isScanningId: boolean
  showPassword: boolean
  agreed: boolean
  photoUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  dbCountries: string[]
  dbCountryCodes: Record<string, string>
  dbRegions: Region[]
  dbConstituencies: Constituency[]
  ageRanges: string[]
  onPlatformChange: (p: string) => void
  onIdScan: (e: React.ChangeEvent<HTMLInputElement>) => void
  onInputChange: (field: string, value: string | number) => void
  onPasswordToggle: () => void
  onAgreedChange: (val: boolean) => void
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCropChange: (c: { x: number; y: number }) => void
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void
  onZoomChange: (z: number) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function RegistrationForm(props: RegistrationFormProps) {
  const {
    platform, formStep, formData, isLoading, isScanningId,
    showPassword, agreed, photoUrl, crop, zoom,
    dbCountries, dbCountryCodes, dbRegions, dbConstituencies, ageRanges,
    onPlatformChange, onIdScan, onInputChange, onPasswordToggle,
    onAgreedChange, onPhotoUpload, onCropChange, onCropComplete, onZoomChange,
    onBack, onSubmit
  } = props

  return (
    <div className="bg-white border border-border/60 p-8 md:p-12 shadow-sm">
      <form onSubmit={onSubmit}>
        {formStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b-2 border-primary/20 pb-3 mb-8">
              <h3 className="text-on-surface">Step 1: Primary details</h3>
            </div>

            {platform === 'GHANA' && (
              <div className="relative overflow-hidden mb-10 bg-on-surface rounded-sm p-8 border border-white/5 shadow-2xl">
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">    
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-accent" />
                      <h4 className="text-white font-meta font-bold tracking-tight text-lg">AI identity verification</h4>
                    </div>
                    <p className="text-white/80 text-sm max-w-sm mb-0">Scan Ghana Card for auto-fill.</p>       
                  </div>
                  <div className="relative shrink-0">
                    <input type="file" accept="image/*" onChange={onIdScan} disabled={isScanningId} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    <Button type="button" variant="solid" disabled={isScanningId}>{isScanningId ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : <><Eye className="w-4 h-4 mr-2" /> Scan National ID</>}</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Full name</label>
              <input required pattern=".*\s+.*" title="Please enter both your first and last name separated by a space." value={formData.fullName} onChange={(e) => onInputChange('fullName', e.target.value)} className="w-full form-understate p-4 text-sm" />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Membership platform</label>
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant={platform === 'GHANA' ? 'primary' : 'default'} onClick={() => onPlatformChange('GHANA')} className={cn("h-auto p-4 text-sm", platform === 'GHANA' ? "" : "text-stone-500 border-stone-200")}>Ghana Base</Button>
                <Button type="button" variant={platform === 'DIASPORA' ? 'gold' : 'default'} onClick={() => onPlatformChange('DIASPORA')} className={cn("h-auto p-4 text-sm", platform === 'DIASPORA' ? "" : "text-stone-500 border-stone-200")}>Diaspora Base</Button>
              </div>
            </div>

            {platform === 'GHANA' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">National ID number (Optional)</label>
                <input value={formData.idNumber} onChange={(e) => onInputChange('idNumber', e.target.value)} placeholder="GHA-000000000-0" className="w-full form-understate p-4 text-sm" />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {platform === 'DIASPORA' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Country</label>
                  <select required value={formData.country} onChange={(e) => onInputChange('country', e.target.value)} className="w-full form-understate p-4 text-sm">
                    <option value="">Select Country</option>
                    {dbCountries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Phone</label>
                <div className="flex">
                  <select value={formData.countryCode} onChange={(e) => onInputChange('countryCode', e.target.value)} className="px-2 bg-muted border border-border/60 text-xs">
                    {Array.from(new Set(Object.values(dbCountryCodes))).map(code => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <input required value={formData.contactNumber} onChange={(e) => onInputChange('contactNumber', e.target.value)} className="w-full form-understate p-4 text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={8} value={formData.password} onChange={(e) => onInputChange('password', e.target.value)} className="w-full form-understate p-4 pr-12 text-sm" />
                <Button type="button" variant="ghost" onClick={onPasswordToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-primary">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b-2 border-primary/20 pb-3 mb-8">
              <h3 className="text-on-surface">Step 2: Demographic details</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Age range</label>
                <select required value={formData.ageRange} onChange={(e) => onInputChange('ageRange', e.target.value)} className="w-full form-understate p-4 text-sm">
                  <option value="">Select Range</option>
                  {ageRanges.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Gender</label>
                <select required value={formData.gender} onChange={(e) => onInputChange('gender', e.target.value)} className="w-full form-understate p-4 text-sm">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            {platform === 'GHANA' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Region</label>
                  <select required value={formData.region} onChange={(e) => onInputChange('region', e.target.value)} className="w-full form-understate p-4 text-sm">
                    <option value="">Select Region</option>
                    {dbRegions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Constituency</label>
                  <select required value={formData.constituency} onChange={(e) => onInputChange('constituency', e.target.value)} className="w-full form-understate p-4 text-sm">
                    <option value="">Select Constituency</option>
                    {formData.region && dbConstituencies
                      .filter(c => c.region_id === dbRegions.find(r => r.name === formData.region)?.id)
                      .map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                    }
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {formStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b-2 border-primary/20 pb-3 mb-8">
              <h3 className="text-on-surface">Step 3: Emergency & profile</h3>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Profession</label>
              <input required value={formData.profession} onChange={(e) => onInputChange('profession', e.target.value)} className="w-full form-understate p-4 text-sm" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Emergency name</label>
                <input required value={formData.emergencyContactName} onChange={(e) => onInputChange('emergencyContactName', e.target.value)} className="w-full form-understate p-4 text-sm" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Emergency phone</label>
                <input required value={formData.emergencyNumber} onChange={(e) => onInputChange('emergencyNumber', e.target.value)} className="w-full form-understate p-4 text-sm" />
              </div>
            </div>
          </div>
        )}

        {formStep === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b-2 border-primary/20 pb-3 mb-8">
              <h3 className="text-on-surface">Step 4: Final verification</h3>
            </div>
            <div className="space-y-6">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Photo</label>
              {!photoUrl ? (
                <div className="border-2 border-dashed p-12 text-center bg-muted/30 relative">
                  <input type="file" accept="image/*" onChange={onPhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload className="mx-auto mb-4 text-muted-foreground/40" />
                  <p className="text-micro font-bold text-muted-foreground">Upload photo</p>
                </div>
              ) : (
                <div className="relative h-[400px] bg-on-surface">
                  <Cropper image={photoUrl} crop={crop} zoom={zoom} aspect={3/4} onCropChange={onCropChange} onCropComplete={onCropComplete} onZoomChange={onZoomChange} />
                </div>
              )}
            </div>
            <div className="flex items-start gap-4 p-6 bg-on-surface text-white border-l-4 border-primary">
              <input type="checkbox" checked={agreed} onChange={(e) => onAgreedChange(e.target.checked)} className="mt-1" />
              <label className="text-sm">I accept the declaration and agree to the Privacy Policy.</label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-10 mt-12 border-t border-border/60 flex justify-between gap-4">
          {formStep > 1 && (
            <Button type="button" variant="default" onClick={onBack} className="w-1/3 py-6">Back</Button>       
          )}
          <Button type="submit" variant="solid" disabled={(formStep === 4 && !agreed) || isLoading} className="flex-1 py-6">
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : (
              <>
                {formStep < 4 ? 'Next step' : 'Submit registration'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
