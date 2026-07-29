import { useState, useEffect } from 'react'
import { ageRanges, religions } from './RegistrationForm.constants'
import type { RegistrationChangeHandler, RegistrationFormData } from './RegistrationForm.types'
import {
  getConstituenciesByRegion,
  getDistrictForConstituency,
  lookupPollingStationByCode,
  searchPollingStations,
  type PollingStationOption,
} from '@/lib/pollingCascade'

interface RegistrationStepDemographicsProps {
  formData: RegistrationFormData
  platform: string
  isMobile: boolean
  dbRegions: Array<{ id: number; name: string }>
  currentConstituencies: string[]
  handleChange: RegistrationChangeHandler
  setFields: (partial: Partial<RegistrationFormData>) => void
}

/** Age bucket derived from birth year — display hint only; DB derives the stored value on save. */
function ageBucketForBirthYear(birthYear?: string): string {
  const y = parseInt(birthYear || '', 10)
  if (!y) return ''
  const age = new Date().getFullYear() - y
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 60) return '46-60'
  return '60+'
}

export function RegistrationStepDemographics(props: RegistrationStepDemographicsProps) {
  const { formData, platform, isMobile, dbRegions, handleChange, setFields } = props

  const [psSearch, setPsSearch] = useState(() => formData.pollingStationCode || '')
  const [psFocused, setPsFocused] = useState(false)
  const [psResults, setPsResults] = useState<PollingStationOption[]>([])
  const [constituencies, setConstituencies] = useState<string[]>([])
  const [psCode, setPsCode] = useState('')
  const [psCodeName, setPsCodeName] = useState<string | null>(null)
  const [psCodeError, setPsCodeError] = useState(false)

  const derivedAgeBucket = ageBucketForBirthYear(formData.birthYear)

  useEffect(() => {
    if (!formData.pollingStationCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPsSearch('')
    }
  }, [formData.pollingStationCode])

  // Cascade order: Region → Constituency (region-scoped) → District (auto-filled).
  useEffect(() => {
    getConstituenciesByRegion(formData.region || '')
      .then(setConstituencies)
      .catch(() => setConstituencies([]))
  }, [formData.region])

  // Auto-fill the (editable, optional) district from the chosen constituency.
  useEffect(() => {
    if (!formData.constituency) return
    getDistrictForConstituency(formData.region || '', formData.constituency)
      .then((d) => {
        if (d) setFields({ district: d })
      })
      .catch(() => {})
  }, [formData.region, formData.constituency, setFields])

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
    <div className="space-y-8">
      <div
        style={{
          borderBottom: '2px solid hsl(var(--on-surface))',
          paddingBottom: '16px',
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 'var(--font-weight-medium, 500)',
            margin: 0,
          }}
        >
          Step 2: Demographic details
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'hsl(var(--on-surface-muted))',
            marginTop: '4px',
          }}
        >
          Further details to finalize the membership chapter.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '32px',
        }}
      >
        <div className="space-y-3">
          <label
            htmlFor="input-birth-year-admin"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Birth year{' '}
            <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
              (optional)
            </span>
          </label>
          <input
            aria-label="Birth year"
            name="name-birth-year-admin"
            id="input-birth-year-admin"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 1990"
            min={1900}
            max={new Date().getFullYear()}
            value={formData.birthYear || ''}
            onChange={(e) => handleChange('birthYear', e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 18px',
              fontSize: '14px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              color: 'hsl(var(--on-surface))',
            }}
          />

          <label
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Age range <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          {formData.birthYear && derivedAgeBucket ? (
            <div
              style={{
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {derivedAgeBucket}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: '2px',
                }}
              >
                Derived from birth year.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {ageRanges.map((range) => (
                <label
                  key={range}
                  style={{
                    cursor: 'pointer',
                    border: '1px solid hsl(var(--border))',
                    padding: '12px',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background:
                      formData.ageRange === range ? 'hsla(var(--primary), 0.05)' : 'transparent',
                    borderColor:
                      formData.ageRange === range ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color:
                      formData.ageRange === range
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    id="input-d93ff7"
                    type="radio"
                    name="ageRange"
                    value={range}
                    checked={formData.ageRange === range}
                    onChange={() => handleChange('ageRange', range)}
                    style={{ display: 'none' }}
                  />
                  {range}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Gender <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Male', 'Female'].map((g) => (
              <label
                key={g}
                style={{
                  cursor: 'pointer',
                  border: '1px solid hsl(var(--border))',
                  padding: '12px',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: formData.gender === g ? 'hsla(var(--primary), 0.05)' : 'transparent',
                  borderColor: formData.gender === g ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  color:
                    formData.gender === g ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  id="input-27f402"
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={() => handleChange('gender', g)}
                  style={{ display: 'none' }}
                />
                {g}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="select-religion-admin"
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Religion{' '}
          <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
            (optional)
          </span>
        </label>
        <select
          name="name-religion-admin"
          id="select-religion-admin"
          value={formData.religion || ''}
          onChange={(e) => handleChange('religion', e.target.value)}
          className="reg"
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '14px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          <option value="">Select Religion</option>
          {religions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="input-f8cc39"
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Residential address{' '}
          <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
            (optional)
          </span>
        </label>
        <input
          aria-label="Street, House Number, City"
          name="name-f8cc39"
          id="input-f8cc39"
          placeholder="Street, House Number, City (optional)"
          value={formData.residentialAddress}
          onChange={(e) => handleChange('residentialAddress', e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '14px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            color: 'hsl(var(--on-surface))',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '32px',
        }}
      >
        {platform === 'GHANA' ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor="select-0e9706"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select
                name="name-0e9706"
                id="select-0e9706"
                required
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                className="reg"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '14px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="">Select Region</option>
                {dbRegions.length > 0 ? (
                  dbRegions.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    Loading regions…
                  </option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="select-3ce1cd"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select
                name="name-3ce1cd"
                id="select-3ce1cd"
                required
                disabled={!formData.region}
                value={formData.constituency}
                onChange={(e) => handleChange('constituency', e.target.value)}
                className="reg"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '14px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  color: 'hsl(var(--on-surface))',
                  opacity: !formData.region ? 0.5 : 1,
                }}
              >
                <option value="">Select Constituency</option>
                {constituencies.map((con) => (
                  <option key={con} value={con}>
                    {con}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="input-district-admin"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                District{' '}
                <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                  (auto-filled)
                </span>
              </label>
              {/* Read-only: district is resolved from the constituency, never entered by the registrar. */}
              <input
                aria-label="District (auto-filled)"
                id="input-district-admin"
                readOnly
                tabIndex={-1}
                value={formData.district || ''}
                placeholder="Resolved from constituency"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 18px',
                  fontSize: '14px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  color: 'hsl(var(--on-surface-muted))',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            {formData.constituency && (
              <div
                className="space-y-2"
                style={{
                  gridColumn: isMobile ? undefined : 'span 2',
                  position: 'relative',
                }}
              >
                <label
                  htmlFor="input-polling-station-admin"
                  style={{
                    fontSize: '10px',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Polling Station{' '}
                  <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                    (optional)
                  </span>
                </label>
                <input
                  aria-label="Polling Station"
                  name="name-polling-station-admin"
                  id="input-polling-station-admin"
                  placeholder="Search polling station by code or name…"
                  value={psSearch}
                  onChange={(e) => setPsSearch(e.target.value)}
                  onFocus={() => setPsFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setPsFocused(false), 200)
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    fontSize: '14px',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    color: 'hsl(var(--on-surface))',
                    boxSizing: 'border-box',
                  }}
                  autoComplete="off"
                />
                {psFocused && psResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      zIndex: 50,
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {psResults.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => {
                          handleChange('pollingStationCode', s.code)
                          setPsSearch(`${s.code} — ${s.name}`)
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          width: '100%',
                          padding: '10px 14px',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          borderBottom: '1px solid hsl(var(--border))',
                          cursor: 'pointer',
                          gap: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: '12px',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {s.code}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: '11px',
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {s.name} · {s.constituency}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2" style={{ gridColumn: isMobile ? undefined : 'span 2' }}>
              <label
                htmlFor="input-ps-code-admin"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Polling Station Code{' '}
                <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
                  (optional — auto-fills location)
                </span>
              </label>
              <input
                aria-label="Polling Station Code"
                name="name-ps-code-admin"
                id="input-ps-code-admin"
                placeholder="Enter a known polling-station code"
                value={psCode}
                onChange={(e) => {
                  setPsCode(e.target.value)
                  setPsCodeError(false)
                  setPsCodeName(null)
                }}
                onBlur={() => {
                  const code = psCode.trim()
                  if (!code) return
                  lookupPollingStationByCode(code)
                    .then((found) => {
                      if (found) {
                        setFields({
                          region: found.region,
                          district: found.district,
                          constituency: found.constituency,
                          pollingStationCode: found.code,
                        })
                        setPsCodeName(found.name)
                        setPsCodeError(false)
                      } else {
                        setPsCodeName(null)
                        setPsCodeError(true)
                      }
                    })
                    .catch(() => setPsCodeError(true))
                }}
                autoComplete="off"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 18px',
                  fontSize: '14px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  color: 'hsl(var(--on-surface))',
                }}
              />
              {psCodeName && (
                <p style={{ fontSize: '11px', color: 'hsl(var(--primary))', marginTop: '4px' }}>
                  Matched: {psCodeName}
                </p>
              )}
              {psCodeError && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'hsl(var(--destructive))',
                    marginTop: '4px',
                  }}
                >
                  No polling station found for that code.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label
              htmlFor="input-4d1480"
              style={{
                fontSize: '10px',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Assigned chapter <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              aria-label="E.g. Base Diaspora — UK"
              name="name-4d1480"
              id="input-4d1480"
              placeholder="E.g. Base Diaspora — UK"
              required
              value={formData.chapter}
              onChange={(e) => handleChange('chapter', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                fontSize: '14px',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
