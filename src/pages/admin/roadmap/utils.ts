import type { Milestone } from '@/services/adminService'

export const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: '#fff',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-normal, 400)',
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

export const selectSt: React.CSSProperties = { ...inputSt, appearance: 'none' }

export const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

export const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 'var(--font-weight-medium, 500)',
  borderRadius: 4,
  fontFamily: "'Public Sans', sans-serif",
}

export const statusStyle = (s: Milestone['status']): React.CSSProperties => {
  if (s === 'Completed')
    return {
      background: 'rgba(34,197,94,0.1)',
      color: 'hsl(var(--primary))',
      border: '1px solid rgba(34,197,94,0.2)',
    }
  if (s === 'In Progress')
    return {
      background: 'rgba(245,158,11,0.1)',
      color: 'hsl(var(--accent))',
      border: '1px solid rgba(245,158,11,0.2)',
    }
  return {
    background: 'rgba(239,68,68,0.1)',
    color: 'hsl(var(--destructive))',
    border: '1px solid rgba(239,68,68,0.2)',
  }
}

export const statusDot = (s: Milestone['status']): string => {
  if (s === 'Completed') return 'hsl(var(--primary))'
  if (s === 'In Progress') return 'hsl(var(--accent))'
  return 'hsl(var(--destructive))'
}
