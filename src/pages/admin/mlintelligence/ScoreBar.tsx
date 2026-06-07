export default function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    score >= 0.65
      ? 'hsl(var(--primary))'
      : score >= 0.35
        ? 'hsl(var(--accent))'
        : 'hsl(var(--on-surface-muted))'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 4,
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
      <span
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          minWidth: 28,
        }}
      >
        {pct}%
      </span>
    </div>
  )
}
