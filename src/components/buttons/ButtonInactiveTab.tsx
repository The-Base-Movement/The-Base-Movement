import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

export function ButtonInactiveTab({ children, ...props }: ButtonProps) {
  return (
    <Button variant="default" {...props}>
      {children}
    </Button>
  )
}
