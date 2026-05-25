/**
 * polls/FeedbackVaultModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Portal modal showing a curated list of member feedback quotes.
 *
 * Currently renders 3 hardcoded sample feedback entries.
 * TODO: Replace with live data from public.member_feedback table
 *       via adminService.getFeedbackHighlights() when that endpoint is built.
 *
 * Props:
 *  onClose — Closes the modal
 */

import { createPortal } from 'react-dom'
import { modalBackdrop, modalBox, modalCloseBtn } from './styles'

interface FeedbackVaultModalProps {
  onClose: () => void
}

// Sample feedback entries — replace with live DB data when available
const FEEDBACK_SAMPLES = [
  {
    author: 'Ashanti Member',
    region: 'Ashanti',
    text: 'The new regional chapter meetings have significantly improved communication between constituency leads.',
  },
  {
    author: 'Greater Accra Lead',
    region: 'Greater Accra',
    text: 'Requesting more mobilization materials for the upcoming town hall sessions.',
  },
  {
    author: 'Western Member',
    region: 'Western',
    text: 'The digital strategy polls are a great way to stay engaged with the leadership.',
  },
]

export function FeedbackVaultModal({ onClose }: FeedbackVaultModalProps) {
  return createPortal(
    <div style={modalBackdrop}>
      <div style={modalBox(600)}>
        {/* Header */}
        <div className="ph">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
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
            Movement Feedback Vault
          </span>
          <button aria-label="Close feedback vault" style={modalCloseBtn} onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Feedback cards */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FEEDBACK_SAMPLES.map((fb, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.7,
                  fontStyle: 'italic',
                  margin: 0,
                }}
              >
                "{fb.text}"
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                }}
              >
                — {fb.author} from {fb.region} Region
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 24px' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 44 }}
            onClick={onClose}
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
