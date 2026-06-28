import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { ChoiceStep } from './register/components/ChoiceStep'
import { RegistrationForm } from './register/components/RegistrationForm'
import { SuccessStep } from './register/components/SuccessStep'
import { PhysicalSuccessStep } from './register/components/PhysicalSuccessStep'
import { scanFormFile } from '@/lib/scanForm'
import { useRegistrationData } from './register/useRegistrationData'
import { useRegistrationSubmit } from './register/useRegistrationSubmit'
import type { RegistrationFormData } from '@/types/registration'
import type { Area } from 'react-easy-crop'
import SEO from '@/components/SEO'
import { OfflineBanner } from '@/components/OfflineBanner'
import { OfflineSuccessStep } from './register/components/OfflineSuccessStep'
import { saveDraftRegistration } from '@/utils/offlineDb'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { validatePhone } from '@/lib/phoneValidation'

export default function Register() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const platformParam = searchParams.get('platform')
  const refParam = searchParams.get('ref')

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true })
  }, [session, navigate])
  const _savedDraft = (() => {
    try {
      const s = sessionStorage.getItem('reg_draft')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const [step, setStep] = useState<'choice' | 'form'>(
    platformParam ? 'form' : _savedDraft?.formData ? 'form' : 'choice'
  )
  const [formStep, setFormStep] = useState<number>(_savedDraft?.formStep || 1)
  const [platform, setPlatform] = useState(platformParam || _savedDraft?.platform || 'GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [physicalSubmitted, setPhysicalSubmitted] = useState(false)
  const [usedScan, setUsedScan] = useState(false)
  const [isScanningForm, setIsScanningForm] = useState(false)
  const [scanStatus, setScanStatus] = useState('Scanning form…')
  const [offlineSubmitted, setOfflineSubmitted] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const { isOnline } = useOfflineSync()

  const { dbCountries, dbCountryCodes, dbRegions, dbConstituencies, dbChapters } =
    useRegistrationData()
  const { isLoading, regNumber, submitted, setSubmitted, submitRegistration, cooldown } =
    useRegistrationSubmit()

  const DRAFT_KEY = 'reg_draft'

  const [formData, setFormData] = useState<RegistrationFormData>(() => {
    const defaults: RegistrationFormData = {
      idNumber: '',
      fullName: '',
      countryCode: platform === 'DIASPORA' ? '' : '+233',
      country: platform === 'DIASPORA' ? '' : 'Ghana',
      children_count: 0,
      contactNumber: '',
      ageRange: '',
      gender: 'Male',
      password: '',
      email: '',
      residentialAddress: '',
      region: '',
      constituency: '',
      chapter: '',
      profession: '',
      educationLevel: '',
      emergencyContactName: '',
      emergencyRelationship: '',
      emergencyNumber: '',
    }
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.formData) {
          return { ...defaults, ...parsed.formData, password: '' }
        }
      }
    } catch {
      /* ignore */
    }
    return defaults
  })

  const saveDraft = useCallback(() => {
    try {
      const { password: _pw, ...safe } = formData
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          formData: safe,
          platform,
          formStep,
        })
      )
    } catch {
      /* ignore */
    }
  }, [formData, platform, formStep])

  useEffect(() => {
    saveDraft()
  }, [saveDraft])

  const handleChange = <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) => {
    setFormData((prev) => {
      const updates = { ...prev, [field]: value }
      if (field === 'country' && typeof value === 'string' && dbCountryCodes[value]) {
        updates.countryCode = dbCountryCodes[value]
      }
      return updates
    })
  }

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    if (newPlatform === 'GHANA') {
      setFormData((prev) => ({ ...prev, country: 'Ghana', countryCode: '+233' }))
    } else {
      setFormData((prev) => ({
        ...prev,
        country: prev.country === 'Ghana' ? '' : prev.country,
        countryCode: prev.country === 'Ghana' ? '' : prev.countryCode,
      }))
    }
  }

  const handleFormScan = async (file: File) => {
    setIsScanningForm(true)
    setScanStatus('Preparing…')
    try {
      const { platform: detectedPlatform, fields } = await scanFormFile(file, setScanStatus)
      handlePlatformChange(detectedPlatform)
      setFormData((prev) => ({ ...prev, ...fields }))
      setStep('form')
      setFormStep(1)
      const fieldCount = Object.keys(fields).length
      const platformLabel = detectedPlatform === 'DIASPORA' ? 'Diaspora' : 'Ghana'
      if (fieldCount === 0) {
        toast.warning('Nothing could be read from the form — please fill in your details manually.')
      } else if (fieldCount < 4) {
        toast.info(
          `${platformLabel} form partially read — please review and complete the remaining fields.`
        )
        setUsedScan(true)
      } else {
        toast.success(`${platformLabel} form scanned — please review and complete your details.`)
        setUsedScan(true)
      }
    } catch (error) {
      console.error('Form scan error:', error)
      toast.error('Could not read form. Please fill in your details manually.')
      setStep('form')
      setFormStep(1)
    } finally {
      setIsScanningForm(false)
    }
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!formData.fullName.trim()) return 'Full name is required.'
      if (formData.fullName.trim().split(/\s+/).length < 2)
        return 'Please enter your full name (first and last).'
      if (platform === 'GHANA' && !formData.idNumber.trim()) return 'Ghana Card number is required.'
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        return 'Please enter a valid email address.'
    }
    if (step === 2) {
      if (platform === 'GHANA') {
        if (!formData.region) return 'Please select your region.'
      } else {
        if (!formData.country) return 'Please select your country.'
      }
      const phoneErr = validatePhone(formData.contactNumber, formData.countryCode)
      if (phoneErr) return phoneErr
      if (!formData.gender) return 'Please select your gender.'
      if (!formData.ageRange) return 'Please select your age range.'
      if (!formData.password || formData.password.length < 8)
        return 'Password must be at least 8 characters.'
    }
    if (step === 4) {
      if (!formData.emergencyContactName.trim()) return 'Emergency contact name is required.'
      if (!formData.emergencyNumber.trim()) return 'Emergency contact number is required.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 4) {
      const error = validateStep(formStep)
      if (error) {
        toast.error(error)
        return
      }
      setFormStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const finalError = validateStep(4)
      if (finalError) {
        toast.error(finalError)
        return
      }
      if (!isOnline) {
        try {
          await saveDraftRegistration({
            platform,
            formData,
            photoUrl,
            croppedAreaPixels,
            usedScan,
            refParam,
          })
          setOfflineSubmitted(true)
          toast.success('Registration saved locally. It will auto-sync once signal is restored!')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (error) {
          console.error('[REGISTER] Offline draft save failed:', error)
          toast.error('Failed to save offline draft locally.')
        }
      } else {
        try {
          await submitRegistration({
            platform,
            formData,
            photoUrl,
            croppedAreaPixels,
            usedScan,
            refParam,
          })
        } catch (err) {
          if (!navigator.onLine) {
            // Sudden signal loss fallback
            try {
              await saveDraftRegistration({
                platform,
                formData,
                usedScan,
                refParam,
              })
              setOfflineSubmitted(true)
              toast.success('Connection lost during submission. Saved securely as offline draft!')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } catch (saveErr) {
              console.error('[REGISTER] Offline fallback draft save failed:', saveErr)
              toast.error('Connection lost and failed to save offline draft.')
            }
          } else {
            toast.error((err as Error)?.message || 'Registration failed. Please try again.')
          }
        }
      }
    }
  }

  const handleRegisterAnother = () => {
    setFormData({
      idNumber: '',
      fullName: '',
      countryCode: '+233',
      country: 'Ghana',
      children_count: 0,
      contactNumber: '',
      ageRange: '',
      gender: 'Male',
      password: '',
      email: '',
      residentialAddress: '',
      region: '',
      constituency: '',
      chapter: '',
      profession: '',
      educationLevel: '',
      emergencyContactName: '',
      emergencyRelationship: '',
      emergencyNumber: '',
    })
    setStep('choice')
    setFormStep(1)
    setPhotoUrl(null)
    setCroppedAreaPixels(null)
    setOfflineSubmitted(false)
    setSubmitted(false)
  }

  if (submitted) {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    return (
      <main className="bg-container-low min-h-screen py-12 px-4 flex items-center justify-center">
        <SuccessStep
          formData={formData}
          photoUrl={photoUrl}
          regNumber={regNumber}
          onEdit={() => setSubmitted(false)}
        />
      </main>
    )
  }

  if (offlineSubmitted) {
    return (
      <main className="bg-container-low min-h-screen py-12 px-4 flex items-center justify-center">
        <OfflineSuccessStep formData={formData} onRegisterAnother={handleRegisterAnother} />
      </main>
    )
  }

  if (physicalSubmitted) {
    return (
      <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
        <PhysicalSuccessStep onUploadAnother={() => setPhysicalSubmitted(false)} />
      </main>
    )
  }

  if (step === 'choice') {
    return (
      <main className="bg-container-low min-h-screen flex items-center justify-center py-12 px-4">
        <OfflineBanner />
        <ChoiceStep
          isScanning={isScanningForm}
          scanStatus={scanStatus}
          onSelect={(p, file) => {
            if (p === 'PHYSICAL' && file) {
              handleFormScan(file)
            } else {
              handlePlatformChange(p)
              setStep('form')
              setFormStep(1)
            }
          }}
        />
      </main>
    )
  }

  return (
    <main className="bg-container-low min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <OfflineBanner />
      <SEO
        title="Member Registration"
        description="Join The Base Movement. Create your account and help build a better Ghana."
        canonical="/register"
      />

      <div className="max-w-[480px] w-full">
        <nav
          className="breadcrumb-nav flex items-center gap-2 mb-8 mt-5 backdrop-blur-sm px-4 py-2 rounded-full border"
          style={{ background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.5)' }}
        >
          <Link
            to="/"
            className="hover:text-primary transition-colors flex items-center gap-1.5 shrink-0"
            style={{ color: 'hsl(var(--on-surface-muted))' }}
          >
            <span className="material-symbols-outlined shrink-0" style={{ fontSize: 14 }}>
              home
            </span>
            <span className="text-xs font-medium font-meta shrink-0">Home</span>
          </Link>
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: 12, color: 'hsl(var(--border))' }}
          >
            chevron_right
          </span>
          <button
            onClick={() => setStep('choice')}
            className="hover:text-primary transition-colors text-xs font-medium font-meta shrink-0 bg-transparent border-none cursor-pointer"
            style={{
              color:
                (step as string) === 'choice'
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--on-surface-muted))',
            }}
          >
            Register
          </button>
          {step === 'form' && (
            <>
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontSize: 12, color: 'hsl(var(--border))' }}
              >
                chevron_right
              </span>
              <span
                className="text-xs font-medium font-meta max-w-[140px] truncate shrink-0"
                style={{ color: 'hsl(var(--primary))' }}
              >
                {platform === 'GHANA' ? 'Ghana Network' : 'Diaspora Network'}
              </span>
            </>
          )}
        </nav>

        <RegistrationForm
          platform={platform}
          formStep={formStep}
          formData={formData}
          isLoading={isLoading}
          cooldown={cooldown}
          showPassword={showPassword}
          agreed={agreed}
          dbCountries={dbCountries}
          dbRegions={dbRegions}
          dbConstituencies={dbConstituencies}
          dbChapters={dbChapters}
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
          onCropComplete={setCroppedAreaPixels}
          onPlatformChange={handlePlatformChange}
          onInputChange={handleChange}
          onPasswordToggle={() => setShowPassword(!showPassword)}
          onAgreedChange={setAgreed}
          onBack={() => setFormStep((prev) => prev - 1)}
          onSubmit={handleSubmit}
        />

        <div className="mt-8 text-center">
          <p className="text-[12px] text-on-surface-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
