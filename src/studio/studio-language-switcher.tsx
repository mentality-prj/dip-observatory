'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const LOCALES = ['en', 'uk', 'pl'] as const
type StudioLocale = (typeof LOCALES)[number]
const LABEL: Record<StudioLocale, string> = { en: 'EN', uk: 'UA', pl: 'PL' }

export function StudioLanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const active = (searchParams.get('lang') as StudioLocale | null) ?? 'en'

  const changeLocale = (locale: StudioLocale) => {
    if (locale === active) return
    const params = new URLSearchParams(searchParams.toString())
    if (locale === 'en') params.delete('lang')
    else params.set('lang', locale)
    const query = params.toString()
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname))
  }

  return (
    <div className="studio-language-switcher" aria-label="Language">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending}
          aria-current={locale === active ? 'page' : undefined}
          aria-label={`Switch language to ${locale}`}
          onClick={() => changeLocale(locale)}
        >
          {LABEL[locale]}
        </button>
      ))}
    </div>
  )
}
