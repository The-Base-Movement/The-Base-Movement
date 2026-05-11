import React from 'react'
import { Button, type ButtonProps } from '@/components/ui/neon-button'

export function ButtonAccent({ children, ...props }: ButtonProps) {
  return (
    <Button variant="accent" {...props}>
      {children}
    </Button>
  )
}
