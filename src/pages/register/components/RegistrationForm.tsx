import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { Area } from 'react-easy-crop'
import type { RegistrationFormData, Region, Constituency } from '@/types/registration'
import {
  getConstituenciesByRegion,
  getDistrictForConstituency,
  lookupPollingStationByCode,
  searchPollingStations,
  type PollingStationOption,
} from '@/lib/pollingCascade'
import { PhotoCropStep } from './PhotoCropStep'
import { JobSelector } from '@/components/JobSelector'
import { emptyJobSelection } from '@/services/jobTaxonomyService'
import {
  emergencyRelationships,
  educationLevels,
  religions,
} from '@/components/admin/RegistrationForm.constants'
import { EmailSuggestion } from '@/components/EmailSuggestion'
import { TrustSignals, SIGNUP_TRUST } from '@/components/ui/TrustSignals'
import { checkEmailTaken, checkPhoneTaken } from '@/services/registrationService'

type DuplicateStatus = 'idle' | 'checking' | 'taken'

function DuplicateWarning({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
        error
      </span>
      An account with this {label} already exists.{' '}
      <Link to="/login" className="underline">
        Sign in instead →
      </Link>
    </p>
  )
}

interface RegistrationFormProps {
  platform: string
  formStep: number
  formData: RegistrationFormData
  formErrors?: Record<string, string>
  isLoading: boolean
  cooldown: number
  showPassword: boolean
  agreed: boolean
  dbCountries: string[]
  dbRegions: Region[]
  dbConstituencies: Constituency[]
  dbChapters: string[]
  photoUrl: string | null
  onPhotoChange: (url: string | null) => void
  onCropComplete: (area: Area | null) => void
  onPlatformChange: (p: string) => void
  onInputChange: <K extends keyof RegistrationFormData>(
    field: K,
    value: RegistrationFormData[K]
  ) => void
  onPasswordToggle: () => void
  onAgreedChange: (val: boolean) => void
  onBack: () => void
  onSubmit: (e: React.FormEvent) => void
}

// Display-only bucket; the DB derives the stored age_range from birth_year.
function ageBucket(birthYear: string): string {
  const y = parseInt(birthYear, 10)
  if (!y) return ''
  const age = new Date().getFullYear() - y
  if (age <= 17) return '14-17'
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 60) return '46-60'
  return '60+'
}

export function RegistrationForm(props: RegistrationFormProps) {
  const {
    platform,
    formStep,
    formData,
    formErrors = {},
    isLoading,
    cooldown,
    showPassword,
    agreed,
    dbCountries,
    dbRegions,
    dbChapters,
    photoUrl,
    onPhotoChange,
    onCropComplete,
    onPlatformChange,
    onInputChange,
    onPasswordToggle,
    onAgreedChange,
    onBack,
    onSubmit,
  } = props
  const displayStep = formStep
  const totalSteps = 4

  const [psSearch, setPsSearch] = useState(() => formData.pollingStationCode || '')
  const [psFocused, setPsFocused] = useState(false)
  const [psResults, setPsResults] = useState<PollingStationOption[]>([])
  const [constituencies, setConstituencies] = useState<string[]>([])
  const [regionFocused, setRegionFocused] = useState(false)
  const [constituencyFocused, setConstituencyFocused] = useState(false)
  const [psCode, setPsCode] = useState(() => formData.pollingStationCode || '')
  const [codeStation, setCodeStation] = useState<string | null>(null)
  const [codeError, setCodeError] = useState(false)
  const [emailStatus, setEmailStatus] = useState<DuplicateStatus>('idle')
  const [phoneStatus, setPhoneStatus] = useState<DuplicateStatus>('idle')

  async function handleEmailBlur() {
    const email = (formData.email || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('idle')
      return
    }
    setEmailStatus('checking')
    try {
      const taken = await checkEmailTaken(email)
      setEmailStatus(taken ? 'taken' : 'idle')
    } catch {
      setEmailStatus('idle')
    }
  }

  async function handlePhoneBlur() {
    const digits = formData.contactNumber.replace(/\D/g, '')
    if (digits.length < 6) {
      setPhoneStatus('idle')
      return
    }
    setPhoneStatus('checking')
    try {
      const taken = await checkPhoneTaken(formData.countryCode, formData.contactNumber)
      setPhoneStatus(taken ? 'taken' : 'idle')
    } catch {
      setPhoneStatus('idle')
    }
  }

  const derivedBucket = formData.birthYear ? ageBucket(formData.birthYear) : ''

  useEffect(() => {
    if (!formData.pollingStationCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPsSearch('')
    }
  }, [formData.pollingStationCode])

  // Cascade (all from polling_stations): Region → Constituency → District(auto).
  useEffect(() => {
    getConstituenciesByRegion(formData.region || '')
      .then(setConstituencies)
      .catch(() => setConstituencies([]))
  }, [formData.region])

  const filteredRegions = dbRegions
    .map((region) => region.name)
    .filter(
      (name) =>
        !formData.region.trim() || name.toLowerCase().includes(formData.region.trim().toLowerCase())
    )
    .slice(0, 12)

  const filteredConstituencies = constituencies
    .filter(
      (name) =>
        !formData.constituency.trim() ||
        name.toLowerCase().includes(formData.constituency.trim().toLowerCase())
    )
    .slice(0, 12)

  // Constituency → district is 1:1; auto-fill the editable, optional District.
  useEffect(() => {
    if (!formData.constituency) return
    getDistrictForConstituency(formData.region || '', formData.constituency)
      .then((d) => {
        if (d) onInputChange('district', d)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.region, formData.constituency])

  // Polling-station CODE → reverse-fill region / district / constituency + name.
  async function handlePollingCodeLookup() {
    const c = psCode.trim()
    if (!c) {
      setCodeStation(null)
      setCodeError(false)
      return
    }
    const found = await lookupPollingStationByCode(c)
    if (found) {
      onInputChange('region', found.region)
      onInputChange('constituency', found.constituency)
      onInputChange('district', found.district)
      onInputChange('pollingStationCode', found.code)
      setPsSearch(`${found.code} — ${found.name}`)
      setCodeStation(found.name)
      setCodeError(false)
    } else {
      setCodeStation(null)
      setCodeError(true)
    }
  }

  useEffect(() => {
    if (!psSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPsResults([])
      return
    }
    if (psSearch === formData.pollingStationCode) return

    const delayDebounce = setTimeout(() => {
      searchPollingStations(
        formData.region || '',
        formData.district || '',
        formData.constituency || '',
        psSearch
      )
        .then(setPsResults)
        .catch(() => setPsResults([]))
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [
    psSearch,
    formData.region,
    formData.district,
    formData.constituency,
    formData.pollingStationCode,
  ])

  return (
    <div className="auth-frame">
      <div className="auth-header-label">
        {formStep === 1 && (
          <>
            02 · Register <span>Step 1 of {totalSteps}</span>
          </>
        )}
        {formStep === 2 && (
          <>
            02 · Register <span>Step 2 of {totalSteps}</span>
          </>
        )}
        {formStep === 3 && (
          <>
            03 · Finalize <span>Step 3 of {totalSteps}</span>
          </>
        )}
        {formStep === 4 && (
          <>
            04 · Photo{' '}
            <span>
              Step {displayStep} of {totalSteps}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-[520px]">
        {/* Header Section */}
        <div className="px-7 pt-6 pb-4">
          <h2 className="auth-heading">
            {formStep === 1 && 'Create your account'}
            {formStep === 2 && 'Tell us about you'}
            {formStep === 3 && 'Final declaration'}
            {formStep === 4 && 'Your membership photo'}
          </h2>
          <p className="text-[12px] text-on-surface-muted">
            {formStep === 1 && (
              <>
                Join the movement to build a better Ghana. Read our{' '}
                <Link
                  to="/blog/how-to-register-and-get-verified"
                  target="_blank"
                  className="text-primary font-medium hover:underline"
                >
                  Registration Guide →
                </Link>
              </>
            )}
            {formStep === 2 && 'Used to assign you to your local branch.'}
            {formStep === 3 && 'Almost there, compatriot. Confirm your details.'}
            {formStep === 4 && 'This photo appears on your official membership card.'}
          </p>
        </div>

        {/* Stepper */}
        <div className="auth-stepper">
          {Array.from({ length: totalSteps }, (_, index) => {
            const step = index + 1
            return (
              <div
                key={step}
                className={cn(
                  'step',
                  displayStep >= step ? (displayStep > step ? 'done' : 'current') : ''
                )}
              />
            )
          })}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1">
          <div className="px-7 pb-6 flex-1">
            {formStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-1.5">
                  <label
                    htmlFor="input-72ee96"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                  >
                    Full name{' '}
                    <span className="text-primary normal-case tracking-normal ml-1">
                      (Must match ID Card exactly)
                    </span>
                  </label>
                  <input
                    name="name-72ee96"
                    id="input-72ee96"
                    required
                    pattern=".*\s+.*"
                    title="Please enter both your first and last name."
                    value={formData.fullName}
                    onChange={(e) => onInputChange('fullName', e.target.value)}
                    className={cn(
                      'w-full h-[46px] bg-transparent border px-4 text-sm font-medium transition-colors outline-none',
                      formErrors.fullName
                        ? 'border-destructive focus:border-destructive'
                        : 'border-border focus:border-primary'
                    )}
                    placeholder="Kwesi Owusu"
                    autoComplete="name"
                  />
                  {formErrors.fullName && (
                    <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        error
                      </span>
                      {formErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-b6d09f"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                  >
                    Email address{' '}
                    <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    name="name-b6d09f"
                    id="input-b6d09f"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => {
                      onInputChange('email', e.target.value)
                      setEmailStatus('idle')
                    }}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                    className={cn(
                      'w-full h-[46px] bg-transparent border px-4 text-sm font-medium transition-colors outline-none',
                      formErrors.email || emailStatus === 'taken'
                        ? 'border-destructive focus:border-destructive'
                        : 'border-border focus:border-primary'
                    )}
                    placeholder="compatriot@thebase.gh"
                  />
                  {formErrors.email && (
                    <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        error
                      </span>
                      {formErrors.email}
                    </p>
                  )}
                  {emailStatus === 'checking' && (
                    <p className="text-[11px] text-on-surface-muted mt-1">Checking…</p>
                  )}
                  {emailStatus === 'taken' && <DuplicateWarning label="email" />}
                  <EmailSuggestion
                    email={formData.email || ''}
                    onAccept={(v) => onInputChange('email', v)}
                  />
                  <p className="text-[10px] text-on-surface-muted/60 mt-0.5">
                    Phone number is the primary contact. Add email if you want account updates there
                    too.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block">
                    Membership platform
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={cn(
                        'flex flex-col items-center justify-center p-4 border rounded-sm transition-all text-center',
                        platform === 'GHANA'
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-on-surface-muted hover:border-primary/50'
                      )}
                      onClick={() => onPlatformChange('GHANA')}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-sm flex items-center justify-center mb-2',
                          platform === 'GHANA'
                            ? 'bg-primary text-white'
                            : 'bg-container-low text-primary'
                        )}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          location_on
                        </span>
                      </div>
                      <b className="text-[13px] block">Base Ghana</b>
                      <span className="text-[11px]">Living in Ghana</span>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'flex flex-col items-center justify-center p-4 border rounded-sm transition-all text-center',
                        platform === 'DIASPORA'
                          ? 'border-brand-gold bg-brand-gold/5 text-brand-gold'
                          : 'border-border text-on-surface-muted hover:border-brand-gold/50'
                      )}
                      onClick={() => onPlatformChange('DIASPORA')}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-sm flex items-center justify-center mb-2',
                          platform === 'DIASPORA'
                            ? 'bg-brand-gold text-white'
                            : 'bg-container-low text-brand-gold'
                        )}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          public
                        </span>
                      </div>
                      <b className="text-[13px] block">Base Diaspora</b>
                      <span className="text-[11px]">Living abroad</span>
                    </button>
                  </div>
                </div>

                {/* National ID / Ghana Card field — hidden for now as requested; will be re-enabled later */}

                {platform === 'GHANA' && (
                  <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label
                      htmlFor="input-voters-id"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                    >
                      Voter's ID Card Number{' '}
                      <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                        (Optional)
                      </span>
                    </label>
                    <input
                      name="name-voters-id"
                      id="input-voters-id"
                      value={formData.votersIdCard || ''}
                      onChange={(e) => onInputChange('votersIdCard', e.target.value)}
                      className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                      placeholder="10-digit Voter ID Number"
                      autoComplete="off"
                    />
                    <p className="text-[10px] text-on-surface-muted/60 mt-0.5">
                      Enter your 10-digit Voter's ID Card number. This is optional and can be
                      updated later.
                    </p>
                  </div>
                )}
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {platform === 'GHANA' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 relative">
                        <label
                          htmlFor="input-region-search"
                          className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                        >
                          Region
                        </label>
                        <input
                          name="name-region-search"
                          id="input-region-search"
                          required
                          value={formData.region}
                          onChange={(e) => onInputChange('region', e.target.value)}
                          onFocus={() => setRegionFocused(true)}
                          onBlur={() => {
                            setTimeout(() => setRegionFocused(false), 200)
                          }}
                          className={cn(
                            'w-full h-[46px] bg-transparent border px-4 text-sm font-medium outline-none text-on-surface transition-colors',
                            formErrors.region
                              ? 'border-destructive focus:border-destructive'
                              : 'border-border focus:border-primary'
                          )}
                          placeholder="Search region"
                          autoComplete="off"
                        />
                        {formErrors.region && (
                          <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              error
                            </span>
                            {formErrors.region}
                          </p>
                        )}
                        {regionFocused && filteredRegions.length > 0 && (
                          <div
                            className="absolute left-0 right-0 mt-1 border border-border rounded-sm shadow-lg max-h-[180px] overflow-y-auto z-50"
                            style={{ background: 'hsl(var(--card))' }}
                          >
                            {filteredRegions.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  onInputChange('region', name)
                                  setRegionFocused(false)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-border/50 transition-colors block text-xs"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 relative">
                        <label
                          htmlFor="input-constituency-search"
                          className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                        >
                          Constituency
                        </label>
                        <input
                          name="name-constituency-search"
                          id="input-constituency-search"
                          required
                          value={formData.constituency}
                          onChange={(e) => onInputChange('constituency', e.target.value)}
                          onFocus={() => {
                            if (formData.region) setConstituencyFocused(true)
                          }}
                          onBlur={() => {
                            setTimeout(() => setConstituencyFocused(false), 200)
                          }}
                          className={cn(
                            'w-full h-[46px] bg-transparent border px-4 text-sm font-medium outline-none text-on-surface disabled:bg-container-low disabled:cursor-not-allowed transition-colors',
                            formErrors.constituency
                              ? 'border-destructive focus:border-destructive'
                              : 'border-border focus:border-primary'
                          )}
                          disabled={!formData.region}
                          placeholder={
                            formData.region ? 'Search constituency' : 'Select region first'
                          }
                          autoComplete="off"
                        />
                        {formErrors.constituency && (
                          <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              error
                            </span>
                            {formErrors.constituency}
                          </p>
                        )}
                        {constituencyFocused && filteredConstituencies.length > 0 && (
                          <div
                            className="absolute left-0 right-0 mt-1 border border-border rounded-sm shadow-lg max-h-[180px] overflow-y-auto z-50"
                            style={{ background: 'hsl(var(--card))' }}
                          >
                            {filteredConstituencies.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => {
                                  onInputChange('constituency', name)
                                  setConstituencyFocused(false)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-border/50 transition-colors block text-xs"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-district"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        District{' '}
                        <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                          (Auto-filled)
                        </span>
                      </label>
                      <input
                        id="input-district"
                        readOnly
                        value={formData.district || ''}
                        className="w-full h-[46px] bg-container-low border border-border px-4 text-sm font-medium outline-none text-on-surface-muted cursor-not-allowed"
                        placeholder="Set automatically from your constituency"
                      />
                    </div>

                    {formData.constituency && (
                      <div className="space-y-1.5 relative">
                        <label
                          htmlFor="input-polling-station"
                          className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                        >
                          Polling Station{' '}
                          <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                            (Optional)
                          </span>
                        </label>
                        <input
                          name="name-polling-station"
                          id="input-polling-station"
                          value={psSearch}
                          onChange={(e) => setPsSearch(e.target.value)}
                          onFocus={() => setPsFocused(true)}
                          onBlur={() => {
                            setTimeout(() => setPsFocused(false), 200)
                          }}
                          className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                          placeholder="Search by code or name…"
                          autoComplete="off"
                        />
                        {psFocused && psResults.length > 0 && (
                          <div
                            className="absolute left-0 right-0 mt-1 border border-border rounded-sm shadow-lg max-h-[180px] overflow-y-auto z-50"
                            style={{ background: 'hsl(var(--card))' }}
                          >
                            {psResults.map((s) => (
                              <button
                                key={s.code}
                                type="button"
                                onClick={() => {
                                  onInputChange('pollingStationCode', s.code)
                                  setPsSearch(`${s.code} — ${s.name}`)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-primary/10 border-b border-border/50 transition-colors block text-xs"
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                }}
                              >
                                <b className="text-on-surface block" style={{ display: 'block' }}>
                                  {s.code}
                                </b>
                                <span
                                  className="text-on-surface-muted text-[11px]"
                                  style={{ display: 'block' }}
                                >
                                  {s.name} · {s.constituency}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-polling-code"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                      >
                        Polling Station Code{' '}
                        <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                          (Optional)
                        </span>
                      </label>
                      <input
                        name="name-polling-code"
                        id="input-polling-code"
                        value={psCode}
                        onChange={(e) => {
                          setPsCode(e.target.value)
                          setCodeError(false)
                        }}
                        onBlur={handlePollingCodeLookup}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handlePollingCodeLookup()
                          }
                        }}
                        className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                        placeholder="Know your code? Enter it to auto-fill location"
                        autoComplete="off"
                      />
                      {codeStation && (
                        <p className="text-[10px] text-primary mt-0.5">Matched: {codeStation}</p>
                      )}
                      {codeError && (
                        <p className="text-[10px] text-destructive mt-0.5">
                          No polling station found for that code.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="select-933eb2"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        Country
                      </label>
                      <select
                        name="name-933eb2"
                        id="select-933eb2"
                        required
                        value={formData.country}
                        onChange={(e) => onInputChange('country', e.target.value)}
                        autoComplete="country-name"
                        className={cn(
                          'w-full h-[46px] bg-transparent border px-3 text-sm font-medium outline-none text-on-surface transition-colors',
                          formErrors.country
                            ? 'border-destructive focus:border-destructive'
                            : 'border-border focus:border-primary'
                        )}
                      >
                        <option value="">Select Country</option>
                        {dbCountries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {formErrors.country && (
                        <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            error
                          </span>
                          {formErrors.country}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-0bccd3"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        City
                      </label>
                      <input
                        name="name-0bccd3"
                        id="input-0bccd3"
                        required
                        value={formData.city || ''}
                        onChange={(e) => onInputChange('city', e.target.value)}
                        className={cn(
                          'w-full h-[46px] bg-transparent border px-3 text-sm font-medium transition-colors outline-none',
                          formErrors.city
                            ? 'border-destructive focus:border-destructive'
                            : 'border-border focus:border-primary'
                        )}
                        placeholder="London / New York"
                        autoComplete="address-level2"
                      />
                      {formErrors.city && (
                        <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            error
                          </span>
                          {formErrors.city}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-fbfe65"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Primary phone number{' '}
                    <span className="text-destructive normal-case tracking-normal ml-1">
                      (Required)
                    </span>
                  </label>
                  <div className="flex">
                    <div className="flex items-center justify-center h-[46px] px-3 bg-muted/10 border border-border border-r-0 text-sm font-medium text-on-surface-muted min-w-[60px]">
                      {formData.countryCode || '+233'}
                    </div>
                    <input
                      name="name-fbfe65"
                      id="input-fbfe65"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => {
                        onInputChange('contactNumber', e.target.value)
                        setPhoneStatus('idle')
                      }}
                      onBlur={handlePhoneBlur}
                      className={cn(
                        'flex-1 h-[46px] bg-transparent border px-3 text-sm font-medium transition-colors outline-none',
                        formErrors.contactNumber || phoneStatus === 'taken'
                          ? 'border-destructive focus:border-destructive'
                          : 'border-border focus:border-primary'
                      )}
                      placeholder="24 412 8890"
                      autoComplete="tel"
                    />
                  </div>
                  {formErrors.contactNumber && (
                    <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        error
                      </span>
                      {formErrors.contactNumber}
                    </p>
                  )}
                  {phoneStatus === 'checking' && (
                    <p className="text-[11px] text-on-surface-muted mt-1">Checking…</p>
                  )}
                  {phoneStatus === 'taken' && <DuplicateWarning label="phone number" />}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-secondary-phone"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Secondary phone number{' '}
                    <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="flex">
                    <input
                      name="name-secondary-code"
                      aria-label="Secondary phone country code"
                      value={formData.secondaryCountryCode || ''}
                      onChange={(e) => onInputChange('secondaryCountryCode', e.target.value)}
                      className="h-[46px] px-3 bg-muted/10 border border-border border-r-0 text-sm font-medium text-on-surface-muted min-w-[60px] w-[60px] text-center outline-none focus:border-primary"
                      placeholder="+233"
                      autoComplete="off"
                    />
                    <input
                      name="name-secondary-phone"
                      id="input-secondary-phone"
                      value={formData.secondaryPhone || ''}
                      onChange={(e) => onInputChange('secondaryPhone', e.target.value)}
                      className="flex-1 h-[46px] bg-transparent border border-border px-3 text-sm font-medium focus:border-primary transition-colors outline-none"
                      placeholder="Alternate number"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="select-3d4664"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Gender
                    </label>
                    <select
                      name="name-3d4664"
                      id="select-3d4664"
                      required
                      value={formData.gender}
                      onChange={(e) => onInputChange('gender', e.target.value)}
                      className={cn(
                        'w-full h-[46px] bg-transparent border px-3 text-sm font-medium outline-none text-on-surface transition-colors',
                        formErrors.gender
                          ? 'border-destructive focus:border-destructive'
                          : 'border-border focus:border-primary'
                      )}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {formErrors.gender && (
                      <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          error
                        </span>
                        {formErrors.gender}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="input-birth-year"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Birth Year{' '}
                      <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                        (Optional)
                      </span>
                    </label>
                    <input
                      name="name-birth-year"
                      id="input-birth-year"
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() - 14}
                      value={formData.birthYear || ''}
                      onChange={(e) => onInputChange('birthYear', e.target.value)}
                      autoComplete="bday-year"
                      className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium outline-none focus:border-primary text-on-surface"
                      placeholder="e.g. 1990"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="select-33e7c0"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Age Range
                    </label>
                    <select
                      name="name-33e7c0"
                      id="select-33e7c0"
                      required={!formData.birthYear}
                      disabled={!!formData.birthYear}
                      value={formData.birthYear ? derivedBucket : formData.ageRange}
                      onChange={(e) => onInputChange('ageRange', e.target.value)}
                      className={cn(
                        'w-full h-[46px] bg-transparent border px-3 text-sm font-medium outline-none text-on-surface disabled:bg-container-low disabled:cursor-not-allowed transition-colors',
                        formErrors.ageRange
                          ? 'border-destructive focus:border-destructive'
                          : 'border-border focus:border-primary'
                      )}
                    >
                      <option value="">Select</option>
                      <option value="14-17">14 – 17</option>
                      <option value="18-25">18 – 25</option>
                      <option value="26-35">26 – 35</option>
                      <option value="36-45">36 – 45</option>
                      <option value="46-60">46 – 60</option>
                      <option value="60+">60+</option>
                    </select>
                    {formErrors.ageRange && (
                      <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          error
                        </span>
                        {formErrors.ageRange}
                      </p>
                    )}
                    {formData.birthYear && (
                      <p className="text-[10px] text-on-surface-muted/60 mt-0.5">
                        Set automatically from your birth year.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="select-religion"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Religion{' '}
                      <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                        (Optional)
                      </span>
                    </label>
                    <select
                      name="name-religion"
                      id="select-religion"
                      value={formData.religion || ''}
                      onChange={(e) => onInputChange('religion', e.target.value)}
                      className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                    >
                      <option value="">Select</option>
                      {religions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {platform === 'DIASPORA' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="select-fdd2f4"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Chapter
                    </label>
                    <select
                      name="name-fdd2f4"
                      id="select-fdd2f4"
                      value={formData.chapter}
                      onChange={(e) => onInputChange('chapter', e.target.value)}
                      className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                    >
                      <option value="">Select Diaspora Community</option>
                      {(dbChapters || []).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-7e320f"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Set password
                  </label>
                  <div className="relative">
                    <input
                      name="name-7e320f"
                      id="input-7e320f"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => onInputChange('password', e.target.value)}
                      autoComplete="new-password"
                      className={cn(
                        'w-full h-[46px] bg-transparent border px-4 pr-11 text-sm font-medium transition-colors outline-none',
                        formErrors.password
                          ? 'border-destructive focus:border-destructive'
                          : 'border-border focus:border-primary'
                      )}
                      placeholder="•••••••••••"
                    />
                    <button
                      type="button"
                      onClick={onPasswordToggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        error
                      </span>
                      {formErrors.password}
                    </p>
                  )}
                  {/* Password Strength Calculation */}
                  {(() => {
                    const pwd = formData.password || ''
                    const hasMinLength = pwd.length >= 8
                    const hasUppercase = /[A-Z]/.test(pwd)
                    const hasLowercase = /[a-z]/.test(pwd)
                    const hasNumber = /[0-9]/.test(pwd)
                    const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
                    const criteriaMetCount = [
                      hasMinLength,
                      hasUppercase,
                      hasLowercase,
                      hasNumber,
                      hasSymbol,
                    ].filter(Boolean).length

                    return (
                      <>
                        <div className="flex gap-1 mt-1.5">
                          <div
                            className={cn(
                              'flex-1 h-[3px] rounded-full bg-border transition-colors',
                              criteriaMetCount >= 1 && 'bg-brand-red'
                            )}
                          />
                          <div
                            className={cn(
                              'flex-1 h-[3px] rounded-full bg-border transition-colors',
                              criteriaMetCount >= 2 && 'bg-brand-gold'
                            )}
                          />
                          <div
                            className={cn(
                              'flex-1 h-[3px] rounded-full bg-border transition-colors',
                              criteriaMetCount >= 4 && 'bg-brand-green'
                            )}
                          />
                          <div
                            className={cn(
                              'flex-1 h-[3px] rounded-full bg-border transition-colors',
                              criteriaMetCount === 5 && 'bg-primary'
                            )}
                          />
                        </div>

                        <div className="text-[10.5px] font-medium text-on-surface-muted mt-1">
                          {criteriaMetCount === 5 ? (
                            <span className="text-primary inline-flex items-center gap-1 font-semibold">
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                check_circle
                              </span>
                              Strong password — excellent security for your account
                            </span>
                          ) : criteriaMetCount >= 3 ? (
                            <span className="text-brand-gold">
                              Moderate password strength ({criteriaMetCount}/5 requirements met)
                            </span>
                          ) : (
                            <span>Password requirements ({criteriaMetCount}/5 met):</span>
                          )}
                        </div>

                        {/* Interactive Password Requirements Checklist */}
                        <div className="grid grid-cols-2 gap-1.5 mt-2 p-2.5 rounded-sm bg-container-low/60 border border-border/60 text-[11px]">
                          <div
                            className={cn(
                              'flex items-center gap-1.5 transition-colors',
                              hasMinLength ? 'text-primary font-medium' : 'text-on-surface-muted'
                            )}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            At least 8 characters
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 transition-colors',
                              hasUppercase ? 'text-primary font-medium' : 'text-on-surface-muted'
                            )}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {hasUppercase ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            One uppercase letter (A-Z)
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 transition-colors',
                              hasLowercase ? 'text-primary font-medium' : 'text-on-surface-muted'
                            )}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {hasLowercase ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            One lowercase letter (a-z)
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 transition-colors',
                              hasNumber ? 'text-primary font-medium' : 'text-on-surface-muted'
                            )}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            One number (0-9)
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 transition-colors col-span-2',
                              hasSymbol ? 'text-primary font-medium' : 'text-on-surface-muted'
                            )}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              {hasSymbol ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            One special symbol (!@#$%^&*)
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {formStep === 4 && (
              <PhotoCropStep
                photoUrl={photoUrl}
                onPhotoChange={onPhotoChange}
                onCropComplete={onCropComplete}
              />
            )}

            {formStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-4 animate-in fade-in duration-0">
                  {/* Job selection — scrollable list with inline Profession/Industry labels */}
                  <div className="space-y-1.5">
                    <JobSelector
                      value={formData.job ?? emptyJobSelection}
                      onChange={(j) => onInputChange('job', j)}
                      onLabelChange={(label) => onInputChange('profession', label)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="select-231c1b"
                      className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                    >
                      Education Level
                    </label>
                    <select
                      name="name-231c1b"
                      id="select-231c1b"
                      value={formData.educationLevel}
                      onChange={(e) => onInputChange('educationLevel', e.target.value)}
                      className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                    >
                      <option value="">Select</option>
                      {educationLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-f84a60"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        No. of Children
                      </label>
                      <input
                        name="name-f84a60"
                        id="input-f84a60"
                        type="number"
                        min={0}
                        value={formData.children_count === 0 ? '' : formData.children_count}
                        onChange={(e) =>
                          onInputChange('children_count', Number(e.target.value || 0))
                        }
                        className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="input-36e963"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        Digital Address <span className="opacity-50 lowercase">(Optional)</span>
                      </label>
                      <input
                        name="name-36e963"
                        id="input-36e963"
                        value={formData.digitalAddress}
                        onChange={(e) => onInputChange('digitalAddress', e.target.value)}
                        className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                        placeholder={
                          platform === 'GHANA'
                            ? 'e.g. GA-183-9020 (optional)'
                            : 'City address (optional)'
                        }
                        autoComplete="street-address"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-3">
                      Emergency Contact
                    </span>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="input-8dd936"
                            className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                          >
                            Full Name
                          </label>
                          <input
                            name="name-8dd936"
                            id="input-8dd936"
                            value={formData.emergencyContactName}
                            onChange={(e) => onInputChange('emergencyContactName', e.target.value)}
                            className={cn(
                              'w-full h-[46px] bg-transparent border px-4 text-sm font-medium transition-colors outline-none',
                              formErrors.emergencyContactName
                                ? 'border-destructive focus:border-destructive'
                                : 'border-border focus:border-primary'
                            )}
                            placeholder="Contact name"
                            autoComplete="name"
                          />
                          {formErrors.emergencyContactName && (
                            <p className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                error
                              </span>
                              {formErrors.emergencyContactName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor="select-893075"
                            className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                          >
                            Relationship
                          </label>
                          <select
                            name="name-893075"
                            id="select-893075"
                            value={formData.emergencyRelationship}
                            onChange={(e) => onInputChange('emergencyRelationship', e.target.value)}
                            className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                          >
                            <option value="">Select</option>
                            {emergencyRelationships.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="input-b705ad"
                          className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                        >
                          Phone Number
                        </label>
                        <input
                          name="name-b705ad"
                          id="input-b705ad"
                          value={formData.emergencyNumber}
                          onChange={(e) => onInputChange('emergencyNumber', e.target.value)}
                          className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                          placeholder="+233 24 000 0000"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-5 bg-[#181d19] text-white border-l-4 border-primary">
                  <input
                    name="name-4810a4"
                    id="input-4810a4"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => onAgreedChange(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-primary"
                  />
                  <label htmlFor="input-4810a4" className="text-sm font-medium leading-relaxed">
                    I solemnly declare that all information provided is true and I agree to the The
                    Base Movement privacy policy.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="px-7 py-6 border-t border-border bg-container-low">
            <div className="flex gap-2">
              {formStep > 1 && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-1/3 h-[46px] font-medium border border-border bg-white text-on-surface cursor-pointer hover:bg-container-low transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={
                  (formStep === 3 && !agreed) ||
                  (formStep === 4 && !photoUrl) ||
                  emailStatus === 'taken' ||
                  phoneStatus === 'taken' ||
                  isLoading ||
                  cooldown > 0
                }
                className={cn(
                  'flex-1 h-[46px] font-medium text-sm tracking-tight border-none cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60',
                  formStep === 4 ? 'bg-accent text-white' : 'bg-primary text-white'
                )}
              >
                {cooldown > 0 ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      timer
                    </span>{' '}
                    Wait {cooldown}s
                  </>
                ) : isLoading ? (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}
                    >
                      progress_activity
                    </span>{' '}
                    Submitting registration…
                  </>
                ) : formStep === 4 ? (
                  'Submit registration →'
                ) : formStep === 3 ? (
                  'Continue to add your photo →'
                ) : (
                  'Continue to next step →'
                )}
              </button>
            </div>

            {formStep === 1 && (
              <div className="mt-4 pt-4 border-t border-border">
                <TrustSignals items={SIGNUP_TRUST} />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
