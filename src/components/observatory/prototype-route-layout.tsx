import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'

import { PrototypeShell, type PrototypeTheme } from './prototype-shell'
import { isSupportedLocale } from '@/lib/observatory-i18n'

type PrototypeRouteLayoutProps = {
  children: ReactNode
  params: Promise<{ locale: string }>
  theme: PrototypeTheme
  activeRoute: string
}

export async function PrototypeRouteLayout({ children, params, theme, activeRoute }: PrototypeRouteLayoutProps) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  return (
    <PrototypeShell locale={locale} activeRoute={activeRoute} theme={theme}>
      {children}
    </PrototypeShell>
  )
}
