import Link from 'next/link'

import { cn } from '@/lib/utils'

type ProductLockupProps = {
  href: string
  product: 'Studio' | 'Observatory'
  className?: string
  onClick?: () => void
}

export function ProductLockup({ href, product, className, onClick }: ProductLockupProps) {
  return (
    <Link aria-label={`QDIP ${product} home`} className={cn('product-lockup', className)} href={href} onClick={onClick}>
      <span className="product-lockup-brand">QDIP</span>
      <span className="product-lockup-product">.{product}</span>
    </Link>
  )
}
