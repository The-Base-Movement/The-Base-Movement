import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { pollService } from '@/services/pollService'
import { modalBackdrop, modalBox, modalCloseBtn } from './styles'

interface FeedbackEntry {
  id: string
  content: string
  category: string
  created_at: string
}

interface FeedbackVaultModalProps {
  onClose: () => void
}

export function FeedbackVaultModal({ onClose }: FeedbackVaultModalProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pollService.getRecentFeedback(5).then((data) => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

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
          {loading ? (
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              Loading feedback…
            </p>
          ) : entries.length === 0 ? (
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                textAlign: 'center',
                padding: '24px 0',
              }}
            >
              No feedback submitted yet.
            </p>
          ) : (
            entries.map((fb) => (
              <div
                key={fb.id}
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
                  "{fb.content}"
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
                  — {fb.category} feedback
                </p>
              </div>
            ))
          )}
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
