'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { QdipLogo } from '@/components/marketing/qdip-logo'
import marketingStyles from '@/components/marketing/qdip-site.module.css'
import { marketingHref } from '@/lib/platform-urls'
import { studioLocaleFromPath } from './studio-locale'

export function StudioFooter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))
  const root = marketingHref(locale)

  return (
    <footer className={`${marketingStyles.footer} studio-site-footer`}>
      <Link href={root} aria-label="QDIP home"><QdipLogo /></Link>
      <nav aria-label="Footer navigation">
        <Link href={`${root}/how-it-works`}>How it works</Link>
        <Link href={`${root}/use-cases`}>Use cases</Link>
        <Link href={`${root}/core`}>QDIP Core</Link>
        <Link href={`${root}/core/research`}>Research</Link>
      </nav>
      <span>© {new Date().getFullYear()} QDIP</span>
    </footer>
  )
}
