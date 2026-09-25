import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PrototypeShell } from '@/components/observatory/prototype-shell'
import { DecisionChallengeWorkspace } from '@/features/decision-challenge'
import { isSupportedLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/observatory-i18n'

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) return {}
  const title =
    locale === 'uk'
      ? 'Decision Challenge — QDIP Observatory'
      : locale === 'pl'
        ? 'Decision Challenge — QDIP Observatory'
        : 'Decision Challenge — QDIP Observatory'
  const description =
    locale === 'uk'
      ? 'Прийміть власне рішення та порівняйте його з рекомендацією QDIP для тієї самої задачі.'
      : locale === 'pl'
        ? 'Podejmij własną decyzję i porównaj ją z rekomendacją QDIP dla tego samego problemu.'
        : 'Make your own decision and compare it with QDIP on the exact same decision problem.'
  return { title: { absolute: title }, description }
}

export default async function DecisionChallengePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  return (
    <PrototypeShell locale={locale as Locale} theme="cyan">
      <DecisionChallengeWorkspace locale={locale as Locale} />
    </PrototypeShell>
  )
}
