export const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export const channelIconName = (ch: string) => {
  if (ch === 'SMS') return 'sms'
  if (ch === 'Email') return 'mail'
  if (ch === 'Push') return 'notifications'
  return 'chat_bubble'
}

export const priorityBorderColor = (p: string) => {
  if (p === 'Urgent') return 'hsl(var(--destructive))'
  if (p === 'High') return '#d97706'
  return 'hsl(var(--border))'
}
