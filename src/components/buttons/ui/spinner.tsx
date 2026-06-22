/**
 * Spinner Component
 * -------------------------------------------------------------
 * Simple visual indicator representing task loading state.
 * Uses keyframe spinning class style and ARIA status accessibility tags.
 */

import { cn } from '@/lib/utils'

/**
 * Spinner
 * -------------------------------------------------------------
 * Loading spinner component.
 */
function Spinner({ className, ...props }: React.ComponentProps<'div'>) {
  return <div role="status" aria-label="Loading" className={cn('spinner', className)} {...props} />
}

export { Spinner }
