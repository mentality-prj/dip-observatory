'use client'

import Link from 'next/link'
import { Menu, Telescope } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { observatoryHref } from '@/lib/platform-urls'
import { studioLocaleFromPath } from './studio-locale'
import { StudioNav } from './studio-nav'

const OBSERVATORY_LABEL = {
  en: 'Open Observatory',
  uk: 'Відкрити Observatory',
  pl: 'Otwórz Observatory',
} as const

export function StudioMobileNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))

  return (
    <details className="studio-mobile-navigation">
      <summary>
        <Menu size={16} aria-hidden />
        <span>Workspace</span>
      </summary>
      <div className="studio-mobile-navigation-sheet">
        <StudioNav />
        <Link className="studio-mobile-product-link" href={observatoryHref('', locale)}>
          <Telescope size={15} aria-hidden />
          {OBSERVATORY_LABEL[locale]}
        </Link>
      </div>
    </details>
  )
}
