import { cn } from '@/lib/utils'
import type { Area } from 'react-easy-crop'
import type { RegistrationFormData, Region, Constituency } from '@/types/registration'
import { PhotoCropStep } from './PhotoCropStep'
import { JobSelector } from '@/components/JobSelector'
import { emptyJobSelection } from '@/services/jobTaxonomyService'

interface RegistrationFormProps {
  platform: string
  formStep: number
  formData: RegistrationFormData
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

export function RegistrationForm(props: RegistrationFormProps) {
  const {
    platform,
    formStep,
    formData,
    isLoading,
    cooldown,
    showPassword,
    agreed,
    dbCountries,
    dbRegions,
    dbConstituencies,
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
            03 · Photo <span>Step 3 of {totalSteps}</span>
          </>
        )}
        {formStep === 4 && (
          <>
            04 · Finalize{' '}
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
            {formStep === 3 && 'Your membership photo'}
            {formStep === 4 && 'Final declaration'}
          </h2>
          <p className="text-[12px] text-on-surface-muted">
            {formStep === 1 && 'Join the movement to build a better Ghana.'}
            {formStep === 2 && 'Used to assign you to your local branch.'}
            {formStep === 3 && 'This photo appears on your official membership card.'}
            {formStep === 4 && 'Almost there, patriot. Confirm your details.'}
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
                    className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                    placeholder="Kwesi Owusu"
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-b6d09f"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block mb-1"
                  >
                    Email address{' '}
                    <span className="text-on-surface-muted/60 normal-case tracking-normal ml-1">
                      (Optional - You can register with phone number instead)
                    </span>
                  </label>
                  <input
                    name="name-b6d09f"
                    id="input-b6d09f"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => onInputChange('email', e.target.value)}
                    autoComplete="username"
                    className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                    placeholder="patriot@thebase.gh"
                  />
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
              </div>
            )}

            {formStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                {platform === 'GHANA' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="select-64ff20"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        Region
                      </label>
                      <select
                        name="name-64ff20"
                        id="select-64ff20"
                        required
                        value={formData.region}
                        onChange={(e) => onInputChange('region', e.target.value)}
                        className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                      >
                        <option value="">Select Region</option>
                        {dbRegions.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="select-c9e1d3"
                        className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                      >
                        Constituency
                      </label>
                      <select
                        name="name-c9e1d3"
                        id="select-c9e1d3"
                        required
                        value={formData.constituency}
                        onChange={(e) => onInputChange('constituency', e.target.value)}
                        className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                        disabled={!formData.region}
                      >
                        <option value="">Select Constituency</option>
                        {formData.region &&
                          dbConstituencies
                            .filter(
                              (c) =>
                                c.region_id ===
                                dbRegions.find((r) => r.name === formData.region)?.id
                            )
                            .map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>
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
                        className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                      >
                        <option value="">Select Country</option>
                        {dbCountries.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
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
                        className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium focus:border-primary transition-colors outline-none"
                        placeholder="London / New York"
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="input-fbfe65"
                    className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block"
                  >
                    Mobile Number
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
                      onChange={(e) => onInputChange('contactNumber', e.target.value)}
                      className="flex-1 h-[46px] bg-transparent border border-border px-3 text-sm font-medium focus:border-primary transition-colors outline-none"
                      placeholder="24 412 8890"
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
                      className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
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
                      required
                      value={formData.ageRange}
                      onChange={(e) => onInputChange('ageRange', e.target.value)}
                      className="w-full h-[46px] bg-transparent border border-border px-3 text-sm font-medium outline-none focus:border-primary text-on-surface"
                    >
                      <option value="">Select</option>
                      <option value="18-25">18 – 25</option>
                      <option value="26-35">26 – 35</option>
                      <option value="36-45">36 – 45</option>
                      <option value="46-60">46 – 60</option>
                      <option value="60+">60+</option>
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
                      <option value="">Select Chapter</option>
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
                      className="w-full h-[46px] bg-transparent border border-border px-4 pr-11 text-sm font-medium focus:border-primary transition-colors outline-none"
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
                  <div className="flex gap-1 mt-1.5">
                    <div
                      className={cn(
                        'flex-1 h-[3px] rounded-full bg-border',
                        (formData.password?.length || 0) > 4 && 'bg-brand-red'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'flex-1 h-[3px] rounded-full bg-border',
                        (formData.password?.length || 0) > 7 && 'bg-brand-gold'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'flex-1 h-[3px] rounded-full bg-border',
                        (formData.password?.length || 0) > 10 && 'bg-brand-green'
                      )}
                    ></div>
                    <div
                      className={cn(
                        'flex-1 h-[3px] rounded-full bg-border',
                        (formData.password?.length || 0) > 12 && 'bg-brand-green'
                      )}
                    ></div>
                  </div>
                  <div className="text-[10.5px] font-medium text-on-surface-muted mt-1">
                    {(formData.password?.length || 0) > 10 ? (
                      <>
                        Strong · <b className="text-primary">good</b> for a member account
                      </>
                    ) : (
                      'At least 8 characters recommended.'
                    )}
                  </div>
                </div>
              </div>
            )}

            {formStep === 3 && (
              <PhotoCropStep
                photoUrl={photoUrl}
                onPhotoChange={onPhotoChange}
                onCropComplete={onCropComplete}
              />
            )}

            {formStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="space-y-4 animate-in fade-in duration-0">
                  {/* Job selection — dependent Industry → Sub-Category → Job Role */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-medium text-on-surface-muted uppercase tracking-[.06em] block">
                      Profession
                    </span>
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
                      <option value="None">None</option>
                      <option value="Primary">Primary</option>
                      <option value="JHS">JHS / Middle School</option>
                      <option value="SHS">SHS / Secondary</option>
                      <option value="Diploma">Diploma / HND</option>
                      <option value="Bachelors">Bachelor's Degree</option>
                      <option value="Masters">Master's Degree</option>
                      <option value="Doctorate">Doctorate / PhD</option>
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
                        Residential Address <span className="opacity-50 lowercase">(Optional)</span>
                      </label>
                      <input
                        name="name-36e963"
                        id="input-36e963"
                        value={formData.residentialAddress}
                        onChange={(e) => onInputChange('residentialAddress', e.target.value)}
                        className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                        placeholder={
                          platform === 'GHANA'
                            ? 'House no., street, area (optional)'
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
                            className="w-full h-[46px] bg-transparent border border-border px-4 text-sm font-medium focus:border-primary transition-colors outline-none"
                            placeholder="Contact name"
                            autoComplete="name"
                          />
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
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                            <option value="Friend">Friend</option>
                            <option value="Other">Other</option>
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
          <div className="px-7 py-6 border-t border-border bg-container-low flex gap-2">
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
                (formStep === 4 && !agreed) ||
                (formStep === 3 && !photoUrl) ||
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
                  Processing...
                </>
              ) : formStep === 4 ? (
                'Submit registration →'
              ) : formStep === 3 ? (
                'Continue to final step →'
              ) : (
                'Continue to next step →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
