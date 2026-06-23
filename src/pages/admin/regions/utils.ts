export const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

export type ConEntry = { id: string; name: string }
export type ConMap = Record<number, ConEntry[]>
