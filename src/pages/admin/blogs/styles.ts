/**
 * blogs/styles.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared inline style constants used across all Blogs sub-components.
 * Import these instead of repeating style objects in every file.
 */

import type React from 'react'

/** Select / dropdown style */
export const selectSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

/** Form field label */
export const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 8,
}

/** Small muted metadata text (dates, read-time, etc.) */
export const metaSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
}
