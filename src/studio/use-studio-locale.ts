'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { STUDIO_LOCALES, studioLocaleFromPath, type StudioLocale } from './studio-locale'

const StudioLocaleContext = createContext<StudioLocale>('en')

function explicitLocale(pathname: string, searchLocale: string | null): StudioLocale | null {
  const first = pathname.split('/').filter(Boolean)[0]
  if (STUDIO_LOCALES.includes(first as StudioLocale)) return first as StudioLocale
  if (STUDIO_LOCALES.includes(searchLocale as StudioLocale)) return searchLocale as StudioLocale
  return null
}

export function StudioLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: StudioLocale
  children: ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchLocale = searchParams.get('lang')
  const [locale, setLocale] = useState(initialLocale)

  useEffect(() => {
    const next = explicitLocale(pathname, searchLocale)
    if (next) setLocale(next)
  }, [pathname, searchLocale])

  return <StudioLocaleContext.Provider value={locale}>{children}</StudioLocaleContext.Provider>
}

export function useStudioLocale() {
  return useContext(StudioLocaleContext)
}

export function resolveStudioLocale(pathname: string, searchLocale?: string | null) {
  return studioLocaleFromPath(pathname, searchLocale)
}
