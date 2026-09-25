import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ObservatoryHome, PrototypeShell } from '@/features/observatory'
import { getLocaleMetadata, isSupportedLocale, type Locale } from '@/lib/observatory-i18n'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const resolvedLocale = isSupportedLocale(locale) ? locale : 'en'
  const metadata = getLocaleMetadata(resolvedLocale)
  return { ...metadata, title: { absolute: metadata.title } }
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  return (
    <PrototypeShell locale={locale as Locale}>
      <ObservatoryHome locale={locale as Locale} />
    </PrototypeShell>
  )
}
