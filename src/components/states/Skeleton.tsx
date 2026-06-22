/**
 * Skeleton Component
 * -------------------------------------------------------------
 * A structural loading placeholder with a moving shimmer animation.
 * Mimics actual content UI blocks (text lines, circular avatars, buttons, image blocks).
 */

import type { CSSProperties } from 'react'

type SkeletonVariant =
  | 'text-sm'
  | 'text-md'
  | 'text-lg'
  | 'text-xl'
  | 'avatar'
  | 'avatar-sm'
  | 'img'
  | 'btn'
  | 'chip'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  style?: CSSProperties
}

const HEIGHTS: Record<SkeletonVariant, number> = {
  'text-sm': 11,
  'text-md': 14,
  'text-lg': 20,
  'text-xl': 32,
  avatar: 36,
  'avatar-sm': 28,
  img: 120,
  btn: 38,
  chip: 24,
}

const RADIUS: Record<SkeletonVariant, string> = {
  'text-sm': 'var(--radius-xs)',
  'text-md': 'var(--radius-xs)',
  'text-lg': 'var(--radius-xs)',
  'text-xl': 'var(--radius-xs)',
  avatar: '50%',
  'avatar-sm': '50%',
  img: 'var(--radius-md)',
  btn: 'var(--radius-sm)',
  chip: 'var(--radius-pill)',
}

export function Skeleton({ variant = 'text-md', width, height, style }: SkeletonProps) {
  const isCircle = variant === 'avatar' || variant === 'avatar-sm'
  const h = height ?? HEIGHTS[variant]
  const w = width ?? (isCircle ? h : '100%')

  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        height: typeof h === 'number' ? `${h}px` : h,
        width: typeof w === 'number' ? `${w}px` : w,
        borderRadius: RADIUS[variant],
        flexShrink: isCircle ? 0 : undefined,
        background:
          'linear-gradient(90deg, var(--container-low) 25%, var(--container-hi) 50%, var(--container-low) 75%)',
        backgroundSize: '800px 100%',
        animation: 'sk-shimmer 1.6s infinite linear',
        ...style,
      }}
    />
  )
}
