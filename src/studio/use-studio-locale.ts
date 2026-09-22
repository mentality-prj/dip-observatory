'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { STUDIO_LOCALES, studioLocaleFromPath, type StudioLocale } from './studio-locale'

function browserLocale(fallbackPathname: string, searchLocale: string | null): StudioLocale {
  if (typeof window === 'undefined') return studioLocaleFromPath(fallbackPathname, searchLocale)

  const first = window.location.pathname.split('/').filter(Boolean)[0]
  if (STUDIO_LOCALES.includes(first as StudioLocale)) return first as StudioLocale

  const cookieLocale = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('qdip-studio-locale='))
    ?.split('=')[1]

  return studioLocaleFromPath(fallbackPathname, cookieLocale ?? searchLocale)
}

export function useStudioLocale() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchLocale = searchParams.get('lang')
  const [locale, setLocale] = useState<StudioLocale>(() => studioLocaleFromPath(pathname, searchLocale))

  useEffect(() => {
    setLocale(browserLocale(pathname, searchLocale))
  }, [pathname, searchLocale])

  return locale
}
