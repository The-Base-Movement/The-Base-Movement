export default function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 20,
            color: 'hsl(var(--on-surface-muted))',
            animation: 'spin 1s linear infinite',
          }}
        >
          refresh
        </span>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
