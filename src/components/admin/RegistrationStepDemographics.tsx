import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ageRanges } from './RegistrationForm.constants'
import type { RegistrationChangeHandler, RegistrationFormData } from './RegistrationForm.types'

interface RegistrationStepDemographicsProps {
  formData: RegistrationFormData
  platform: string
  isMobile: boolean
  dbRegions: Array<{ id: number; name: string }>
  currentConstituencies: string[]
  handleChange: RegistrationChangeHandler
}

export function RegistrationStepDemographics(props: RegistrationStepDemographicsProps) {
  const { formData, platform, isMobile, dbRegions, currentConstituencies, handleChange } = props

  const [psSearch, setPsSearch] = useState(() => formData.pollingStationCode || '')
  const [psFocused, setPsFocused] = useState(false)
  const [psResults, setPsResults] = useState<
    { code: string; name: string; constituency: string }[]
  >([])

  useEffect(() => {
    if (!formData.pollingStationCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPsSearch('')
    }
  }, [formData.pollingStationCode])

  useEffect(() => {
    if (!psSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPsResults([])
      return
    }
    if (psSearch === formData.pollingStationCode) return

    const delayDebounce = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('polling_stations')
          .select('code, name, constituency')
          .ilike('region', formData.region || '')
          .ilike('constituency', formData.constituency || '')
          .or(`code.ilike.%${psSearch}%,name.ilike.%${psSearch}%`)
          .limit(10)

        if (!error && data) {
          setPsResults(data)
        }
      } catch (err) {
        console.error('Failed to search polling stations:', err)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [psSearch, formData.region, formData.constituency, formData.pollingStationCode])

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
                {formData.region &&
                  currentConstituencies.map((con) => (
                    <option key={con} value={con}>
                      {con}
                    </option>
                  ))}
              </select>
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
