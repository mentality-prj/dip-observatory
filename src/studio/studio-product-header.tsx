'use client'

import Link from 'next/link'
import { Cable, Telescope } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProductHeader, StatusBadge } from '@/design-system'
import { marketingHref, observatoryHref, studioHref } from '@/lib/platform-urls'
import { StudioLanguageSwitcher } from './studio-language-switcher'
import { studioLocaleFromPath } from './studio-locale'

const OBSERVATORY_LABEL = {
  en: 'Open Observatory',
  uk: 'Відкрити Observatory',
  pl: 'Otwórz Observatory',
} as const

export function StudioProductHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))
  const observatoryUrl = observatoryHref('', locale)

  return (
    <ProductHeader
      href={studioHref('', locale)}
      brandHref={marketingHref(locale)}
      product="Studio"
      navigation={
        <StatusBadge>
          <Cable size={13} aria-hidden />
          Core connected
        </StatusBadge>
      }
      utilities={
        <>
          <Link className="studio-observatory-link" href={observatoryUrl}>
            <Telescope size={15} aria-hidden />
            <span>{OBSERVATORY_LABEL[locale]}</span>
          </Link>
          <StudioLanguageSwitcher />
        </>
      }
    />
  )
}
