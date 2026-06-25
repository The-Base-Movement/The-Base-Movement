/**
 * RegistrationForm Component
 * -------------------------------------------------------------
 * A comprehensive multi-step form to register members.
 * Collects:
 * - Basic/Account details (name, phone, password)
 * - Demographic details (age range, gender, residence address)
 * - Emergency & Professional info (emergency contacts, job, education)
 * - Final Verification (cropped passport photos via react-easy-crop, declaration check)
 * Includes specific adminoverride registration workflows.
 */

import { useState, useCallback, useEffect } from 'react'
import type { Area } from 'react-easy-crop'
import { RegistrationFormProgress } from './RegistrationFormProgress'
import { RegistrationStepPrimary } from './RegistrationStepPrimary'
import { RegistrationStepDemographics } from './RegistrationStepDemographics'
import { RegistrationStepProfessional } from './RegistrationStepProfessional'
import { RegistrationStepVerification } from './RegistrationStepVerification'
import type { RegistrationFormData, RegistrationSubmission } from './RegistrationForm.types'
import { useRegistrationData } from '@/pages/register/useRegistrationData'

export type { RegistrationSubmission } from './RegistrationForm.types'

interface RegistrationFormProps {
  onClose: () => void
  onSuccess: () => void
  onSubmitData?: (data: RegistrationSubmission) => void
}

/**
 * RegistrationForm component handling state, file reads, and multi-step submissions.
 */
export default function RegistrationForm({
  onClose,
  onSuccess,
  onSubmitData,
}: RegistrationFormProps) {
  const [formStep, setFormStep] = useState<number>(1)
  const [platform, setPlatform] = useState('GHANA')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  /**
   * Callback fired by react-easy-crop when the image crop area is updated.
   */
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  /**
   * Event listener reading the uploaded file to render crop viewport.
   */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => setPhotoUrl(reader.result?.toString() || null))
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const [formData, setFormData] = useState<RegistrationFormData>({
    fullName: '',
    countryCode: '+233',
    country: 'Ghana',
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
    ghanaCardNumber: '',
  })

  const { dbCountries, dbCountryCodes, dbRegions, dbConstituencies } = useRegistrationData()

  const selectedRegion = dbRegions.find((region) => region.name === formData.region)
  const currentConstituencies = selectedRegion
    ? dbConstituencies
        .filter((constituency) => constituency.region_id === selectedRegion.id)
        .map((constituency) => constituency.name)
    : []

  /**
   * Updates platform setting (Ghana vs Diaspora) and defaults country selection.
   */
  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform)
    setFormData((prev) => {
      const newData = { ...prev }
      if (newPlatform === 'GHANA') {
        newData.country = 'Ghana'
        newData.countryCode = '+233'
      } else {
        newData.country = dbCountries[0] ?? ''
        newData.countryCode = dbCountryCodes[dbCountries[0]] || '+1'
      }
      return newData
    })
  }

  /**
   * Universal change handler updating input state and clearing constituency lists.
   */
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      if (field === 'country' && typeof value === 'string' && dbCountryCodes[value]) {
        newData.countryCode = dbCountryCodes[value]
      }

      if (field === 'region') {
        newData.constituency = ''
      }
      return newData
    })
  }

  /**
   * Navigates form steps or triggers onSubmitData callback to finalize registration.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formStep < 4) {
      setFormStep((prev) => prev + 1)
      const modalElement = document.getElementById('registration-modal-content')
      if (modalElement) modalElement.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsSubmitting(true)
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const randomNum = String(Math.floor(1000 + Math.random() * 9000))
      const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${randomNum}`

      if (onSubmitData) {
        onSubmitData({
          ...formData,
          registrationNumber: regNo,
          platform,
          photoUrl,
          croppedAreaPixels,
        })
      }

      setIsSubmitting(false)
      onSuccess()
    }
  }

  /**
   * Steps the form back.
   */
  const goBack = () => {
    setFormStep((prev) => prev - 1)
  }

  return (
    <div
      className="panel"
      style={{
        maxWidth: '1000px',
        width: '100%',
        maxHeight: isMobile ? '95vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        margin: '0 auto',
        background: 'hsl(var(--card))',
        borderRadius: isMobile ? 8 : undefined,
      }}
    >
      {/* Header */}
      <div
        className="ph"
        style={{
          padding: isMobile ? '14px 16px' : '24px 32px',
          background: 'hsl(var(--container-low))',
        }}
      >
        <div>
          <h2
            style={{
              color: 'hsl(var(--on-surface))',
              fontSize: isMobile ? '18px' : '24px',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Register new member
          </h2>
          <div
            className="meta"
            style={{
              color: 'hsl(var(--accent))',
              marginTop: '4px',
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Admin override workflow
          </div>
        </div>
        <button
          onClick={onClose}
          className="ico"
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderColor: 'transparent',
            color: 'hsl(var(--on-surface))',
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Body */}
      <div
        id="registration-modal-content"
        style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
            gap: '32px',
          }}
        >
          <RegistrationFormProgress formStep={formStep} isMobile={isMobile} />

          {/* Form Content */}
          <div className="panel" style={{ padding: isMobile ? '20px 16px' : '40px' }}>
            <form onSubmit={handleSubmit}>
              {formStep === 1 && (
                <RegistrationStepPrimary
                  formData={formData}
                  platform={platform}
                  showPassword={showPassword}
                  isMobile={isMobile}
                  dbCountries={dbCountries}
                  dbCountryCodes={dbCountryCodes}
                  handleChange={handleChange}
                  handlePlatformChange={handlePlatformChange}
                  setShowPassword={setShowPassword}
                />
              )}

              {formStep === 2 && (
                <RegistrationStepDemographics
                  formData={formData}
                  platform={platform}
                  isMobile={isMobile}
                  dbRegions={dbRegions}
                  currentConstituencies={currentConstituencies}
                  handleChange={handleChange}
                />
              )}

              {formStep === 3 && (
                <RegistrationStepProfessional
                  formData={formData}
                  isMobile={isMobile}
                  handleChange={handleChange}
                />
              )}

              {formStep === 4 && (
                <RegistrationStepVerification
                  photoUrl={photoUrl}
                  crop={crop}
                  zoom={zoom}
                  agreed={agreed}
                  isMobile={isMobile}
                  handlePhotoUpload={handlePhotoUpload}
                  onCropComplete={onCropComplete}
                  setCrop={setCrop}
                  setZoom={setZoom}
                  setAgreed={setAgreed}
                  setPhotoUrl={setPhotoUrl}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '40px',
                  paddingTop: '32px',
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                {formStep > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn btn-outline"
                    style={{ flex: 1, height: '54px' }}
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                  </button>
                )}

                <button
                  type="submit"
                  disabled={(formStep === 4 && !agreed) || isSubmitting}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    height: '54px',
                    opacity: (formStep === 4 && !agreed) || isSubmitting ? 0.5 : 1,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        className="material-symbols-outlined animate-spin"
                        style={{ fontSize: '20px' }}
                      >
                        refresh
                      </span>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      {formStep < 4 ? 'Next step' : 'Submit registration'}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
