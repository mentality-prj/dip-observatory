import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('ds-badge', {
  variants: {
    variant: {
      neutral: 'ds-badge-neutral',
      cyan: 'ds-badge-info',
      emerald: 'ds-badge-success',
      amber: 'ds-badge-risk',
      rose: 'ds-badge-danger',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
