export const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 800,
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
}

export const rankStyle = (index: number): React.CSSProperties => {
  if (index === 0) return { background: 'hsl(var(--accent))', color: '#fff' }
  if (index === 1) return { background: 'rgba(34,197,94,0.2)', color: 'hsl(var(--primary))' }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}
