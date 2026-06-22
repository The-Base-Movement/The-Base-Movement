/**
 * FullPageState Component
 * -------------------------------------------------------------
 * Renders full-page semantic views for system exceptions and status alerts.
 * Supports:
 * - '404': Page not found view with dynamic watermarks and home navigation
 * - '403': Forbidden view with high-security dark theme styling prompting identity/biometrics verification
 * - 'maintenance': Portal-wide offline update views displaying active dot load indicators
 */

import { useNavigate } from 'react-router-dom'
import { DotLoader } from './Spinner'

type PageStateVariant = '404' | '403' | 'maintenance'

interface FullPageStateProps {
  variant: PageStateVariant
  title?: string
  body?: string
  primaryLabel?: string
  onPrimary?: () => void
}

const DEFAULTS: Record<
  PageStateVariant,
  {
    watermark: string
    eyebrow: string
    title: string
    body: string
    primaryLabel: string
    dark: boolean
  }
> = {
  '404': {
    watermark: '404',
    eyebrow: 'Page not found',
    title: "This page doesn't exist.",
    body: 'The URL may have changed, or this branch page has moved. Try going back to the dashboard.',
    primaryLabel: 'Go to dashboard',
    dark: false,
  },
  '403': {
    watermark: '403',
    eyebrow: 'Access restricted',
    title: 'You need to be a verified member.',
    body: 'This page is only available to verified citizens. Complete your Ghana Card verification to continue.',
    primaryLabel: 'Verify my ID',
    dark: true,
  },
  maintenance: {
    watermark: '⚙',
    eyebrow: 'Scheduled maintenance',
    title: 'Back shortly.',
    body: 'We are updating the member portal. This usually takes less than 15 minutes. Thank you for your patience, patriot.',
    primaryLabel: '',
    dark: false,
  },
}

export function FullPageState({
  variant,
  title,
  body,
  primaryLabel,
  onPrimary,
}: FullPageStateProps) {
  const navigate = useNavigate()
  const d = DEFAULTS[variant]
  const isDark = d.dark

  const t = title ?? d.title
  const b = body ?? d.body
  const btnLabel = primaryLabel ?? d.primaryLabel
  const handlePrimary = onPrimary ?? (() => navigate('/dashboard'))

  return (
    <div
      style={{
        background: isDark ? 'hsl(var(--on-surface))' : 'hsl(var(--background))',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'hsl(var(--border))'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(40px, 6vw, 56px) clamp(24px, 4vw, 40px)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: variant === 'maintenance' ? 140 : 220,
          color: isDark ? 'rgba(255,255,255,0.04)' : 'var(--container-low)',
          letterSpacing: '-0.05em',
          lineHeight: 1,
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {d.watermark}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isDark ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
            display: 'block',
            marginBottom: 14,
          }}
        >
          {d.eyebrow}
        </span>

        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
            color: isDark ? '#fff' : 'hsl(var(--on-surface))',
          }}
        >
          {t}
        </h2>

        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 14,
            color: isDark ? 'rgba(255,255,255,0.6)' : 'hsl(var(--on-surface-muted))',
            maxWidth: 360,
            margin: '0 auto 24px',
            lineHeight: 1.55,
          }}
        >
          {b}
        </p>

        {variant === 'maintenance' ? (
          <DotLoader />
        ) : (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              onClick={handlePrimary}
              className={variant === '403' ? 'btn btn-accent' : 'btn btn-primary'}
            >
              {btnLabel} →
            </button>
            {variant === '403' && (
              <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Go back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
