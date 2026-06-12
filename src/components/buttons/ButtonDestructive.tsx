import { Button, type ButtonProps } from '@/components/buttons/ui/neon-button'

export function ButtonDestructive({ children, ...props }: ButtonProps) {
  return (
    <Button variant="destructive" {...props}>
      {children}
    </Button>
  )
}
