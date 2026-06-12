import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

export function ButtonActiveTab({ children, ...props }: ButtonProps) {
  return (
    <Button variant="active-tab" {...props}>
      {children}
    </Button>
  )
}
