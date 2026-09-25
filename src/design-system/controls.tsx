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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  }
)
Button.displayName = 'Button'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('ds-card', className)} {...props} />
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('ds-card-header', className)} {...props} />
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h2 ref={ref} className={cn('ds-card-title', className)} {...props} />
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('ds-card-description', className)} {...props} />
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('ds-card-content', className)} {...props} />
)
CardContent.displayName = 'CardContent'

const badgeVariants = cva('ds-badge', {
  variants: {
    variant: {
      neutral: 'ds-badge-neutral',
      accent: 'ds-badge-accent',
      cyan: 'ds-badge-info',
      emerald: 'ds-badge-success',
      amber: 'ds-badge-risk',
      rose: 'ds-badge-danger',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn('ds-input', className)} ref={ref} {...props} />
  )
)
Input.displayName = 'Input'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('ds-label-control', className)} {...props} />
}

export { badgeVariants, buttonVariants }
