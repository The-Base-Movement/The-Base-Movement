import React from 'react'
import { Button, type ButtonProps } from '@/components/ui/neon-button'

export function ButtonDestructive({ children, ...props }: ButtonProps) {
  return (
    <Button variant="destructive" {...props}>
      {children}
    </Button>
  )
}
