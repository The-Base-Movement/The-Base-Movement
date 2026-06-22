/**
 * ButtonAccent Component
 * -------------------------------------------------------------
 * Accent variant button wrapping the generic Neon button system.
 * Used for prominent interactions requiring branding colors.
 */

import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

/**
 * ButtonAccent
 * -------------------------------------------------------------
 * A pre-styled accent theme button component.
 */
export function ButtonAccent({ children, ...props }: ButtonProps) {
  return (
    <Button variant="accent" {...props}>
      {children}
    </Button>
  )
}
