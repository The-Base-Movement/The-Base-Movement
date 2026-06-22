/**
 * ButtonDestructive Component
 * -------------------------------------------------------------
 * Destructive variant button wrapping the generic Neon button system.
 * Used for deletion, removal, or rollback operations to caution users.
 */

import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

/**
 * ButtonDestructive
 * -------------------------------------------------------------
 * A pre-styled destructive action button component.
 */
export function ButtonDestructive({ children, ...props }: ButtonProps) {
  return (
    <Button variant="destructive" {...props}>
      {children}
    </Button>
  )
}
