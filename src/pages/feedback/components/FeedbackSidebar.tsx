interface SentimentType {
  score: number
  label: 'Positive' | 'Neutral' | 'Negative'
}

interface FeedbackSidebarProps {
  sentiment: SentimentType | null
}

export function FeedbackSidebar({ sentiment }: FeedbackSidebarProps) {
  const sentimentColor =
    sentiment?.label === 'Positive'
      ? 'hsl(var(--primary))'
      : sentiment?.label === 'Negative'
        ? 'hsl(var(--destructive))'
        : 'hsl(var(--on-surface-muted))'

  const sentimentBg =
    sentiment?.label === 'Positive'
      ? 'rgba(0,107,63,.08)'
      : sentiment?.label === 'Negative'
        ? 'rgba(206,17,38,.08)'
        : 'rgba(0,0,0,.04)'

  const sentimentIcon =
    sentiment?.label === 'Positive'
      ? 'sentiment_satisfied'
      : sentiment?.label === 'Negative'
        ? 'sentiment_dissatisfied'
        : 'sentiment_neutral'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* How it works */}
      <div
        style={{
          background: '#181d19',
          borderRadius: 6,
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            fontSize: 64,
            color: '#fff',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        >
          psychology
        </span>
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 10,
            color: 'hsl(var(--accent))',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 8,
          }}
        >
          How it works
        </div>
        {[
          { icon: 'edit_note', text: 'Write your honest ground-level observation or proposal' },
          {
            icon: 'psychology',
            text: 'Our AI engine analyses the sentiment and urgency in real time',
          },
          { icon: 'bar_chart', text: 'Results are aggregated into national intelligence reports' },
          { icon: 'groups', text: 'Steering committee reviews monthly to adjust strategy' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              paddingBottom: 10,
              marginBottom: i < 3 ? 10 : 0,
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
              >
                {s.icon}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: 'rgba(255,255,255,.65)',
                lineHeight: 1.55,
              }}
            >
              {s.text}
            </p>
          </div>
        ))}
      </div>

      {/* Sentiment preview */}
      <div className="panel">
        <div className="ph2">
          <h3>Sentiment preview</h3>
          <span className="meta">live · AI</span>
        </div>
        <div style={{ padding: '14px 20px' }}>
          {!sentiment ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--border))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                sentiment_neutral
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 11.5,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Start typing to see your sentiment score
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: sentimentBg,
                  border: `1px solid ${sentimentColor}30`,
                  borderRadius: 4,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 28, color: sentimentColor }}
                >
                  {sentimentIcon}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 16,
                      color: sentimentColor,
                      lineHeight: 1,
                    }}
                  >
                    {sentiment.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 3,
                    }}
                  >
                    Detected sentiment
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 9.5,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                    }}
                  >
                    Confidence
                  </span>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 9.5,
                      color: sentimentColor,
                    }}
                  >
                    {Math.round(Math.abs(sentiment.score) * 100)}%
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    background: 'hsl(var(--border))',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(Math.abs(sentiment.score) * 100)}%`,
                      background: sentimentColor,
                      borderRadius: 99,
                      transition: 'width .4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="panel">
        <div className="ph2">
          <h3>Submission guidelines</h3>
        </div>
        <div style={{ padding: '4px 0 10px' }}>
          {[
            'Be specific — vague feedback is hard to action',
            'Focus on one issue per submission',
            'Avoid personal attacks on individuals',
            'Include your constituency context where relevant',
          ].map((tip, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '10px 20px',
                borderBottom: i < 3 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14, color: 'hsl(var(--primary))', marginTop: 1, flexShrink: 0 }}
              >
                check_circle
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.55,
                }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
