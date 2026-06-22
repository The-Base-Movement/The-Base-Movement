/**
 * ButtonInactiveTab Component
 * -------------------------------------------------------------
 * Inactive/default variant button wrapping the generic Neon button system.
 * Used for standard clickable button interactions or unselected tabs.
 */

import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

/**
 * ButtonInactiveTab
 * -------------------------------------------------------------
 * Tab indicator button in inactive state.
 */
export function ButtonInactiveTab({ children, ...props }: ButtonProps) {
  return (
    <Button variant="default" {...props}>
      {children}
    </Button>
  )
}
