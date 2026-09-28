'use client'

import { Globe2 } from 'lucide-react'
import { studioSurfaceHref } from '@/lib/platform-urls'
import { STUDIO_LOCALES, STUDIO_LOCALE_LABEL, type StudioLocale } from './studio-locale'
import { studioCopy } from './studio-copy'
import { useStudioLocale, useStudioRoute } from './use-studio-locale'

export function StudioLanguageSwitcher() {
  const route = useStudioRoute()
  const active = useStudioLocale()
  const c = studioCopy(active)
  const localeHref = (locale: StudioLocale) => studioSurfaceHref(route, locale)

  return (
    <div className="studio-language-controls">
      <div className="studio-language-switcher" aria-label={c.language.label}>
        {STUDIO_LOCALES.map((locale) => (
          <a
            key={locale}
            href={localeHref(locale)}
            data-studio-locale={locale}
            aria-current={locale === active ? 'page' : undefined}
            aria-label={`${c.language.switchTo} ${STUDIO_LOCALE_LABEL[locale]}`}
          >
            {STUDIO_LOCALE_LABEL[locale]}
          </a>
        ))}
      </div>
      <label className="studio-language-select">
        <Globe2 size={14} aria-hidden />
        <span className="sr-only">{c.language.label}</span>
        <select
          value={active}
          onChange={(event) => {
            const locale = event.target.value as StudioLocale
            if (locale !== active) window.location.assign(localeHref(locale))
          }}
        >
          {STUDIO_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {STUDIO_LOCALE_LABEL[locale]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
