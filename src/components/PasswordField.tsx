import { useState } from 'react'
import type { MatchTone } from './passwordMatch'
import { evaluatePassword } from './passwordCriteria'

/**
 * Password input with a show/hide eye toggle and an optional match tone that
 * colours the border green (match) or red (mismatch). Used across the
 * reset / change-password forms so they behave identically.
 */

const toneBorder: Record<MatchTone, string> = {
  neutral: 'hsl(var(--border))',
  match: 'hsl(var(--primary))',
  mismatch: 'hsl(var(--destructive))',
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = 'new-password',
  tone = 'neutral',
  labelStyle,
  inputStyle,
}: {
  id: string
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  tone?: MatchTone
  labelStyle?: React.CSSProperties
  inputStyle?: React.CSSProperties
}) {
  const [show, setShow] = useState(false)

  return (
    <div>
      {label && (
        <label htmlFor={id} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{ ...inputStyle, paddingRight: 44, borderColor: toneBorder[tone] }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            padding: 0,
            display: 'flex',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  )
}

/**
 * Same requirements checklist shown on the registration form, extracted so
 * the reset / change-password forms enforce and display the identical
 * policy Supabase Auth actually checks server-side.
 */
export function PasswordRequirementsChecklist({ password }: { password: string }) {
  const { hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol } =
    evaluatePassword(password)
  const criteriaMetCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(
    Boolean
  ).length

  const items: { met: boolean; label: string; wide?: boolean }[] = [
    { met: hasMinLength, label: 'At least 8 characters' },
    { met: hasUppercase, label: 'One uppercase letter (A-Z)' },
    { met: hasLowercase, label: 'One lowercase letter (a-z)' },
    { met: hasNumber, label: 'One number (0-9)' },
    { met: hasSymbol, label: 'One special symbol (!@#$%^&*)', wide: true },
  ]

  const barThresholds = [1, 2, 4, 5]
  const barColors = [
    'hsl(var(--destructive))',
    'hsl(var(--accent))',
    'hsl(var(--primary))',
    'hsl(var(--primary))',
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {barThresholds.map((threshold, i) => (
          <div
            key={threshold}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 999,
              background: criteriaMetCount >= threshold ? barColors[i] : 'hsl(var(--border))',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 10.5,
          fontWeight: 'var(--font-weight-medium, 500)',
          color:
            criteriaMetCount === 5
              ? 'hsl(var(--primary))'
              : criteriaMetCount >= 3
                ? 'hsl(var(--accent))'
                : 'hsl(var(--on-surface-muted))',
        }}
      >
        {criteriaMetCount === 5
          ? 'Strong password — excellent security for your account'
          : criteriaMetCount >= 3
            ? `Moderate password strength (${criteriaMetCount}/5 requirements met)`
            : `Password requirements (${criteriaMetCount}/5 met):`}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
          marginTop: 8,
          padding: 10,
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--container-low))',
          border: '1px solid hsl(var(--border))',
          fontSize: 11,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              gridColumn: item.wide ? 'span 2' : undefined,
              color: item.met ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              fontWeight: item.met ? 'var(--font-weight-medium, 500)' : 'normal',
              transition: 'color 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {item.met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Inline green/red "passwords match / do not match" hint. */
export function PasswordMatchHint({ tone }: { tone: MatchTone }) {
  if (tone === 'neutral') return null
  const isMatch = tone === 'match'
  return (
    <p
      style={{
        margin: 0,
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: isMatch ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
        {isMatch ? 'check_circle' : 'error'}
      </span>
      {isMatch ? 'Passwords match' : 'Passwords do not match'}
    </p>
  )
}
