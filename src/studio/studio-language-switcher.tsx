'use client'

import { LanguageSwitcher } from '@/components/marketing/language-switcher'
import type { MarketingLocale } from '@/components/marketing/qdip-copy'
import { studioSurfaceHref } from '@/lib/platform-urls'
import { useStudioLocale, useStudioRoute } from './use-studio-locale'

export function StudioLanguageSwitcher() {
  const route = useStudioRoute()
  const active = useStudioLocale()
  const localeHref = (locale: MarketingLocale) => studioSurfaceHref(route, locale)

  return (
    <div className="studio-language-controls">
      <LanguageSwitcher locale={active} hrefForLocale={localeHref} />
    </div>
  )
}
