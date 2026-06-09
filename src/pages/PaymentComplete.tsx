// src/pages/PaymentComplete.tsx
import { useEffect, useState } from 'react'

export default function PaymentComplete() {
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Hubtel appends: ?Status=Success&ClientReference=xxx&Message=...
    const rawStatus = params.get('Status') ?? params.get('status') ?? ''
    const reference =
      params.get('ClientReference') ??
      params.get('clientReference') ??
      params.get('reference') ??
      ''
    const success = ['success', 'successful', 'paid', 'completed'].includes(rawStatus.toLowerCase())

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: 'hubtel_complete', success, reference },
        window.location.origin
      )
      window.close()
    } else {
      // Popup was blocked or user navigated directly — show fallback
      // Use setTimeout to defer state update out of the synchronous effect body
      setTimeout(() => setClosed(true), 0)
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Public Sans', sans-serif",
        background: 'hsl(var(--background))',
        padding: 24,
        textAlign: 'center',
        gap: 12,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 48, color: 'hsl(var(--primary))' }}
      >
        check_circle
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface))',
        }}
      >
        {closed ? 'Payment received' : 'Completing payment…'}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          color: 'hsl(var(--on-surface-muted))',
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        {closed
          ? 'You can close this window and return to The Base Movement.'
          : 'Returning you to the site…'}
      </p>
      {closed && (
        <button
          className="btn btn-primary btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => window.close()}
        >
          Close window
        </button>
      )}
    </div>
  )
}
