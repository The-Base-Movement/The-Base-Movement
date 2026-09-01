import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { youthWingService } from '@/services/youthWingService'
import { useRegistrationData } from '../register/useRegistrationData'
import { validatePhone, cleanPhoneInput } from '@/lib/phoneValidation'
import { religions } from '@/components/admin/RegistrationForm.constants'
import { ageFromDateOfBirth } from '@/lib/ageGate'
import { YW_SCOPE, YW_ACCENT, YW_ACCENT_SOFT } from './theme'

const EDUCATION_LEVELS = [
  'Junior High School',
  'Senior High School',
  'Technical / Vocational',
  'Out of school',
  'Other',
]

const RELATIONSHIPS = ['Mother', 'Father', 'Legal guardian', 'Grandparent', 'Aunt / Uncle', 'Other']

/** Youth Wing is 14-17. Anyone outside that range belongs on /register (18+) or
 * nowhere. Bounds are the exact dates that make someone 17 and 14 today, so the
 * native date picker cannot offer an ineligible day. */
const TODAY = new Date()
function shiftYears(years: number): string {
  const d = new Date(TODAY.getFullYear() - years, TODAY.getMonth(), TODAY.getDate())
  return d.toISOString().slice(0, 10)
}
const MIN_DOB = shiftYears(18) // day after this, they are still 17
const MAX_DOB = shiftYears(14) // on this day they turn 14

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  boxSizing: 'border-box',
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-xs)',
  padding: '0 14px',
  fontSize: 14,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
}

interface YouthForm {
  fullName: string
  dateOfBirth: string
  gender: string
  residence: 'GHANA' | 'ABROAD'
  region: string
  country: string
  religion: string
  schoolName: string
  educationLevel: string
  guardianName: string
  guardianRelationship: string
  guardianPhone: string
  consent: boolean
}

const EMPTY: YouthForm = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  residence: 'GHANA',
  region: '',
  country: '',
  religion: '',
  schoolName: '',
  educationLevel: '',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  consent: false,
}

export default function YouthWingRegister() {
  const { dbRegions, dbCountries } = useRegistrationData()
  const [form, setForm] = useState<YouthForm>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [membershipNumber, setMembershipNumber] = useState<string | null>(null)

  const set = <K extends keyof YouthForm>(key: K, value: YouthForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const age = useMemo(() => ageFromDateOfBirth(form.dateOfBirth), [form.dateOfBirth])

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (form.fullName.trim().split(/\s+/).length < 2)
      errs.fullName = 'Please enter your full name (first and last).'
    if (!form.dateOfBirth) errs.dateOfBirth = 'Please enter your date of birth.'
    else if (age === null || age < 14 || age > 17)
      errs.dateOfBirth = 'The Youth Wing is for ages 14 to 17 only.'
    if (!form.gender) errs.gender = 'Please select your gender.'
    if (form.residence === 'GHANA' && !form.region) errs.region = 'Please select your region.'
    if (form.residence === 'ABROAD' && !form.country) errs.country = 'Please select your country.'
    if (!form.educationLevel) errs.educationLevel = 'Please select your education level.'
    if (!form.guardianName.trim())
      errs.guardianName = 'Please enter your parent or guardian full name.'
    if (!form.guardianRelationship)
      errs.guardianRelationship = 'Please select the guardian relationship.'
    const phoneErr = validatePhone(form.guardianPhone, form.residence === 'GHANA' ? '+233' : '')
    if (phoneErr) errs.guardianPhone = phoneErr
    if (!form.consent)
      errs.consent = 'A parent or guardian must give consent before you can register.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error(Object.values(errs)[0])
      return
    }
    setErrors({})
    setIsLoading(true)
    try {
      const regNo = await youthWingService.submit({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        region: form.residence === 'GHANA' ? form.region : '',
        country: form.residence === 'GHANA' ? 'Ghana' : form.country,
        religion: form.religion,
        schoolName: form.schoolName,
        educationLevel: form.educationLevel,
        guardianName: form.guardianName,
        guardianRelationship: form.guardianRelationship,
        guardianPhone: form.guardianPhone,
        consent: form.consent,
      })
      setMembershipNumber(regNo)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error((error as Error)?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const errorText = (key: string) =>
    errors[key] ? (
      <p
        style={{
          fontSize: 11,
          color: 'hsl(var(--destructive))',
          margin: '5px 0 0',
          fontWeight: 'var(--font-weight-medium, 500)',
        }}
      >
        {errors[key]}
      </p>
    ) : null

  if (membershipNumber) {
    return (
      <div className={YW_SCOPE}>
        <SEO title="Youth Wing registration received | The Base Movement" noindex />
        <div className="max-w-[720px] mx-auto px-5 py-16">
          <div className="panel" style={{ padding: '32px 30px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: YW_ACCENT }}>
              volunteer_activism
            </span>
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 26,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: '14px 0 8px',
              }}
            >
              Registration received
            </h1>
            <p
              style={{
                fontSize: 14.5,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 22px',
                lineHeight: 1.65,
              }}
            >
              Your Youth Wing membership number is below. Keep it safe. Your membership stays
              pending until our team speaks to your parent or guardian and confirms their consent.
            </p>
            <div
              style={{
                background: YW_ACCENT_SOFT,
                border: '1px solid hsla(var(--yw-accent), 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                fontSize: 24,
                fontWeight: 'var(--font-weight-medium, 500)',
                letterSpacing: '0.04em',
                color: YW_ACCENT,
              }}
            >
              {membershipNumber}
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <Link to="/youth-wing/portal" className="btn btn-outline">
                Go to the youth portal
              </Link>
              <Link to="/youth-wing" className="btn btn-ghost">
                Back to Youth Wing
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={YW_SCOPE}>
      <SEO
        title="Join the Youth Wing (14 to 17) | The Base Movement"
        description="Register for The Base Movement Youth Wing. For young Ghanaians aged 14 to 17, with parent or guardian consent. Not political party membership."
        canonical="/youth-wing/register"
      />

      <div className="max-w-[880px] mx-auto px-5 lg:px-8 py-12">
        <span
          className="pill"
          style={{
            background: 'hsla(var(--yw-accent), 0.12)',
            color: YW_ACCENT,
            border: '1px solid hsla(var(--yw-accent), 0.3)',
          }}
        >
          Youth Wing &middot; Ages 14 to 17
        </span>
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'clamp(26px, 4vw, 36px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '12px 0 0',
          }}
        >
          Youth Wing registration
        </h1>
        <BrandLine />
        <p
          style={{
            fontSize: 14.5,
            color: 'hsl(var(--on-surface-muted))',
            margin: '16px 0 0',
            lineHeight: 1.65,
            maxWidth: 620,
          }}
        >
          This is a civic and mobilization programme, not political party membership. We do not ask
          for a Ghana Card number or a Voter ID number here. If you are 18 or older,{' '}
          <Link to="/register" style={{ color: 'hsl(var(--primary))' }}>
            register with the adult networks instead
          </Link>
          .
        </p>

        <form
          onSubmit={handleSubmit}
          className="panel"
          style={{ padding: '26px 28px', marginTop: 26 }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: YW_ACCENT,
              margin: '0 0 18px',
            }}
          >
            About you
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yw-full-name" style={labelStyle}>
                Full name *
              </label>
              <input
                id="yw-full-name"
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                style={fieldStyle}
                placeholder="e.g. Ama Serwaa Mensah"
              />
              {errorText('fullName')}
            </div>

            <div>
              <label htmlFor="yw-dob" style={labelStyle}>
                Date of birth *
              </label>
              <input
                id="yw-dob"
                type="date"
                min={MIN_DOB}
                max={MAX_DOB}
                value={form.dateOfBirth}
                onChange={(e) => set('dateOfBirth', e.target.value)}
                style={fieldStyle}
              />
              {age !== null && age >= 14 && age <= 17 && !errors.dateOfBirth && (
                <p
                  style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: '5px 0 0' }}
                >
                  Age {age}. Eligible for the Youth Wing.
                </p>
              )}
              {errorText('dateOfBirth')}
            </div>

            <div>
              <label htmlFor="yw-gender" style={labelStyle}>
                Gender *
              </label>
              <select
                id="yw-gender"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                style={fieldStyle}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errorText('gender')}
            </div>

            <div>
              <label htmlFor="yw-residence" style={labelStyle}>
                Where do you live? *
              </label>
              <select
                id="yw-residence"
                value={form.residence}
                onChange={(e) => {
                  const next = e.target.value as YouthForm['residence']
                  setForm((prev) => ({ ...prev, residence: next, region: '', country: '' }))
                }}
                style={fieldStyle}
              >
                <option value="GHANA">In Ghana</option>
                <option value="ABROAD">Outside Ghana</option>
              </select>
            </div>

            {form.residence === 'GHANA' ? (
              <div>
                <label htmlFor="yw-region" style={labelStyle}>
                  Region *
                </label>
                <select
                  id="yw-region"
                  value={form.region}
                  onChange={(e) => set('region', e.target.value)}
                  style={fieldStyle}
                >
                  <option value="">Select region</option>
                  {dbRegions.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {errorText('region')}
              </div>
            ) : (
              <div>
                <label htmlFor="yw-country" style={labelStyle}>
                  Country *
                </label>
                <select
                  id="yw-country"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                  style={fieldStyle}
                >
                  <option value="">Select country</option>
                  {dbCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errorText('country')}
              </div>
            )}

            <div>
              <label htmlFor="yw-education" style={labelStyle}>
                Education level *
              </label>
              <select
                id="yw-education"
                value={form.educationLevel}
                onChange={(e) => set('educationLevel', e.target.value)}
                style={fieldStyle}
              >
                <option value="">Select</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {errorText('educationLevel')}
            </div>

            <div>
              <label htmlFor="yw-religion" style={labelStyle}>
                Religion (optional)
              </label>
              <select
                id="yw-religion"
                value={form.religion}
                onChange={(e) => set('religion', e.target.value)}
                style={fieldStyle}
              >
                <option value="">Select</option>
                {religions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="yw-school" style={labelStyle}>
                School name (optional)
              </label>
              <input
                id="yw-school"
                value={form.schoolName}
                onChange={(e) => set('schoolName', e.target.value)}
                style={fieldStyle}
                placeholder="e.g. Achimota School"
              />
            </div>
          </div>

          <h2
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: YW_ACCENT,
              margin: '30px 0 18px',
            }}
          >
            Parent or guardian consent
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="yw-guardian-name" style={labelStyle}>
                Guardian full name *
              </label>
              <input
                id="yw-guardian-name"
                value={form.guardianName}
                onChange={(e) => set('guardianName', e.target.value)}
                style={fieldStyle}
              />
              {errorText('guardianName')}
            </div>

            <div>
              <label htmlFor="yw-guardian-relationship" style={labelStyle}>
                Relationship to you *
              </label>
              <select
                id="yw-guardian-relationship"
                value={form.guardianRelationship}
                onChange={(e) => set('guardianRelationship', e.target.value)}
                style={fieldStyle}
              >
                <option value="">Select</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errorText('guardianRelationship')}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="yw-guardian-phone" style={labelStyle}>
                Guardian phone number *
              </label>
              <input
                id="yw-guardian-phone"
                inputMode="tel"
                value={form.guardianPhone}
                onChange={(e) =>
                  set(
                    'guardianPhone',
                    cleanPhoneInput(e.target.value, form.residence === 'GHANA' ? '+233' : '')
                  )
                }
                style={fieldStyle}
                placeholder={form.residence === 'GHANA' ? '024 000 0000' : '+44 7700 000000'}
              />
              <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: '5px 0 0' }}>
                We call this number to confirm consent before your membership is activated.
              </p>
              {errorText('guardianPhone')}
            </div>
          </div>

          <label
            htmlFor="yw-consent"
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              marginTop: 22,
              padding: '16px 18px',
              background: YW_ACCENT_SOFT,
              border: '1px solid hsla(var(--yw-accent), 0.35)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            <input
              id="yw-consent"
              type="checkbox"
              checked={form.consent}
              onChange={(e) => set('consent', e.target.checked)}
              style={{ marginTop: 3, boxSizing: 'border-box' }}
            />
            <span
              style={{
                fontSize: 13.5,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.6,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              I am the parent or legal guardian named above, and I consent to this young person
              joining The Base Movement Youth Wing as a civic and mobilization member. I understand
              this is not political party membership and carries no voting or leadership rights in
              the Movement.
            </span>
          </label>
          {errorText('consent')}

          <div className="flex flex-wrap gap-3 mt-7">
            <button
              type="submit"
              className="btn"
              disabled={isLoading}
              style={{
                background: YW_ACCENT,
                color: 'hsl(var(--card))',
                border: '1px solid ' + YW_ACCENT,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Submitting…' : 'Submit registration'}
            </button>
            <Link to="/youth-wing/form" className="btn btn-outline">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                download
              </span>
              Download paper form
            </Link>
            <Link to="/youth-wing" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
