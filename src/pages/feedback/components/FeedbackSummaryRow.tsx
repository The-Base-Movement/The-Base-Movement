interface SentimentType {
  score: number
  label: 'Positive' | 'Neutral' | 'Negative'
}

interface FeedbackSummaryRowProps {
  category: string
  feedbackLength: number
  sentiment: SentimentType | null
}

export function FeedbackSummaryRow({
  category,
  feedbackLength,
  sentiment,
}: FeedbackSummaryRowProps) {
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
    <div className="panel" style={{ marginBottom: 14 }}>
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: 'rgba(0,107,63,.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              track_changes
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Category
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {category}
            </div>
          </div>
        </div>
        {sentiment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                background: sentimentBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: sentimentColor }}
              >
                {sentimentIcon}
              </span>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Sentiment
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 13,
                  color: sentimentColor,
                }}
              >
                {sentiment.label}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              background: 'rgba(0,107,63,.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              edit_note
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Length
            </div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {feedbackLength} chars
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
