import type { SentimentIntelligence as SentimentMetrics } from '@/types/admin'
import { getSentimentColor, getSentimentLabel } from './utils'

interface SentimentRegionalMetricsProps {
  sentimentMetrics: SentimentMetrics[]
}

export function SentimentRegionalMetrics({ sentimentMetrics }: SentimentRegionalMetricsProps) {
  return (
    <div
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <div
        className="ph"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 11,
          }}
        >
          Regional metrics
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
        >
          map
        </span>
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {sentimentMetrics.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No regional data available.
            </p>
          </div>
        ) : (
          sentimentMetrics.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 12,
                }}
              >
                {t.region}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                  }}
                >
                  <span style={{ color: 'hsl(var(--primary))' }}>{t.positive_count}</span>
                  <span style={{ color: 'hsl(var(--border))' }}>/</span>
                  <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{t.neutral_count}</span>
                  <span style={{ color: 'hsl(var(--border))' }}>/</span>
                  <span style={{ color: 'hsl(var(--destructive))' }}>{t.negative_count}</span>
                </div>
                <span
                  className="pill"
                  style={{
                    background: getSentimentColor(t.avg_sentiment).bg,
                    color: getSentimentColor(t.avg_sentiment).color,
                    fontSize: 9,
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    minWidth: 70,
                    textAlign: 'center',
                  }}
                >
                  {getSentimentLabel(t.avg_sentiment)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
