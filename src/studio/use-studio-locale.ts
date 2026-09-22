'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { studioLocaleFromPath, type StudioLocale } from './studio-locale'

function localeFromBrowserPath(fallbackPathname: string, searchLocale: string | null): StudioLocale {
  if (typeof window === 'undefined') return studioLocaleFromPath(fallbackPathname, searchLocale)
  return studioLocaleFromPath(window.location.pathname, searchLocale)
}

export function useStudioLocale() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchLocale = searchParams.get('lang')
  const [locale, setLocale] = useState<StudioLocale>(() => studioLocaleFromPath(pathname, searchLocale))

  useEffect(() => {
    setLocale(localeFromBrowserPath(pathname, searchLocale))
  }, [pathname, searchLocale])

  return locale
}
