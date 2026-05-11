import { Button, type ButtonProps } from '@/components/ui/neon-button'

export function ButtonPrimary({ children, ...props }: ButtonProps) {
  return (
    <Button variant="primary" {...props}>
      {children}
    </Button>
  )
}
