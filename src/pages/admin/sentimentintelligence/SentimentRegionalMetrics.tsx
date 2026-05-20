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
        background: 'hsl(var(--on-surface))',
        color: '#fff',
      }}
    >
      <div
        className="ph"
        style={{
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11 }}>
          Regional metrics
        </span>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)' }}
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
                fontWeight: 800,
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
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
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
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
                    fontWeight: 900,
                    fontSize: 10,
                  }}
                >
                  <span style={{ color: 'hsl(var(--primary))' }}>{t.positive_count}</span>
                  <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{t.neutral_count}</span>
                  <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
                  <span style={{ color: 'hsl(var(--destructive))' }}>{t.negative_count}</span>
                </div>
                <span
                  className="pill"
                  style={{
                    background: getSentimentColor(t.avg_sentiment).bg,
                    color: getSentimentColor(t.avg_sentiment).color,
                    fontSize: 9,
                    fontWeight: 900,
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
