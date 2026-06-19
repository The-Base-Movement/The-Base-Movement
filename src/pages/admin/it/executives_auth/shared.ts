import { type CSSProperties } from 'react'

export const ACTION_PILL: Record<string, { cls: string; label: string }> = {
  enrolled: { cls: 'pill-ok', label: 'Enrolled' },
  verified: { cls: 'pill-ok', label: 'Verified' },
  step_up_passed: { cls: 'pill-ok', label: 'Step-up passed' },
  step_up_required: { cls: 'pill-warn', label: 'Step-up required' },
  isp_change: { cls: 'pill-warn', label: 'ISP change' },
  blocked: { cls: 'pill-err', label: 'Blocked' },
  slot_reset: { cls: 'pill-mute', label: 'Slot reset' },
  logout: { cls: 'pill-mute', label: 'Logged out' },
}

/** Brand colour per action — used by the activity-breakdown pie chart. */
export const ACTION_COLOR: Record<string, string> = {
  enrolled: 'hsl(var(--primary))',
  verified: 'hsl(156 55% 45%)',
  step_up_passed: 'hsl(190 60% 42%)',
  step_up_required: 'hsl(var(--accent))',
  isp_change: 'hsl(28 80% 52%)',
  slot_reset: 'hsl(var(--on-surface-muted))',
  blocked: 'hsl(var(--destructive))',
  logout: 'hsl(var(--on-surface-muted))',
}

export function fmt(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fmtFull(ts: string): string {
  return new Date(ts).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'medium' })
}

export function actionLabel(action: string): string {
  return ACTION_PILL[action]?.label ?? prettifyAction(action)
}

/** Turn an audit action/resource token like "UPDATE_MEMBER" into "Update member". */
export function prettifyAction(token: string): string {
  const clean = token.replace(/[_/]+/g, ' ').trim().toLowerCase()
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

/** Leading type of a "TYPE/id" resource string (e.g. "MEMBERS/TBM-1" → "MEMBERS"). */
export function resourceType(resource: string | null | undefined): string {
  if (!resource) return '—'
  return prettifyAction(resource.split('/')[0])
}

/** Pill styling for an audit-log status. */
export function statusPill(status: string | null | undefined): { cls: string; label: string } {
  switch (status) {
    case 'Success':
      return { cls: 'pill-ok', label: 'Success' }
    case 'Failure':
      return { cls: 'pill-err', label: 'Failure' }
    case 'Warning':
      return { cls: 'pill-warn', label: 'Warning' }
    default:
      return { cls: 'pill-mute', label: status ?? '—' }
  }
}

export function sourceLabel(source: string | null | undefined): string {
  return source === 'action' ? 'In-app' : 'Device'
}

/** Stable colour for a dynamic pie slice keyed by its label. */
const PIE_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(190 60% 42%)',
  'hsl(156 55% 45%)',
  'hsl(var(--destructive))',
  'hsl(270 50% 55%)',
  'hsl(28 80% 52%)',
  'hsl(210 55% 50%)',
  'hsl(var(--on-surface-muted))',
]

export function pieColor(key: string, index: number): string {
  return ACTION_COLOR[key] ?? PIE_PALETTE[index % PIE_PALETTE.length]
}

export const selectStyle: CSSProperties = {
  height: 32,
  padding: '0 10px',
  fontSize: 12,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
}

export const cellStyle: CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid hsl(var(--border))',
  color: 'hsl(var(--on-surface))',
}
