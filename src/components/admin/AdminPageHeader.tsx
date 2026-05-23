import React from 'react'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'

interface AdminPageHeaderProps {
  title: string
  icon?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Standardized Page Header for Admin Command modules.
 * Features:
 * - Title with optional Material Icon
 * - BrandLine component for movement identity
 * - Optional description text
 * - Optional action buttons/controls
 * - Bottom separator line (via .ph class)
 */
export function AdminPageHeader({
  title,
  icon,
  description,
  actions,
  className,
  style,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('ph', className)} style={{ marginBottom: 32, ...style }}>
      <div>
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 24,
            color: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: 0,
          }}
        >
          {icon && (
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {icon}
            </span>
          )}
          {title}
        </h1>
        <BrandLine />
        {description && (
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 8,
              marginBottom: 0,
              maxWidth: 640,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  )
}
