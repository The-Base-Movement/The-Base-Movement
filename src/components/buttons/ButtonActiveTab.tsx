import React from 'react'
import { Button, type ButtonProps } from '@/components/ui/neon-button'

export function ButtonActiveTab({ children, ...props }: ButtonProps) {
  return (
    <Button variant="active-tab" {...props}>
      {children}
    </Button>
  )
}
