import { useEffect, useState } from 'react'
import { getConstituenciesByRegion } from '@/lib/pollingCascade'
import { labelStyle, inputStyle, selectStyle } from './shared'
import { SelIcon } from './SelIcon'
import { JobSelector } from '@/components/JobSelector'
import type { JobSelection } from '@/services/jobTaxonomyService'
import { emergencyRelationships, religions } from '@/components/admin/RegistrationForm.constants'
import { EmailSuggestion } from '@/components/EmailSuggestion'
import { diasporaName } from '@/lib/diaspora'

// Age range is auto-derived from birth_year by a DB trigger; this mirrors those
// buckets for a read-only display only — never sent on save.
function deriveAgeRange(birthYear: string): string {
  const y = Number(birthYear)
  if (!y) return ''
  const age = new Date().getFullYear() - y
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 60) return '46-60'
  return '60+'
}

// A member whose constituency was never captured -- the June physical-form
// import left 2,863 of them -- can set it once, here. Everyone else keeps the
// registration lock. This mirrors trg_approve_on_constituency_set, which only
// fires when the old value was empty, so the one-time set is also what flips
// them from 'In Review' to 'Approved'.
interface FormState {
  fullName: string
  nationalId: string
  votersIdCard: string
  email: string
  phone: string
  countryCode: string
  region: string
  constituency: string
  district: string
  profession: string
  bio: string
  gender: string
  birthYear: string
  religion: string
  partyAffiliation: string
  secondaryPhone: string
  secondaryCountryCode: string
  joinedDate: string
  status: string
  chapter: string
  country: string
  city: string
  digitalAddress: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
}

interface Props {
  form: FormState
  /** True when the member had no constituency on load -- unlocks a one-time set. */
  canSetConstituency: boolean
  userRegNo: string
  userPlatform: string
  dbCountries: { name: string; dialing_code: string; is_diaspora: boolean }[]
  availableChapters: string[]
  onChange: (field: string, value: string) => void
  onFormSet: (updater: (prev: FormState) => FormState) => void
  job: JobSelection
  onJobChange: (next: JobSelection) => void
}

export function PersonalInfoForm({
  form,
  canSetConstituency,
  userRegNo,
  userPlatform,
  dbCountries,
  availableChapters,
  onChange,
  onFormSet,
  job,
  onJobChange,
}: Props) {
  const [constituencyOptions, setConstituencyOptions] = useState<string[]>([])

  useEffect(() => {
    if (!canSetConstituency) return
    getConstituenciesByRegion(form.region || '')
      .then(setConstituencyOptions)
      .catch(() => setConstituencyOptions([]))
  }, [canSetConstituency, form.region])

  return (
    <div className="panel">
      <div className="ph">
        <h3>Personal information</h3>
        <span className="meta">Official records</span>
      </div>
      <div style={{ padding: 18 }}>
        <div className="profile-form-grid">
          {/* Registration number */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={labelStyle}>
              Registration Number{' '}
              <span
                style={{
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: 0,
                  textTransform: 'none',
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                (Permanent)
              </span>
            </span>
            <div
              style={{
                ...inputStyle,
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface-muted))',
                display: 'flex',
                alignItems: 'center',
                cursor: 'not-allowed',
              }}
            >
              {userRegNo || 'Pending Allocation'}
            </div>
          </div>

          {/* Full name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-43d16b" style={labelStyle}>
              Full Name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              name="name-43d16b"
              id="input-43d16b"
              required
              value={form.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              placeholder="Full name as on official ID"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-ghana-card-profile" style={labelStyle}>
              Ghana Card Number
              {userPlatform === 'GHANA' && (
                <span style={{ color: 'hsl(var(--destructive))' }}> *</span>
              )}
            </label>
            <input
              name="name-ghana-card-profile"
              id="input-ghana-card-profile"
              value={form.nationalId}
              onChange={(e) => onChange('nationalId', e.target.value)}
              placeholder="GHA-XXXXXXXXX-X"
              style={inputStyle}
            />
          </div>

          {/* Voter's ID — Ghana Network only. Editable: members update their own record. */}
          {userPlatform === 'GHANA' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="input-voters-id-profile" style={labelStyle}>
                Voter&apos;s ID Card Number
              </label>
              <input
                name="name-voters-id-profile"
                id="input-voters-id-profile"
                value={form.votersIdCard}
                onChange={(e) => onChange('votersIdCard', e.target.value)}
                placeholder="10-digit Voter ID Number"
                style={inputStyle}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-eaefbf" style={labelStyle}>
              Email address
            </label>
            <input
              name="name-eaefbf"
              id="input-eaefbf"
              type="email"
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
            <EmailSuggestion email={form.email} onAccept={(v) => onChange('email', v)} />
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-7b1c95" style={labelStyle}>
              Phone number
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', width: 110, flexShrink: 0 }}>
                <select
                  name="name-8448b5"
                  id="select-8448b5"
                  value={form.countryCode}
                  onChange={(e) => onChange('countryCode', e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="+233">+233 (GH)</option>
                  {dbCountries.map((c) => (
                    <option key={c.name} value={c.dialing_code}>
                      {c.dialing_code} ({c.name.slice(0, 2).toUpperCase()})
                    </option>
                  ))}
                </select>
                <SelIcon />
              </div>
              <input
                name="name-7b1c95"
                id="input-7b1c95"
                type="tel"
                value={form.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                placeholder="24 123 4567"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Secondary phone — optional, mirrors primary phone */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-secondary-phone" style={labelStyle}>
              Secondary phone{' '}
              <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                (optional)
              </span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', width: 110, flexShrink: 0 }}>
                <select
                  id="select-secondary-code"
                  value={form.secondaryCountryCode}
                  onChange={(e) => onChange('secondaryCountryCode', e.target.value)}
                  style={{ ...selectStyle, width: '100%' }}
                >
                  <option value="+233">+233 (GH)</option>
                  {dbCountries.map((c) => (
                    <option key={c.name} value={c.dialing_code}>
                      {c.dialing_code} ({c.name.slice(0, 2).toUpperCase()})
                    </option>
                  ))}
                </select>
                <SelIcon />
              </div>
              <input
                id="input-secondary-phone"
                type="tel"
                value={form.secondaryPhone}
                onChange={(e) => onChange('secondaryPhone', e.target.value)}
                placeholder="24 123 4567"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Gender */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="select-2e1d40" style={labelStyle}>
              Gender & age group
            </label>
            <div style={{ position: 'relative' }}>
              <select
                name="name-2e1d40"
                id="select-2e1d40"
                value={form.gender}
                onChange={(e) => onChange('gender', e.target.value)}
                style={selectStyle}
              >
                <option value="Male / 18-25">Male / 18-25</option>
                <option value="Male / 26-35">Male / 26-35</option>
                <option value="Male / 36-45">Male / 36-45</option>
                <option value="Male / 46-60">Male / 46-60</option>
                <option value="Male / 60+">Male / 60+</option>
                <option value="Female / 18-25">Female / 18-25</option>
                <option value="Female / 26-35">Female / 26-35</option>
                <option value="Female / 36-45">Female / 36-45</option>
                <option value="Female / 46-60">Female / 46-60</option>
                <option value="Female / 60+">Female / 60+</option>
              </select>
              <SelIcon />
            </div>
          </div>

          {/* Birth year — optional; drives the read-only derived age range */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-birth-year" style={labelStyle}>
              Birth year{' '}
              <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                (optional)
              </span>
            </label>
            <input
              id="input-birth-year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={new Date().getFullYear()}
              value={form.birthYear}
              onChange={(e) => onChange('birthYear', e.target.value)}
              placeholder="e.g. 1990"
              style={inputStyle}
            />
            {form.birthYear && deriveAgeRange(form.birthYear) && (
              <span style={{ ...labelStyle, marginTop: 6, marginBottom: 0, textTransform: 'none' }}>
                Age group: {deriveAgeRange(form.birthYear)} (derived)
              </span>
            )}
          </div>

          {/* Religion — optional */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="select-religion" style={labelStyle}>
              Religion{' '}
              <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                (optional)
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="select-religion"
                value={form.religion}
                onChange={(e) => onChange('religion', e.target.value)}
                style={selectStyle}
              >
                <option value="">Select</option>
                {religions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <SelIcon />
            </div>
          </div>

          {/* Profession — dependent Industry → Sub-Category → Job Role (full width) */}
          <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Profession</label>
            <JobSelector
              value={job}
              onChange={onJobChange}
              onLabelChange={(label) => onChange('profession', label)}
            />
          </div>

          {/* Chapter — Diaspora only; Ghana Network is organised by constituency */}
          {userPlatform !== 'GHANA' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="select-d8a77b" style={labelStyle}>
                Diaspora community
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="name-d8a77b"
                  id="select-d8a77b"
                  value={form.chapter}
                  onChange={(e) => onChange('chapter', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select your diaspora community</option>
                  {availableChapters.map((name) => (
                    <option key={name} value={name}>
                      {diasporaName(name)}
                    </option>
                  ))}
                </select>
                <SelIcon />
              </div>
            </div>
          )}

          {/* Region / Country fields — conditional on platform */}
          {userPlatform === 'GHANA' ? (
            <>
              {/* Region — locked at registration, read-only */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={labelStyle}>
                  Region{' '}
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-medium, 500)',
                      letterSpacing: 0,
                      textTransform: 'none',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    (Locked)
                  </span>
                </span>
                <div
                  style={{
                    ...inputStyle,
                    background: 'hsl(var(--container-low))',
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'not-allowed',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    lock
                  </span>
                  {form.region || 'Not set'}
                </div>
              </div>

              {/* Constituency — locked once set; a member whose constituency was
                  never captured at registration may supply it once. */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="settings-constituency" style={labelStyle}>
                  Constituency{' '}
                  <span
                    style={{
                      fontWeight: 'var(--font-weight-medium, 500)',
                      letterSpacing: 0,
                      textTransform: 'none',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {canSetConstituency ? '(Set once — cannot be changed later)' : '(Locked)'}
                  </span>
                </label>
                {canSetConstituency ? (
                  <>
                    <select
                      id="settings-constituency"
                      name="constituency"
                      value={form.constituency}
                      onChange={(e) => onChange('constituency', e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">
                        {form.region ? 'Select your constituency' : 'Select your constituency'}
                      </option>
                      {constituencyOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 4,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      Your membership is verified once your constituency is set.
                    </span>
                  </>
                ) : (
                  <div
                    style={{
                      ...inputStyle,
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'not-allowed',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      lock
                    </span>
                    {form.constituency || 'Not set'}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="select-38f885" style={labelStyle}>
                  Country of residence
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="name-38f885"
                    id="select-38f885"
                    value={form.country}
                    onChange={(e) => {
                      const countryName = e.target.value
                      const countryData = dbCountries.find((c) => c.name === countryName)
                      onFormSet((prev) => ({
                        ...prev,
                        country: countryName,
                        countryCode: countryData?.dialing_code || prev.countryCode,
                        region: countryName !== 'Ghana' ? '' : prev.region,
                        constituency: countryName !== 'Ghana' ? '' : prev.constituency,
                      }))
                    }}
                    style={selectStyle}
                  >
                    <option value="">Select Country</option>
                    {dbCountries.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <SelIcon />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="input-d8d448" style={labelStyle}>
                  City / Locality
                </label>
                <input
                  name="name-d8d448"
                  id="input-d8d448"
                  value={form.city}
                  onChange={(e) => onChange('city', e.target.value)}
                  placeholder="E.g. London, New York, Hamburg"
                  style={inputStyle}
                />
              </div>

              {form.country === 'Ghana' && (
                <>
                  {/* Region — locked at registration, read-only */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={labelStyle}>
                      Region{' '}
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-medium, 500)',
                          letterSpacing: 0,
                          textTransform: 'none',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        (Locked)
                      </span>
                    </span>
                    <div
                      style={{
                        ...inputStyle,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'not-allowed',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        lock
                      </span>
                      {form.region || 'Not set'}
                    </div>
                  </div>

                  {/* Constituency — locked at registration, read-only */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={labelStyle}>
                      Constituency{' '}
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-medium, 500)',
                          letterSpacing: 0,
                          textTransform: 'none',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        (Locked)
                      </span>
                    </span>
                    <div
                      style={{
                        ...inputStyle,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'not-allowed',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        lock
                      </span>
                      {form.constituency || 'Not set'}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* District — read-only, DB-derived (member.district / constituency lookup) */}
          {(userPlatform === 'GHANA' || form.country === 'Ghana') && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={labelStyle}>
                District{' '}
                <span
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    letterSpacing: 0,
                    textTransform: 'none',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  (Locked)
                </span>
              </span>
              <div
                style={{
                  ...inputStyle,
                  background: 'hsl(var(--container-low))',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'not-allowed',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  lock
                </span>
                {form.district || 'Not set'}
              </div>
            </div>
          )}

          {/* Digital address — full width */}
          <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-048091" style={labelStyle}>
              Digital Address{' '}
              <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                (optional)
              </span>
            </label>
            <input
              name="name-048091"
              id="input-048091"
              value={form.digitalAddress}
              onChange={(e) => onChange('digitalAddress', e.target.value)}
              placeholder="e.g. GA-183-9020 (Ghana Post GPS)"
              style={inputStyle}
            />
          </div>

          {/* Emergency Contact */}
          <div
            className="profile-form-full"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 14,
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 16,
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="input-emerg-name" style={labelStyle}>
                Emergency contact name
              </label>
              <input
                id="input-emerg-name"
                value={form.emergencyName}
                onChange={(e) => onChange('emergencyName', e.target.value)}
                placeholder="Full name"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="select-emerg-rel" style={labelStyle}>
                Relationship
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="select-emerg-rel"
                  value={form.emergencyRelationship}
                  onChange={(e) => onChange('emergencyRelationship', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select</option>
                  {emergencyRelationships.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <SelIcon />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="input-emerg-phone" style={labelStyle}>
                Emergency phone
              </label>
              <input
                id="input-emerg-phone"
                type="tel"
                value={form.emergencyPhone}
                onChange={(e) => onChange('emergencyPhone', e.target.value)}
                placeholder="+233 XX XXX XXXX"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Bio — full width */}
          <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="textarea-956004" style={labelStyle}>
              Short bio
            </label>
            <textarea
              name="name-956004"
              id="textarea-956004"
              rows={4}
              value={form.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              placeholder="A brief statement about your commitment to the Ghana First movement…"
              style={{
                ...inputStyle,
                height: 'auto',
                padding: '10px 12px',
                resize: 'none',
                lineHeight: 1.55,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
