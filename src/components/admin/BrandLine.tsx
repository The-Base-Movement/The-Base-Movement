import React from 'react'
import { cn } from '@/lib/utils'

export function BrandLine({ className }: { className?: string }) {
  return (
    <div className={cn("bl", className)}>
      <div />
      <div />
      <div />
    </div>
  )
}
