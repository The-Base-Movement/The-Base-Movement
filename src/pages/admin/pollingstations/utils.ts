export type Station = {
  code: string
  name: string
  community: string
  constituency: string
  region: string
  member_count: number
}

export const PAGE_SIZE = 50

export const selectStyle: React.CSSProperties = {
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  paddingLeft: 30,
  paddingRight: 28,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 12,
  background: 'hsl(var(--card))',
  cursor: 'pointer',
  appearance: 'none',
  outline: 'none',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

export const inputStyle: React.CSSProperties = {
  height: 34,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  paddingLeft: 30,
  paddingRight: 12,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  background: 'hsl(var(--card))',
  outline: 'none',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
  width: 220,
}
