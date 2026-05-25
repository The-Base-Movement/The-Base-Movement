/**
 * polls/styles.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared inline style constants used across all Polls sub-components.
 * Import these instead of repeating style objects in every file.
 */

import type React from 'react'

/** Standard text input / date input style */
export const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

/** Select / dropdown inherits inputSt + pointer cursor */
export const selectSt: React.CSSProperties = { ...inputSt, cursor: 'pointer' }

/** Form field label */
export const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

/** Table header cell */
export const thSt: React.CSSProperties = {
  padding: '11px 20px',
  textAlign: 'left',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  background: 'hsl(var(--container-low))',
  borderBottom: '1px solid hsl(var(--border))',
}

/** Table data cell */
export const tdSt: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid hsl(var(--border))',
}

/** Centered modal backdrop */
export const modalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

/** Modal box — call with a maxWidth value */
export const modalBox = (maxW: number): React.CSSProperties => ({
  background: '#fff',
  borderRadius: 6,
  border: '1px solid hsl(var(--border))',
  width: '100%',
  maxWidth: maxW,
  maxHeight: '90vh',
  overflowY: 'auto',
})

/** Circular close button inside modals */
export const modalCloseBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'hsl(var(--on-surface-muted))',
  flexShrink: 0,
}
