import { useState } from 'react'
import { suggestEmailDomain } from '@/lib/emailSuggestion'

interface Props {
  email: string
  onAccept: (corrected: string) => void
}

export function EmailSuggestion({ email, onAccept }: Props) {
  const suggestion = suggestEmailDomain(email)
  const [prevEmail, setPrevEmail] = useState(email)
  const [dismissed, setDismissed] = useState(false)

  if (email !== prevEmail) {
    setPrevEmail(email)
    setDismissed(false)
  }

  if (!suggestion || dismissed) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
        padding: '6px 10px',
        borderRadius: 'var(--radius-xs)',
        background: 'hsl(var(--accent) / 0.08)',
        border: '1px solid hsl(var(--accent) / 0.3)',
        fontSize: 11,
        color: 'hsl(var(--on-surface-muted))',
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
      >
        tips_and_updates
      </span>
      <span>
        Did you mean <strong style={{ color: 'hsl(var(--on-surface))' }}>{suggestion}</strong>?
      </span>
      <button
        type="button"
        style={{
          marginLeft: 'auto',
          fontSize: 11,
          fontWeight: 600,
          color: 'hsl(var(--primary))',
          textDecoration: 'underline',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        onClick={() => {
          onAccept(suggestion)
          setDismissed(true)
        }}
      >
        Yes, fix it
      </button>
      <button
        type="button"
        style={{
          fontSize: 11,
          color: 'hsl(var(--on-surface-muted))',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
    </div>
  )
}
