import { type CSSProperties } from 'react'

export const ACTION_PILL: Record<string, { cls: string; label: string }> = {
  enrolled: { cls: 'pill-ok', label: 'Enrolled' },
  verified: { cls: 'pill-ok', label: 'Verified' },
  step_up_passed: { cls: 'pill-ok', label: 'Step-up passed' },
  step_up_required: { cls: 'pill-warn', label: 'Step-up required' },
  blocked: { cls: 'pill-err', label: 'Blocked' },
  slot_reset: { cls: 'pill-mute', label: 'Slot reset' },
}

/** Brand colour per action — used by the activity-breakdown pie chart. */
export const ACTION_COLOR: Record<string, string> = {
  enrolled: 'hsl(var(--primary))',
  verified: 'hsl(156 55% 45%)',
  step_up_passed: 'hsl(190 60% 42%)',
  step_up_required: 'hsl(var(--accent))',
  slot_reset: 'hsl(var(--on-surface-muted))',
  blocked: 'hsl(var(--destructive))',
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
  return ACTION_PILL[action]?.label ?? action
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
