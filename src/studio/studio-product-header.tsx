'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { ProductHeader } from '@/design-system'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { StudioLanguageSwitcher } from './studio-language-switcher'
import { studioLocaleFromPath } from './studio-locale'

export function StudioProductHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))

  return (
    <ProductHeader
      href={studioHref('', locale)}
      brandHref={marketingHref(locale)}
      product="Studio"
      navigation={
        <span role="status" aria-label="QDIP Core connected" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ds-semantic-success)', fontSize: 'var(--ds-text-xs)', fontWeight: 600, letterSpacing: '0.02em' }}>
          <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 0 3px rgb(var(--ds-semantic-success-rgb) / 0.12)' }} />
          Core connected
        </span>
      }
      utilities={<StudioLanguageSwitcher />}
    />
  )
}
