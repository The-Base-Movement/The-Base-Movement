/**
 * AnalyticsConsentBanner
 * ----------------------------------------------------------
 * Lightweight cookie-consent gate aligned with Ghana's Data
 * Protection Act 843 and the EU ePrivacy Directive.
 *
 * Shows a banner on first visit. Stores the decision in
 * localStorage under the key 'analytics_consent'.
 * - 'granted' → Analytics component loads Umami
 * - 'denied'  → Umami is never injected
 * - absent    → banner is shown
 *
 * Usage: render <AnalyticsConsentBanner /> once at app root.
 * The Analytics component reads the same key before loading.
 */

import React, { useState } from 'react'

const CONSENT_KEY = 'analytics_consent'

export function AnalyticsConsentBanner() {
  // Lazy initialiser — reads localStorage once on mount, no useEffect needed
  const [visible, setVisible] = useState(() => !localStorage.getItem(CONSENT_KEY))

  if (!visible) return null

  function grant() {
    localStorage.setItem(CONSENT_KEY, 'granted')
    setVisible(false)
    // Dispatch custom event so Analytics component can load Umami immediately
    window.dispatchEvent(new Event('analytics-consent-granted'))
  }

  function deny() {
    localStorage.setItem(CONSENT_KEY, 'denied')
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie and analytics consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'hsl(var(--card))',
        borderTop: '1px solid hsl(var(--border))',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        fontFamily: "'Public Sans', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.5,
          }}
        >
          We use anonymous analytics (Umami) to understand how members use this site — no personal
          data is collected. You can opt out at any time.{' '}
          <a href="/privacy" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>
            Privacy policy
          </a>
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={deny}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Decline
        </button>
        <button
          onClick={grant}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: 'hsl(var(--primary))',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Accept analytics
        </button>
      </div>
    </div>
  )
}
