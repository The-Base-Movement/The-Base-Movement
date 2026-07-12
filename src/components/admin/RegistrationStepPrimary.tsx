import type { Dispatch, SetStateAction } from 'react'
import type { RegistrationChangeHandler, RegistrationFormData } from './RegistrationForm.types'

interface RegistrationStepPrimaryProps {
  formData: RegistrationFormData
  platform: string
  showPassword: boolean
  isMobile: boolean
  dbCountries: string[]
  dbCountryCodes: Record<string, string>
  handleChange: RegistrationChangeHandler
  handlePlatformChange: (platform: string) => void
  setShowPassword: Dispatch<SetStateAction<boolean>>
}

export function RegistrationStepPrimary(props: RegistrationStepPrimaryProps) {
  const {
    formData,
    platform,
    showPassword,
    isMobile,
    dbCountries,
    dbCountryCodes,
    handleChange,
    handlePlatformChange,
    setShowPassword,
  } = props

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
          Step 1: Primary details
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'hsl(var(--on-surface-muted))',
            marginTop: '4px',
            fontWeight: 'var(--font-weight-normal, 400)',
          }}
        >
          Basic information required for the membership profile.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="input-efc762"
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Full name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>
        <input
          aria-label="As it appears on official ID"
          name="name-efc762"
          id="input-efc762"
          placeholder="As it appears on official ID"
          required
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
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
          Select platform <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          {['GHANA', 'DIASPORA'].map((p) => (
            <label
              key={p}
              style={{
                cursor: 'pointer',
                border: '1px solid hsl(var(--border))',
                padding: '16px',
                textAlign: 'center',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: platform === p ? 'hsla(var(--primary), 0.05)' : 'transparent',
                borderColor: platform === p ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                color: platform === p ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                id="input-76964c"
                type="radio"
                name="platform"
                value={p}
                checked={platform === p}
                onChange={() => handlePlatformChange(p)}
                style={{ display: 'none' }}
              />
              Base {p === 'GHANA' ? 'Ghana' : 'Diaspora'}
            </label>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '20px' : '24px',
        }}
      >
        {platform === 'DIASPORA' && (
          <div className="space-y-2">
            <label
              htmlFor="select-ea007f"
              style={{
                fontSize: '10px',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Country of residence <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <select
              name="name-ea007f"
              id="select-ea007f"
              required
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
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
              <option value="">Select Country</option>
              {dbCountries.length > 0 ? (
                dbCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Loading countries…
                </option>
              )}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="input-109f3c"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Contact number <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', overflow: 'hidden' }}>
            <select
              name="name-9533b6"
              id="select-9533b6"
              value={formData.countryCode}
              onChange={(e) => handleChange('countryCode', e.target.value)}
              className="reg"
              style={{
                width: '80px',
                flexShrink: 0,
                padding: '14px 8px',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium, 500)',
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {Array.from(new Set(Object.values(dbCountryCodes)))
                .sort()
                .map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
            </select>
            <input
              aria-label="Phone number"
              name="name-109f3c"
              id="input-109f3c"
              type="tel"
              placeholder="Phone number"
              required
              value={formData.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
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
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="input-ec50d2"
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Account password <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            aria-label="Minimum 6 characters"
            name="name-ec50d2"
            id="input-ec50d2"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 6 characters"
            required
            minLength={6}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>

      {platform === 'GHANA' && (
        <div className="space-y-2">
          <label
            htmlFor="input-ghana-card-admin"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Ghana Card Number <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <input
            aria-label="Ghana Card Number"
            name="name-ghana-card-admin"
            id="input-ghana-card-admin"
            placeholder="GHA-XXXXXXXXX-X"
            required
            value={formData.ghanaCardNumber}
            onChange={(e) => handleChange('ghanaCardNumber', e.target.value)}
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
          <p
            style={{
              fontSize: '11px',
              color: 'hsl(var(--on-surface-muted))',
              marginTop: '4px',
            }}
          >
            Enter the number exactly as it appears on the Ghana Card.
          </p>
        </div>
      )}

      {platform === 'GHANA' && (
        <div className="space-y-2">
          <label
            htmlFor="input-voters-id-admin"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Voter's ID Card Number{' '}
            <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
              (optional)
            </span>
          </label>
          <input
            aria-label="Voter's ID Card Number"
            name="name-voters-id-admin"
            id="input-voters-id-admin"
            placeholder="10-digit Voter ID Number"
            value={formData.votersIdCard || ''}
            onChange={(e) => handleChange('votersIdCard', e.target.value)}
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
          <p
            style={{
              fontSize: '11px',
              color: 'hsl(var(--on-surface-muted))',
              marginTop: '4px',
            }}
          >
            Enter your 10-digit Voter's ID Card number.
          </p>
        </div>
      )}
    </div>
  )
}
