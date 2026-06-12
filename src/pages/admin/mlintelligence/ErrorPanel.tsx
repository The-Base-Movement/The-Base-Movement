export default function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      className="panel"
      style={{
        padding: 24,
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--destructive))', flexShrink: 0 }}
        >
          error
        </span>
        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--destructive))',
              marginBottom: 4,
            }}
          >
            ML Service Unavailable
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {message}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
            }}
          >
            Start the service:{' '}
            <code
              style={{
                background: 'hsl(var(--container-low))',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
                fontFamily: 'monospace',
              }}
            >
              cd ml-service && uvicorn main:app --reload
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
