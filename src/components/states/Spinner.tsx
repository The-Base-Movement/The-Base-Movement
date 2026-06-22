/**
 * Spinner & DotLoader Components
 * -------------------------------------------------------------
 * Exposes reusable visual loading indicators:
 * - Spinner: A rotating border-top ring with configurable sizes and themes
 * - DotLoader: A sequence of three bouncing primary-colored dots with optional labels
 */

import type { CSSProperties } from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md'
  variant?: 'primary' | 'dest' | 'white'
  style?: CSSProperties
}

interface DotLoaderProps {
  label?: string
  style?: CSSProperties
}

/**
 * Spinner component definition.
 */
export function Spinner({ size = 'md', variant = 'primary', style }: SpinnerProps) {
  const dim = size === 'sm' ? 20 : 36
  const bw = size === 'sm' ? 2 : 3

  const topColor =
    variant === 'dest'
      ? 'hsl(var(--destructive))'
      : variant === 'white'
        ? '#fff'
        : 'hsl(var(--primary))'

  const trackColor = variant === 'white' ? 'rgba(255,255,255,0.3)' : 'hsl(var(--border))'

  return (
    <div
      aria-label="Loading"
      style={{
        width: dim,
        height: dim,
        border: `${bw}px solid ${trackColor}`,
        borderTopColor: topColor,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/**
 * DotLoader component definition.
 */
export function DotLoader({ label, style }: DotLoaderProps) {
  const dot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'hsl(var(--primary))',
    animation: 'dl-bounce 0.8s infinite',
  }

  return (
    <div
      aria-label={label ?? 'Loading'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, ...style }}
    >
      <div style={{ display: 'flex', gap: 5 }}>
        <div style={dot} />
        <div style={{ ...dot, animationDelay: '0.15s' }} />
        <div style={{ ...dot, animationDelay: '0.3s' }} />
      </div>
      {label && (
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
