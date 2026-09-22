'use client'

import { usePathname, useRouter } from 'next/navigation'
import { studioHref } from '@/lib/platform-urls'
import { useTransition } from 'react'
import { Globe2 } from 'lucide-react'

import {
  STUDIO_LOCALES,
  STUDIO_LOCALE_LABEL,
  studioSectionFromPath,
  type StudioLocale,
} from './studio-locale'
import { useStudioLocale } from './use-studio-locale'

export function StudioLanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const active = useStudioLocale()

  const changeLocale = (locale: StudioLocale) => {
    if (locale === active) return
    const section = studioSectionFromPath(pathname)
    startTransition(() => router.replace(studioHref(section, locale)))
  }

  return (
    <div className="studio-language-controls">
      <div className="studio-language-switcher" aria-label="Language">
        {STUDIO_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            disabled={pending}
            aria-current={locale === active ? 'page' : undefined}
            aria-label={`Switch language to ${locale}`}
            onClick={() => changeLocale(locale)}
          >
            {STUDIO_LOCALE_LABEL[locale]}
          </button>
        ))}
      </div>
      <label className="studio-language-select">
        <Globe2 size={14} aria-hidden />
        <span className="sr-only">Language</span>
        <select
          value={active}
          disabled={pending}
          onChange={(event) => changeLocale(event.target.value as StudioLocale)}
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
