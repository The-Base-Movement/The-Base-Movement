/**
 * polls/EngagementBanner.tsx
 * ─────────────────────────────────────────────────────────────────
 * Bottom section of the Polls page with two side-by-side panels:
 *
 * 1. "Maximize engagement" — Dark promotional panel with a CTA
 *    to open the Analytics Guide modal.
 *
 * 2. "Recent feedback highlights" — A quote card from a member with
 *    a CTA to open the Feedback Vault modal.
 *
 * Props:
 *  onOpenAnalytics — Opens the AnalyticsGuideModal
 *  onOpenFeedback  — Opens the FeedbackVaultModal
 */

interface EngagementBannerProps {
  onOpenAnalytics: () => void
  onOpenFeedback: () => void
}

export function EngagementBanner({ onOpenAnalytics, onOpenFeedback }: EngagementBannerProps) {
  return (
    <div className="settings-form-grid" style={{ alignItems: 'stretch' }}>
      {/* Dark "Maximize engagement" promotional panel */}
      <div
        style={{
          background: 'hsl(var(--on-surface))',
          borderRadius: 6,
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <h4
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 15,
            color: '#fff',
            margin: 0,
          }}
        >
          Maximize engagement
        </h4>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Use regional-specific polls to gather more precise data. Our research shows chapters with
          localized campaigns see 40% higher member participation.
        </p>
        {/* CTA to open Analytics Guide modal */}
        <button
          className="btn btn-sm"
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff',
          }}
          onClick={onOpenAnalytics}
        >
          Scan Analytics Guide
        </button>
        {/* Decorative background icon */}
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            bottom: -10,
            right: -10,
            fontSize: 110,
            color: 'rgba(255,255,255,0.04)',
            transform: 'rotate(12deg)',
            pointerEvents: 'none',
          }}
        >
          bar_chart
        </span>
      </div>

      {/* Recent feedback highlights panel */}
      <div className="panel">
        <div className="ph">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13.5,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}
            >
              forum
            </span>
            Recent feedback highlights
          </span>
        </div>
        <div
          style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Sample quote — TODO: replace with live feedback from DB */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
              >
                forum
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: 'hsl(var(--on-surface))',
                lineHeight: 1.7,
                fontStyle: 'italic',
                margin: 0,
              }}
            >
              "The new regional chapter meetings have significantly improved communication between
              constituency leads…"
            </p>
          </div>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            — Member feedback from Ashanti Region
          </p>
          {/* CTA to open Feedback Vault modal */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 12,
              color: 'hsl(var(--accent))',
              padding: 0,
            }}
            onClick={onOpenFeedback}
          >
            Scan Feedback Vault
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
