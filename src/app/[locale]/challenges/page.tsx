import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PrototypeShell } from '@/components/observatory/prototype-shell'
import { DecisionChallengeWorkspace } from '@/features/decision-challenge'
import { decisionChallengeMetadataI18n } from '@/features/decision-challenge/i18n'
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
  const metadata = decisionChallengeMetadataI18n[locale]
  return {
    title: { absolute: metadata.title },
    description: metadata.description,
  }
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
