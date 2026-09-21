import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResourceAllocationWorkspace } from '@/features/resource-allocation'
import { isSupportedLocale, type Locale } from '@/lib/observatory-i18n'

const seo: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'Resource Allocation Decision Demo — QDIP Observatory',
    description:
      'Explore how QDIP evaluates needs, team capacity, priorities and operational constraints to recommend a five-day resource-allocation plan with visible evidence and alternatives.',
  },
  uk: {
    title: 'Демо розподілу ресурсів — QDIP Observatory',
    description:
      'Подивіться, як QDIP оцінює потреби, доступність команд, пріоритети та операційні обмеження і рекомендує п’ятиденний план розподілу ресурсів з видимим обґрунтуванням та альтернативами.',
  },
  pl: {
    title: 'Demo alokacji zasobów — QDIP Observatory',
    description:
      'Zobacz, jak QDIP ocenia potrzeby, zdolność zespołów, priorytety i ograniczenia operacyjne oraz rekomenduje pięciodniowy plan alokacji zasobów z widocznym uzasadnieniem i alternatywami.',
  },
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isSupportedLocale(locale)) return {}
  const value = seo[locale]
  const canonical = `https://observatory.qdip.ai/${locale}/resource-allocation`
  return {
    title: { absolute: value.title },
    description: value.description,
    alternates: {
      canonical,
      languages: {
        en: 'https://observatory.qdip.ai/en/resource-allocation',
        uk: 'https://observatory.qdip.ai/uk/resource-allocation',
        pl: 'https://observatory.qdip.ai/pl/resource-allocation',
      },
    },
    openGraph: {
      title: value.title,
      description: value.description,
      url: canonical,
      siteName: 'QDIP Observatory',
      type: 'website',
    },
  }
}

export default async function ResourceAllocationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isSupportedLocale(locale)) notFound()
  return <ResourceAllocationWorkspace locale={locale} />
}
