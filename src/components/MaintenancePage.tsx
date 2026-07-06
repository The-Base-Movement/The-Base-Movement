/**
 * MaintenancePage Component
 * -------------------------------------------------------------
 * Full-viewport maintenance splash page rendered by `MaintenanceGate` when the
 * site setting `maintenance_mode` is truthy.
 *
 * Accepts optional `title` and `message` overrides from the branding settings,
 * otherwise falls back to the hardcoded defaults. Renders the brand globe,
 * a heading, a message paragraph, and an animated DotLoader.
 *
 * Staff routes are never gated, so maintenance mode can always be switched
 * back off.
 */

import { DotLoader } from '@/components/states/Spinner'

interface MaintenancePageProps {
  title?: string
  message?: string
}

const DEFAULT_TITLE = 'Back shortly.'
const DEFAULT_MESSAGE =
  'We are carrying out scheduled maintenance. This usually takes less than 15 minutes. Thank you for your patience, patriot.'

/**
 * Full-screen maintenance splash shown to the public site while IT has
 * maintenance mode enabled. Staff routes stay reachable so it can be switched
 * back off.
 */
export function MaintenancePage({ title, message }: MaintenancePageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(var(--background))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'clamp(32px, 6vw, 64px) 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 440 }}>
        {/* Brand globe */}
        <img
          src="/branding/other/globe.png"
          alt="The Base Movement"
          style={{
            display: 'block',
            height: 'clamp(96px, 18vw, 132px)',
            width: 'auto',
            margin: '0 auto 28px',
            objectFit: 'contain',
          }}
        />

        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'hsl(var(--on-surface-muted))',
            display: 'block',
            marginBottom: 14,
          }}
        >
          Scheduled maintenance
        </span>

        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {title || DEFAULT_TITLE}
        </h1>

        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 15,
            color: 'hsl(var(--on-surface-muted))',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          {message || DEFAULT_MESSAGE}
        </p>

        <DotLoader />
      </div>
    </div>
  )
}
