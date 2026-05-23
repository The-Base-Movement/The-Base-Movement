/**
 * polls/AnalyticsGuideModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Portal modal showing tips on how to interpret engagement analytics.
 * Triggered from the "Scan Analytics Guide" CTA on the EngagementBanner.
 *
 * Content: static guide text + 3 actionable bullet points.
 *
 * Props:
 *  onClose — Closes the modal
 */

import { createPortal } from 'react-dom'
import { modalBackdrop, modalBox, modalCloseBtn } from './styles'

interface AnalyticsGuideModalProps {
  onClose: () => void
}

const GUIDE_TIPS = [
  'Analyze regional participation rates to identify high-growth areas.',
  'Monitor sentiment scores to proactively address movement concerns.',
  'Use average response times to optimize survey length and timing.',
]

export function AnalyticsGuideModal({ onClose }: AnalyticsGuideModalProps) {
  return createPortal(
    <div style={modalBackdrop}>
      <div style={modalBox(480)}>
        {/* Header */}
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
              bar_chart
            </span>
            Engagement Analytics Guide
          </span>
          <button aria-label="Close analytics guide" style={modalCloseBtn} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Learn how to interpret movement engagement data to drive more effective mobilization
            campaigns.
          </p>
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 20, margin: 0 }}
          >
            {GUIDE_TIPS.map((item, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.6,
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 44 }}
            onClick={onClose}
          >
            Got It
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
