import KpiStrip from '@/pages/admin/mlintelligence/KpiStrip'
import type { RegionSentiment, SentimentResponse } from '@/services/mlService'

const sentimentColor: Record<string, string> = {
  Strong: 'hsl(var(--primary))',
  Positive: '#3b82f6',
  Neutral: 'hsl(var(--on-surface-muted))',
  Concerning: 'hsl(var(--destructive))',
}

const trendIcon: Record<string, string> = {
  Rising: 'trending_up',
  Stable: 'trending_flat',
  Falling: 'trending_down',
}

const trendColor: Record<string, string> = {
  Rising: 'hsl(var(--primary))',
  Stable: 'hsl(var(--on-surface-muted))',
  Falling: 'hsl(var(--destructive))',
}

interface Props {
  sentiment: SentimentResponse
}

export default function SentimentTab({ sentiment }: Props) {
  return (
    <>
      <KpiStrip
        items={[
          {
            label: 'National Sentiment',
            value: `${Math.round(sentiment.national_sentiment * 100)}%`,
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Most Positive',
            value: sentiment.most_positive_region,
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Most Concerning',
            value: sentiment.most_negative_region,
            bar: 'hsl(var(--destructive))',
          },
          {
            label: 'Regions',
            value: sentiment.regions.length.toString(),
            bar: 'hsl(var(--on-surface))',
          },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sentiment.regions.map((region: RegionSentiment) => {
          const pct = Math.round(region.sentiment_score * 100)
          const color = sentimentColor[region.sentiment_label]
          const icon = trendIcon[region.trend]
          const trendColorValue = trendColor[region.trend]

          return (
            <div key={region.region} className="panel" style={{ padding: '14px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    flex: 1,
                  }}
                >
                  {region.region}
                </span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 11, color }}>
                  {region.sentiment_label}
                </span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: trendColorValue }}
                >
                  {icon}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {region.trend}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color,
                    minWidth: 36,
                    textAlign: 'right',
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'hsl(var(--border))',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Members', value: region.total_members.toLocaleString() },
                  { label: 'Active ratio', value: `${Math.round(region.active_ratio * 100)}%` },
                  {
                    label: 'Donor rate',
                    value: `${Math.round(region.donation_participation_rate * 100)}%`,
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 9,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 8,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Generated {new Date(sentiment.generated_at).toLocaleString()}
      </div>
    </>
  )
}
