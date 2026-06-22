/**
 * BrandLine Component
 * -------------------------------------------------------------
 * A visual decorative divider representing the Ghana flag tricolor scheme (Red, Gold, Green).
 * Used below headers and titles to anchor branding theme context.
 */

import { cn } from '@/lib/utils'

interface BrandLineProps {
  className?: string
  width?: number | string
}

/**
 * BrandLine component definition.
 */
export function BrandLine({ className, width = 128 }: BrandLineProps) {
  return (
    <div className={cn('flex h-[6px] mt-3.5', className)} style={{ width }} aria-hidden="true">
      <div className="flex-1 bg-[#CE1126]" />
      <div className="flex-1 bg-[#DAA520]" />
      <div className="flex-1 bg-[#006B3F]" />
    </div>
  )
}
