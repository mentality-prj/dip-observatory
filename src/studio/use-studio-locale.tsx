'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { STUDIO_LOCALES, parseStudioLocale, type StudioLocale } from './studio-locale'

const StudioLocaleContext = createContext<StudioLocale>('en')

function routeLocale(pathname: string, searchLocale: string | null): StudioLocale | null {
  if (STUDIO_LOCALES.includes(searchLocale as StudioLocale)) return parseStudioLocale(searchLocale)

  const first = pathname.split('/').filter(Boolean)[0]
  if (STUDIO_LOCALES.includes(first as StudioLocale)) return parseStudioLocale(first)

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
  const locale = routeLocale(pathname, searchParams.get('lang')) ?? initialLocale

  return <StudioLocaleContext.Provider value={locale}>{children}</StudioLocaleContext.Provider>
}

export function useStudioLocale() {
  return useContext(StudioLocaleContext)
}
