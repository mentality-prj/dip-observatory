import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva('ds-button', {
  variants: {
    variant: {
      default: 'ds-button-primary',
      secondary: 'ds-button-secondary',
      ghost: 'ds-button-ghost',
      danger: 'ds-button-danger',
    },
    size: {
      default: 'ds-button-md',
      sm: 'ds-button-sm',
      lg: 'ds-button-lg',
      icon: 'ds-button-icon',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
