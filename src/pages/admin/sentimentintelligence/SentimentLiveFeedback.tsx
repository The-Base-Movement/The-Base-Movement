import type { MemberFeedback } from '@/types/admin'
import { format } from 'date-fns'
import { getSentimentColor } from './utils'

interface SentimentLiveFeedbackProps {
  feedback: MemberFeedback[]
}

export function SentimentLiveFeedback({ feedback }: SentimentLiveFeedbackProps) {
  return (
    <aside className="sentiment-live-feedback" style={{ width: 400, flexShrink: 0 }}>
      <div className="panel" style={{ padding: 0, overflow: 'hidden', height: '100%' }}>
        <div
          className="ph"
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 11,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Live feedback
            </span>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 9,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Direct member sentiment
            </p>
          </div>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
          >
            message
          </span>
        </div>
        <div style={{ maxHeight: 800, overflowY: 'auto' }}>
          {feedback.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                No feedback intercepted.
              </p>
            </div>
          ) : (
            feedback.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 24,
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    className="pill"
                    style={{
                      background: getSentimentColor(item.sentiment_score).bg,
                      color: getSentimentColor(item.sentiment_score).color,
                      fontSize: 9,
                      fontWeight:
                        'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    }}
                  >
                    {item.category}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {format(new Date(item.created_at), 'HH:mm')}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.6,
                  }}
                >
                  {item.feedback_text || 'Sentiment intercept recorded without textual content.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      opacity: 0.3,
                    }}
                  >
                    location_on
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {item.region}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
