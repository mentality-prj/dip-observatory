import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PrototypeShell } from '@/components/observatory/prototype-shell'
import { DecisionIntakeWorkspace } from '@/features/decision-intake'
import { isSupportedLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/observatory-i18n'
import { systemApplicationCopy } from '@/observatory/application-copy'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) return {}
  const copy = systemApplicationCopy(locale as Locale, 'decision-intake')
  return { title: { absolute: `${copy.title} | QDIP Observatory` }, description: copy.description }
}

export default async function DecisionIntakePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  return (
    <PrototypeShell locale={locale as Locale} activeRoute="/decision-intake" theme="violet">
      <DecisionIntakeWorkspace locale={locale as Locale} />
    </PrototypeShell>
  )
}
