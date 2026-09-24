import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PrototypeShell } from '@/components/observatory/prototype-shell'
import { isSupportedLocale, SUPPORTED_LOCALES } from '@/lib/observatory-i18n'
import { ApplicationFrontend } from '@/use-cases/application-runtime'
import { DIP_USE_CASES, findUseCaseByRoute, type UseCaseId } from '@/use-cases/registry'

type UseCasePageParams = {
  locale: string
  useCase: string
}

function resolveUseCase(routeSegment: string) {
  return findUseCaseByRoute(`/${routeSegment}`)
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    DIP_USE_CASES.map((application) => ({
      locale,
      useCase: application.route.replace(/^\//, ''),
    }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<UseCasePageParams>
}): Promise<Metadata> {
  const { locale, useCase: routeSegment } = await params
  if (!isSupportedLocale(locale)) return {}

  const application = resolveUseCase(routeSegment)
  if (!application) return {}

  const title = `${application.title[locale]} — QDIP Observatory`
  const description = application.description[locale]
  const route = application.route
  const canonical = `https://observatory.qdip.ai/${locale}${route}`

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map((supportedLocale) => [
          supportedLocale,
          `https://observatory.qdip.ai/${supportedLocale}${route}`,
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'QDIP Observatory',
      type: 'website',
    },
  }
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<UseCasePageParams>
}) {
  const { locale, useCase: routeSegment } = await params
  if (!isSupportedLocale(locale)) notFound()
  const application = resolveUseCase(routeSegment)
  if (!application) notFound()

  return (
    <PrototypeShell locale={locale} theme={application.presentation.theme}>
      <ApplicationFrontend id={application.id as UseCaseId} locale={locale} />
    </PrototypeShell>
  )
}
