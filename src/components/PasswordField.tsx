import { useState } from 'react'
import type { MatchTone } from './passwordMatch'

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
