export const templates = [
  {
    title: 'National Membership Drive',
    type: 'ALL',
    priority: 'High',
    content:
      'All chapters are invited to regional registration drives this weekend. Goal: 10,000 new verified members.',
  },
  {
    title: 'Regional Strategic Briefing',
    type: 'REGION',
    priority: 'Normal',
    content:
      'Regional leaders are requested to submit their mobilization reports by Friday 18:00 GMT.',
  },
  {
    title: 'Level Red Emergency Alert',
    type: 'ALL',
    priority: 'Urgent',
    content:
      'IMMEDIATE FIELD MOBILIZATION REQUIRED. Check regional secure channels for tactical coordinates.',
  },
  {
    title: 'Constituency Outreach',
    type: 'CONSTITUENCY',
    priority: 'Normal',
    content:
      'Local chapter engagement initiative starting in your area. Please coordinate with regional leads.',
  },
]

export const priorityStyle = (p: string): React.CSSProperties => {
  if (p === 'Urgent')
    return {
      background: 'rgba(239,68,68,0.1)',
      color: 'hsl(var(--destructive))',
      border: '1px solid rgba(239,68,68,0.2)',
    }
  if (p === 'High')
    return {
      background: 'rgba(245,158,11,0.1)',
      color: 'hsl(var(--accent))',
      border: '1px solid rgba(245,158,11,0.2)',
    }
  return {
    background: 'hsl(var(--container-low))',
    color: 'hsl(var(--on-surface-muted))',
    border: '1px solid hsl(var(--border))',
  }
}

export const targetLabel = (type: string, value?: string) =>
  type === 'ALL' ? 'National' : (value ?? type)

export const pillBase: React.CSSProperties = {
  padding: '2px 10px',
  fontSize: 9,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
}
