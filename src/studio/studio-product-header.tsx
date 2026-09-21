'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { ProductHeader } from '@/design-system'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { StudioLanguageSwitcher } from './studio-language-switcher'
import { studioLocaleFromPath } from './studio-locale'

export function StudioCoreStatus() {
  return (
    <span className="studio-core-status" role="status" aria-label="QDIP Core connected">
      <span className="studio-core-status-dot" aria-hidden />
      <span className="studio-core-status-label-full">Core connected</span>
      <span className="studio-core-status-label-compact">Connected</span>
    </span>
  )
}

export function StudioProductHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))

  return (
    <ProductHeader
      href={studioHref('', locale)}
      brandHref={marketingHref(locale)}
      product="Studio"
      navigation={<StudioCoreStatus />}
      utilities={<StudioLanguageSwitcher />}
    />
  )
}
