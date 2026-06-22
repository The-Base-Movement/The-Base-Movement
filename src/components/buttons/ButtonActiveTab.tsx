/**
 * ButtonActiveTab Component
 * -------------------------------------------------------------
 * Active-tab variant button wrapping the generic Neon button system.
 * Used to indicate currently active selection state in navigation or control panels.
 */

import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

/**
 * ButtonActiveTab
 * -------------------------------------------------------------
 * Tab indicator button in active state.
 */
export function ButtonActiveTab({ children, ...props }: ButtonProps) {
  return (
    <Button variant="active-tab" {...props}>
      {children}
    </Button>
  )
}
