import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { type Member, type Region } from '@/services/adminService'
import { JobSelector } from '@/components/JobSelector'
import { type JobSelection } from '@/services/jobTaxonomyService'
import { ageRanges, religions } from '@/components/admin/RegistrationForm.constants'
import {
  getConstituenciesByRegion,
  getDistrictForConstituency,
  lookupPollingStationByCode,
  searchPollingStations,
  type PollingStationOption,
} from '@/lib/pollingCascade'

interface EditModalProps {
  isOpen: boolean
  member: Member | null
  form: Partial<Member>
  onChange: (field: string, value: string) => void
  onSave: () => void
  onClose: () => void
  isSaving: boolean
  chapters?: string[]
  regions?: Region[]
  // `constituencies` prop kept for call-site compatibility; the location cascade
  // now sources constituencies from polling_stations via getConstituenciesByRegion.
  constituencies?: { name: string; region_id: number }[]
  jobSelection: JobSelection
  onJobChange: (next: JobSelection) => void
  onJobLabelChange: (label: string) => void
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-normal, 400)',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 5,
}

const controlStyle: CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-normal, 400)',
  fontSize: 13,
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
  boxSizing: 'border-box',
}

const readOnlyStyle: CSSProperties = {
  ...controlStyle,
  display: 'flex',
  alignItems: 'center',
  background: 'hsl(var(--container-low))',
}

const sectionHeadingStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
}

// ponytail: display-only bucket; DB trigger is the source of truth on save.
// Buckets per contract: <=25→18-25, <=35→26-35, <=45→36-45, <=60→46-60, else 60+.
function ageBucket(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 60) return '46-60'
  return '60+'
}

export function EditModal({
  isOpen,
  member,
  form,
  onChange,
  onSave,
  onClose,
  isSaving,
  chapters,
  regions,
  jobSelection,
  onJobChange,
  onJobLabelChange,
}: EditModalProps) {
  const [constituencyOptions, setConstituencyOptions] = useState<string[]>([])
  const [pollingSearch, setPollingSearch] = useState('')
  const [pollingResults, setPollingResults] = useState<PollingStationOption[]>([])
  const [stationName, setStationName] = useState<string | null>(null)

  const isGhana = member?.platform === 'GHANA'

  // Constituency options follow the selected region (polling_stations source).
  useEffect(() => {
    if (!isOpen || !isGhana || !form.region) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConstituencyOptions([])
      return
    }
    let active = true
    getConstituenciesByRegion(form.region).then((list) => {
      if (active) setConstituencyOptions(list)
    })
    return () => {
      active = false
    }
  }, [isOpen, isGhana, form.region])

  // Debounced polling-station search, scoped to the chosen region/district/constituency.
  useEffect(() => {
    if (!pollingSearch.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPollingResults([])
      return
    }
    let active = true
    const t = setTimeout(() => {
      searchPollingStations(
        form.region ?? '',
        form.district ?? '',
        form.constituency ?? '',
        pollingSearch
      ).then((r) => {
        if (active) setPollingResults(r)
      })
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [pollingSearch, form.region, form.district, form.constituency])

  if (!isOpen || !member) return null

  const handleRegionChange = (val: string) => {
    onChange('region', val)
    onChange('constituency', '')
    onChange('district', '')
    onChange('pollingStationCode', '')
    setStationName(null)
    setPollingSearch('')
    setPollingResults([])
  }

  const handleConstituencyChange = async (val: string) => {
    onChange('constituency', val)
    onChange('district', '')
    if (val) {
      const d = await getDistrictForConstituency(form.region ?? '', val)
      if (d) onChange('district', d)
    }
  }

  const handleCodeLookup = async (code: string) => {
    if (!code.trim()) {
      setStationName(null)
      return
    }
    const ps = await lookupPollingStationByCode(code)
    if (!ps) return
    onChange('region', ps.region)
    onChange('constituency', ps.constituency)
    onChange('district', ps.district)
    onChange('pollingStationCode', ps.code)
    setStationName(ps.name)
  }

  const selectStation = async (ps: PollingStationOption) => {
    onChange('pollingStationCode', ps.code)
    setStationName(ps.name)
    if (ps.constituency && ps.constituency !== form.constituency) {
      onChange('constituency', ps.constituency)
      const d = await getDistrictForConstituency(form.region ?? '', ps.constituency)
      if (d) onChange('district', d)
    }
    setPollingSearch('')
    setPollingResults([])
  }

  const birthYearNum = Number(form.birthYear)
  const derivedAge = form.birthYear && birthYearNum > 1900 ? ageBucket(birthYearNum) : ''

  // Keep an already-stored constituency selectable even if its name diverges from
  // the polling_stations list (the two sources don't fully reconcile).
  const constituencyList =
    form.constituency && !constituencyOptions.includes(form.constituency)
      ? [form.constituency, ...constituencyOptions]
      : constituencyOptions

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.6)',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'hsl(var(--card))',
          borderRadius: 4,
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            padding: '22px 28px',
            borderTop: '4px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 4,
                background: 'rgba(255,255,255,.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
              >
                edit
              </span>
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 18,
                  color: '#fff',
                }}
              >
                Edit member info
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                {member.name}
              </p>
            </div>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {(
            [
              { key: 'name', label: 'Full name', type: 'text' },
              { key: 'email', label: 'Email address', type: 'email' },
              { key: 'phone', label: 'Phone number', type: 'text' },
              { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
              { key: 'country', label: 'Country', type: 'text' },
              { key: 'chapter', label: 'Base Diaspora', type: 'text' },
              { key: 'city', label: 'City / Town', type: 'text' },
              { key: 'residentialAddress', label: 'Residential address', type: 'text' },
            ] as const
          ).map((field) => (
            <div key={field.key}>
              <label htmlFor={`input-edit-${field.key}`} style={labelStyle}>
                {field.label}
              </label>
              {field.key === 'chapter' ? (
                <select
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  disabled={member.platform !== 'DIASPORA'}
                  style={{
                    ...controlStyle,
                    opacity: member.platform !== 'DIASPORA' ? 0.5 : 1,
                  }}
                >
                  <option value="">— select Base Diaspora —</option>
                  {(chapters ?? []).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : field.type === 'select' ? (
                <select
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={controlStyle}
                >
                  <option value="">— select —</option>
                  {field.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.key}
                  id={`input-edit-${field.key}`}
                  type={field.type}
                  value={(form[field.key as keyof typeof form] as string) ?? ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  style={controlStyle}
                />
              )}
            </div>
          ))}

          {/* Demographics — birth year drives a read-only derived age range */}
          <div
            style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <p style={sectionHeadingStyle}>Demographics</p>

            <div>
              <label htmlFor="input-edit-birthYear" style={labelStyle}>
                Birth year
              </label>
              <input
                id="input-edit-birthYear"
                name="birthYear"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 1990"
                value={(form.birthYear as number | undefined) ?? ''}
                onChange={(e) => onChange('birthYear', e.target.value)}
                style={controlStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Age range{form.birthYear ? ' (from birth year)' : ''}
              </label>
              {form.birthYear ? (
                <div style={readOnlyStyle}>{derivedAge || '—'}</div>
              ) : (
                <select
                  id="input-edit-ageRange"
                  name="ageRange"
                  value={form.ageRange ?? ''}
                  onChange={(e) => onChange('ageRange', e.target.value)}
                  style={controlStyle}
                >
                  <option value="">— select —</option>
                  {ageRanges.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="input-edit-religion" style={labelStyle}>
                Religion
              </label>
              <select
                id="input-edit-religion"
                name="religion"
                value={form.religion ?? ''}
                onChange={(e) => onChange('religion', e.target.value)}
                style={controlStyle}
              >
                <option value="">— select —</option>
                {religions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="input-edit-secondaryPhone" style={labelStyle}>
                Secondary phone
              </label>
              <input
                id="input-edit-secondaryPhone"
                name="secondaryPhone"
                type="text"
                value={form.secondaryPhone ?? ''}
                onChange={(e) => onChange('secondaryPhone', e.target.value)}
                style={controlStyle}
              />
            </div>

            <div>
              <label htmlFor="input-edit-votersIdCard" style={labelStyle}>
                Voter ID card
              </label>
              {member.votersIdCard ? (
                <div style={readOnlyStyle}>{member.votersIdCard}</div>
              ) : (
                <input
                  id="input-edit-votersIdCard"
                  name="votersIdCard"
                  type="text"
                  value={form.votersIdCard ?? ''}
                  onChange={(e) => onChange('votersIdCard', e.target.value)}
                  style={controlStyle}
                />
              )}
            </div>
          </div>

          {/* Location cascade — Ghana members only */}
          {isGhana && (
            <div
              style={{
                borderTop: '1px solid hsl(var(--border))',
                paddingTop: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <p style={sectionHeadingStyle}>Location</p>

              <div>
                <label htmlFor="input-edit-region" style={labelStyle}>
                  Region
                </label>
                <input
                  id="input-edit-region"
                  name="region"
                  list="member-edit-region-options"
                  value={form.region ?? ''}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  placeholder="Search region"
                  autoComplete="off"
                  style={controlStyle}
                />
                <datalist id="member-edit-region-options">
                  {(regions ?? []).map((r) => (
                    <option key={r.id} value={r.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="input-edit-constituency" style={labelStyle}>
                  Constituency
                </label>
                <input
                  id="input-edit-constituency"
                  name="constituency"
                  list="member-edit-constituency-options"
                  value={form.constituency ?? ''}
                  disabled={!form.region}
                  onChange={(e) => handleConstituencyChange(e.target.value)}
                  placeholder={form.region ? 'Search constituency' : 'Select region first'}
                  autoComplete="off"
                  style={{ ...controlStyle, opacity: !form.region ? 0.5 : 1 }}
                />
                <datalist id="member-edit-constituency-options">
                  {constituencyList.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label style={labelStyle}>District (auto)</label>
                <div
                  style={{
                    ...readOnlyStyle,
                    color: form.district
                      ? 'hsl(var(--on-surface))'
                      : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {form.district || '—'}
                </div>
              </div>

              <div>
                <label htmlFor="input-edit-ps-search" style={labelStyle}>
                  Polling station (search)
                </label>
                <input
                  id="input-edit-ps-search"
                  type="text"
                  placeholder="Search by name or code"
                  value={pollingSearch}
                  onChange={(e) => setPollingSearch(e.target.value)}
                  style={controlStyle}
                />
                {pollingResults.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      maxHeight: 168,
                      overflowY: 'auto',
                    }}
                  >
                    {pollingResults.map((ps) => (
                      <button
                        type="button"
                        key={ps.code}
                        onClick={() => selectStation(ps)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 12px',
                          border: 'none',
                          borderBottom: '1px solid hsl(var(--border))',
                          background: 'hsl(var(--card))',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12.5,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <span>{ps.name}</span>
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{ps.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="input-edit-ps-code" style={labelStyle}>
                  Polling station code
                </label>
                <input
                  id="input-edit-ps-code"
                  name="pollingStationCode"
                  type="text"
                  value={form.pollingStationCode ?? ''}
                  onChange={(e) => onChange('pollingStationCode', e.target.value)}
                  onBlur={(e) => handleCodeLookup(e.target.value)}
                  style={controlStyle}
                />
                {stationName && (
                  <p
                    style={{
                      margin: '5px 0 0',
                      fontSize: 11.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {stationName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Structured job selection — keeps the denormalised profession in sync */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 16 }}>
            <p style={sectionHeadingStyle}>Job selection</p>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Sets the member’s profession. Current: {form.profession || '—'}
            </p>
            <JobSelector
              idPrefix="edit-job"
              value={jobSelection}
              onChange={onJobChange}
              onLabelChange={onJobLabelChange}
            />
          </div>
        </div>
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
