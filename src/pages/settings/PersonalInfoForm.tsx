import { labelStyle, inputStyle, selectStyle } from './shared'
import { SelIcon } from './SelIcon'

interface FormState {
  fullName: string
  email: string
  phone: string
  countryCode: string
  region: string
  constituency: string
  profession: string
  bio: string
  gender: string
  joinedDate: string
  status: string
  chapter: string
  country: string
  city: string
  residentialAddress: string
}

interface Props {
  form: FormState
  userRegNo: string
  userPlatform: string
  dbCountries: { name: string; dialing_code: string; is_diaspora: boolean }[]
  availableChapters: string[]
  onChange: (field: string, value: string) => void
  onFormSet: (updater: (prev: FormState) => FormState) => void
}

export function PersonalInfoForm({
  form,
  userRegNo,
  userPlatform,
  dbCountries,
  availableChapters,
  onChange,
  onFormSet,
}: Props) {
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
                <option value="Male / 18 - 25">Male / 18 - 25</option>
                <option value="Male / 26 - 40">Male / 26 - 40</option>
                <option value="Male / 41+">Male / 41+</option>
                <option value="Female / 18 - 25">Female / 18 - 25</option>
                <option value="Female / 26 - 40">Female / 26 - 40</option>
                <option value="Female / 41+">Female / 41+</option>
              </select>
              <SelIcon />
            </div>
          </div>

          {/* Profession */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-281364" style={labelStyle}>
              Profession
            </label>
            <input
              name="name-281364"
              id="input-281364"
              value={form.profession}
              onChange={(e) => onChange('profession', e.target.value)}
              placeholder="E.g. Teacher, Engineer, Student"
              style={inputStyle}
            />
          </div>

          {/* Chapter — Diaspora only; Ghana Network is organised by constituency */}
          {userPlatform !== 'GHANA' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="select-d8a77b" style={labelStyle}>
                Assigned chapter
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="name-d8a77b"
                  id="select-d8a77b"
                  value={form.chapter}
                  onChange={(e) => onChange('chapter', e.target.value)}
                  style={selectStyle}
                >
                  <option value="">Select Chapter</option>
                  {availableChapters.map((name) => (
                    <option key={name} value={name}>
                      {name}
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

          {/* Residential address — full width */}
          <div className="profile-form-full" style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="input-048091" style={labelStyle}>
              Residential Address{' '}
              {userPlatform === 'GHANA' && (
                <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              )}
            </label>
            <input
              name="name-048091"
              id="input-048091"
              required={userPlatform === 'GHANA'}
              value={form.residentialAddress}
              onChange={(e) => onChange('residentialAddress', e.target.value)}
              placeholder="Physical address for mobilization and logistics"
              style={inputStyle}
            />
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
