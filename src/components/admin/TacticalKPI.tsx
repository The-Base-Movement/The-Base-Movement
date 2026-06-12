import React from 'react'
import { cn } from '@/lib/utils'

interface TacticalKPIProps {
  label: string
  value: string | number
  description?: string
  delta?: React.ReactNode
  isDown?: boolean
  variant?: 'red' | 'gold' | 'black' | 'green'
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  className?: string
}

export function TacticalKPI({ 
  label, 
  value, 
  description, 
  delta, 
  isDown, 
  variant = 'black',
  trend,
  className
}: TacticalKPIProps) {
  const finalDirection = trend ? trend.direction : (isDown ? 'down' : 'up')
  const finalValue = trend ? trend.value : (delta || "Operational stability")

  const getIcon = () => {
    if (finalDirection === 'up') return 'north'
    if (finalDirection === 'down') return 'south'
    return 'trending_flat'
  }
  return (
    <div className={cn("card group cursor-default", variant, className)}>
      <div className="row">
        <span className="eye">{label}</span>
      </div>
      <div className="num tnum">
        {value}
      </div>
      {description && (
        <div className="lbl">
          {description}
        </div>
      )}
      <div className="foot">
        <div className={cn("delta", finalDirection === 'down' && "text-destructive")}>
          <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
            {getIcon()}
          </span>
          {finalValue}
        </div>
      </div>
    </div>
  )
}
