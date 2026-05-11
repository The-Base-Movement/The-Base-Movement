# Registration Flow Refactoring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `src/pages/Register.tsx` into modular components to fix HTML integrity issues, improve maintainability, and ensure "Ghana First" design compliance.

**Architecture:** Split the large `Register.tsx` into smaller components residing in `src/pages/register/components/`. Use a coordinator component (`Register.tsx`) to manage state and transitions.

**Tech Stack:** React, TypeScript, TailwindCSS, Lucide React, Supabase.

---

### Task 1: Create Component Directory and Extract ChoiceStep

**Files:**
- Create: `src/pages/register/components/ChoiceStep.tsx`
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Create ChoiceStep component**
Extract the registration option cards (Local vs Diaspora) into a standalone component.

```tsx
// src/pages/register/components/ChoiceStep.tsx
import { Link } from 'react-router-dom'
import { FileText, User, ArrowRight, Download } from 'lucide-react'
import SEO from '@/components/SEO'

interface ChoiceStepProps {
  settings: any
  onSelect: (platform: string) => void
}

export function ChoiceStep({ settings, onSelect }: ChoiceStepProps) {
  return (
    <div className="max-w-5xl w-full mx-auto">
      <SEO 
        title="Join the Movement"
        description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
        canonical="/register"
      />
      <div className="text-center mb-12">
        <img src={settings.logo_url} alt="The Base" className="h-24 w-auto mx-auto mb-6 object-contain" />
        <h1 className="text-4xl font-bold text-on-surface tracking-tighter font-meta mb-2">The Base</h1>
        <div className="w-20 h-1.5 bg-destructive mx-auto mb-6"></div>
        <h2 className="text-sm font-bold text-muted-foreground tracking-tight font-meta">Membership registration options</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Local Membership Card */}
        <div 
          onClick={() => onSelect('GHANA')}
          className="group relative bg-white border border-border/60 hover:border-brand-green/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-green group-hover:w-full transition-all duration-700" />
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="w-20 h-20 bg-brand-green/5 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                <FileText className="w-10 h-10 text-brand-green" />
              </div>
              <div className="text-micro font-bold text-brand-green bg-brand-green/10 px-3 py-1 tracking-tight">In-country</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-green transition-colors">
                Local membership <br/> (Ghana)
              </h3>
              <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                Designed for citizens and residents currently living within the 16 regions of Ghana.
              </p>
              <ul className="space-y-3">
                {[
                  'Automatic assignment to your regional chapter',
                  'Full voting rights on tactical directives',
                  'Eligibility for local leadership roles'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-green">
              Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Diaspora Membership Card */}
        <div 
          onClick={() => onSelect('DIASPORA')}
          className="group relative bg-white border border-border/60 hover:border-brand-gold/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-gold group-hover:w-full transition-all duration-700" />
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="w-20 h-20 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                <User className="w-10 h-10 text-brand-gold" />
              </div>
              <div className="text-micro font-bold text-brand-gold bg-brand-gold/10 px-3 py-1 tracking-tight">Global community</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-gold transition-colors">
                Diaspora <br/> membership
              </h3>
              <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                Tailored for Ghanaians and supporters living abroad.
              </p>
              <ul className="space-y-3">
                {[
                  'Participation in global advisory committees',
                  'Access to digital town halls',
                  'Dedicated Diaspora Member ID'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-gold">
              Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 pt-8 border-t border-border/60">
        <p className="text-sm text-muted-foreground font-body-md">
          Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign in securely</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/pages/register/components/ChoiceStep.tsx
git commit -m "refactor: extract ChoiceStep component for registration"
```

### Task 2: Extract SuccessStep Component

**Files:**
- Create: `src/pages/register/components/SuccessStep.tsx`

- [ ] **Step 1: Create SuccessStep component**
Extract the registration completion screen.

```tsx
// src/pages/register/components/SuccessStep.tsx
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import MembershipCard from '../../components/MembershipCard'
import { useNavigate } from 'react-router-dom'

interface SuccessStepProps {
  formData: any
  photoUrl: string | null
  regNumber: string
  onEdit: () => void
}

export function SuccessStep({ formData, photoUrl, regNumber, onEdit }: SuccessStepProps) {
  const navigate = useNavigate()
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-on-surface tracking-tighter font-meta mb-2">Registration complete</h1>
        <p className="text-muted-foreground/90 font-meta tracking-tight text-xs">Welcome to the movement, patriot.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white border border-border/60 p-2 shadow-2xl relative">
          <div className="border-b border-border/40 pb-3 mb-4 px-4 pt-2">
            <h3 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight">Official membership card</h3>
          </div>
          
          <div className="max-w-md mx-auto py-4">
            <MembershipCard 
              userName={formData.fullName}
              avatarUrl={photoUrl}
              userRegNo={regNumber}
              initials={formData.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')}
              gender={formData.gender + ' / ' + formData.ageRange}
              joinedDate={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              status="Active & Verified"
              region={formData.region}
              constituency={formData.constituency}
              country={formData.country}
              chapter={formData.chapter}
            />
          </div>

          <div className="bg-muted/30 p-6 mt-4 border-t border-border/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-meta font-bold text-xs text-on-surface tracking-tight mb-1">Registration number</h4>
                <p className="font-meta font-bold text-xl text-primary tracking-tight">{regNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="gold"
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-6 py-3 h-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Print card
                </Button>
                <Button 
                  variant="default"
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 px-6 py-3 h-auto text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit info
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-border/60 p-8 shadow-sm">
            <h4 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight mb-4">Membership verification</h4>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <p className="text-xs font-bold text-on-surface font-meta tracking-tight">Status: Verified</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-body-md leading-relaxed">
              Your official records have been synchronized with the movement's hub.
            </p>
          </div>

          <div className="bg-primary text-primary-foreground p-8 flex flex-col justify-between shadow-lg">
            <div>
              <h4 className="font-meta font-bold text-micro text-primary-foreground/90 tracking-tight mb-4 uppercase">Next step</h4>
              <p className="text-sm font-bold font-meta leading-tight mb-4">Access your portal to join a chapter.</p>
            </div>
            <Button
              variant="default"
              onClick={() => navigate('/dashboard')}
              className="w-full inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-primary-foreground h-auto p-3 text-center justify-center font-bold transition-all active:scale-95 shadow-sm"
            >
              Enter Overview <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit Task 2**
```bash
git add src/pages/register/components/SuccessStep.tsx
git commit -m "refactor: extract SuccessStep component for registration"
```

### Task 3: Extract RegistrationForm Component

**Files:**
- Create: `src/pages/register/components/RegistrationForm.tsx`

- [ ] **Step 1: Create RegistrationForm component**
Extract the multi-step form logic. This is the most complex task.

```tsx
// src/pages/register/components/RegistrationForm.tsx
import { ArrowRight, ArrowLeft, Zap, Loader2, Eye, EyeOff, Upload, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import Cropper from 'react-easy-crop'
import { cn } from '@/lib/utils'

interface RegistrationFormProps {
  platform: string
  formStep: number
  formData: any
  isLoading: boolean
  isScanningId: boolean
  showPassword: boolean
  agreed: boolean
  photoUrl: string | null
  crop: any
  zoom: number
  dbCountries: string[]
  dbCountryCodes: Record<string, string>
  dbRegions: any[]
  dbConstituencies: any[]
  ageRanges: string[]
  onPlatformChange: (p: string) => void
  onIdScan: (e: any) => void
  onInputChange: (field: string, value: string) => void
  onPasswordToggle: () => void
  onAgreedChange: (val: boolean) => void
  onPhotoUpload: (e: any) => void
  onCropChange: (c: any) => void
  onCropComplete: (a: any, p: any) => void
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
        {/* Step 1: Primary Details */}
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
                    <Button type="button" variant="solid" disabled={isScanningId}>{isScanningId ? 'Scanning...' : 'Scan ID'}</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Full name</label>
              <input required value={formData.fullName} onChange={(e) => onInputChange('fullName', e.target.value)} className="w-full form-understate p-4 text-sm" />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Membership platform</label>
              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant={platform === 'GHANA' ? 'primary' : 'default'} onClick={() => onPlatformChange('GHANA')}>Ghana Base</Button>
                <Button type="button" variant={platform === 'DIASPORA' ? 'gold' : 'default'} onClick={() => onPlatformChange('DIASPORA')}>Diaspora Base</Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-on-surface font-meta tracking-tight block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={(e) => onInputChange('password', e.target.value)} className="w-full form-understate p-4 pr-12 text-sm" />
                <Button type="button" variant="ghost" onClick={onPasswordToggle} className="absolute right-4 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="pt-10 mt-12 border-t border-border/60 flex justify-between gap-4">
          {formStep > 1 && (
            <Button type="button" variant="default" onClick={onBack} className="w-1/3 py-6">Back</Button>
          )}
          <Button type="submit" variant="solid" disabled={(formStep === 4 && !agreed) || isLoading} className="flex-1 py-6">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (formStep < 4 ? 'Next step' : 'Submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit Task 3**
```bash
git add src/pages/register/components/RegistrationForm.tsx
git commit -m "refactor: extract RegistrationForm component for registration"
```

### Task 4: Finalize Register Page Coordinator

**Files:**
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Simplify Register.tsx**
Use the newly created components and remove redundant HTML.

```tsx
// src/pages/Register.tsx
import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import { ChoiceStep } from './register/components/ChoiceStep'
import { RegistrationForm } from './register/components/RegistrationForm'
import { SuccessStep } from './register/components/SuccessStep'
import { getCroppedImg } from '@/lib/imageUtils'
import { CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'

export default function Register() {
  const { settings } = useBranding()
  const [searchParams] = useSearchParams()
  const platformParam = searchParams.get('platform')
  const [step, setStep] = useState<'choice' | 'form' | 'upload'>(platformParam ? 'form' : 'choice')
  const [formStep, setFormStep] = useState<number>(1)
  const [submitted, setSubmitted] = useState(false)
  // ... rest of state and effects from original file ...

  if (submitted) {
    return (
      <main className="bg-background font-body-md min-h-screen py-12 px-4">
        <SuccessStep 
          formData={formData} 
          photoUrl={photoUrl} 
          regNumber={regNumber} 
          onEdit={() => setSubmitted(false)} 
        />
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-background font-body-md min-h-screen flex flex-col justify-center py-12 px-4">
        <ChoiceStep settings={settings} onSelect={(p) => { setPlatform(p); setStep('form'); }} />
      </main>
    )
  }

  return (
    <main className="bg-background font-body-md min-h-screen">
       {/* Header and Sidebar Progress remain here or extracted to small local components */}
       <RegistrationForm 
         // ... pass all props ...
       />
    </main>
  )
}
```

- [ ] **Step 2: Commit Task 4**
```bash
git add src/pages/Register.tsx
git commit -m "refactor: finalize modular Register page"
```
