import { useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { Area } from 'react-easy-crop'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useBranding } from '@/hooks/useBranding'
import { ChoiceStep } from './register/components/ChoiceStep'
import { RegistrationForm } from './register/components/RegistrationForm'
import { SuccessStep } from './register/components/SuccessStep'
import { PhysicalSuccessStep } from './register/components/PhysicalSuccessStep'
import { scanFormFile } from '@/lib/scanForm'
import { useRegistrationData } from './register/useRegistrationData'
import { useRegistrationSubmit } from './register/useRegistrationSubmit'
import type { RegistrationFormData } from '@/types/registration'
import SEO from '@/components/SEO'

export default function Register() {
  const { settings } = useBranding()
  const [searchParams] = useSearchParams()
  const platformParam = searchParams.get('platform')
  const refParam = searchParams.get('ref')
  const [step, setStep] = useState<'choice' | 'form'>(platformParam ? 'form' : 'choice')
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState(platformParam || 'GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [physicalSubmitted, setPhysicalSubmitted] = useState(false)
  const [usedScan, setUsedScan] = useState(false)
  const [isScanningId, setIsScanningId] = useState(false)
  const [isScanningForm, setIsScanningForm] = useState(false)
  const [isVerifyingKyc, setIsVerifyingKyc] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const { dbCountries, dbCountryCodes, dbRegions, dbConstituencies, dbChapters } =
    useRegistrationData()
  const { isLoading, regNumber, submitted, setSubmitted, submitRegistration } =
    useRegistrationSubmit()

  const [formData, setFormData] = useState<RegistrationFormData>({
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

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

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
    if (newPlatform === 'GHANA')
      setFormData((prev) => ({ ...prev, country: 'Ghana', countryCode: '+233' }))
  }

  const handleIdScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsScanningId(true)
    try {
      const file = e.target.files[0]
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string
          setPhotoUrl(result)
          resolve(result)
        }
        reader.readAsDataURL(file)
      })

      // Standard OCR fallback for quick ID extraction
      const { data, error } = await supabase.functions.invoke('ocr-verify', {
        body: { imageBase64: base64 },
      })
      if (error) throw error
      if (data?.success && data?.data) {
        setFormData((prev) => ({ ...prev, idNumber: data.data.idNumber || prev.idNumber }))
        toast.success('Ghana Card identified.')
      }
    } catch {
      console.warn('[REGISTER] OCR identification skipped.')
    } finally {
      setIsScanningId(false)
    }
  }

  const handleSelfieCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => setSelfieUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const runKycProtocol = async () => {
    if (!photoUrl || !selfieUrl) {
      toast.error('Both ID photo and selfie are required for biometric verification.')
      return
    }

    setIsVerifyingKyc(true)
    try {
      const { tacticalService } = await import('@/services/tacticalService')
      const result = await tacticalService.verifyMemberID(
        formData.idNumber,
        'GHANA_CARD',
        selfieUrl,
        photoUrl
      )

      if (!result.flagged) {
        toast.success(`Biometric Verification Success (${result.confidence * 100}%)`)
        setFormStep(4)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(`Verification Flagged: ${result.matches.join(', ')}`)
      }
    } catch {
      toast.error('KYC Protocol failure. Please retry or contact support.')
    } finally {
      setIsVerifyingKyc(false)
    }
  }

  const handleFormScan = async (file: File) => {
    setIsScanningForm(true)
    try {
      const { platform: detectedPlatform, fields } = await scanFormFile(file)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 3) {
      setFormStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (formStep === 3) {
      await runKycProtocol()
    } else {
      await submitRegistration({
        platform,
        formData,
        photoUrl,
        selfieUrl,
        croppedAreaPixels,
        usedScan,
        refParam,
      })
    }
  }

  if (submitted) {
    return (
      <main className="bg-container-low min-h-screen py-12 px-4 flex items-center justify-center">
        <SuccessStep
          formData={formData}
          photoUrl={photoUrl}
          selfieUrl={selfieUrl}
          regNumber={regNumber}
          onEdit={() => setSubmitted(false)}
        />
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
        <ChoiceStep
          settings={settings}
          isScanning={isScanningForm}
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
      <SEO
        title="Member Registration"
        description="Join The Base Movement. Create your account and help build a better Ghana."
        canonical="/register"
      />

      <div className="max-w-[480px] w-full">
        <div className="mb-8 flex justify-between items-center px-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
            <h1 className="text-lg font-medium tracking-tight text-on-surface">The Base</h1>
          </Link>
          <button
            onClick={() => setStep('choice')}
            className="text-xs font-medium gap-2 flex items-center bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              arrow_back
            </span>{' '}
            Back
          </button>
        </div>

        <RegistrationForm
          platform={platform}
          formStep={formStep}
          formData={formData}
          isLoading={isLoading || isVerifyingKyc}
          isScanningId={isScanningId}
          showPassword={showPassword}
          agreed={agreed}
          photoUrl={photoUrl}
          selfieUrl={selfieUrl}
          crop={crop}
          zoom={zoom}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onClearPhoto={() => setPhotoUrl(null)}
          onSelfieCapture={handleSelfieCapture}
          dbCountries={dbCountries}
          dbRegions={dbRegions}
          dbConstituencies={dbConstituencies}
          dbChapters={dbChapters}
          onPlatformChange={handlePlatformChange}
          onIdScan={handleIdScan}
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
