/**
 * ButtonPrimary Component
 * -------------------------------------------------------------
 * Primary variant button wrapping the generic Neon button system.
 * Used for standard submit options and primary user flow calls to action.
 */

import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

/**
 * ButtonPrimary
 * -------------------------------------------------------------
 * A pre-styled primary action button component.
 */
export function ButtonPrimary({ children, ...props }: ButtonProps) {
  return (
    <Button variant="primary" {...props}>
      {children}
    </Button>
  )
}
