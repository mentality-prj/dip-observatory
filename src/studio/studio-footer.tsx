'use client'

import Link from 'next/link'
import { QdipLogo } from '@/components/marketing/qdip-logo'
import marketingStyles from '@/components/marketing/qdip-site.module.css'
import { marketingHref } from '@/lib/platform-urls'
import type { StudioLocale } from './studio-locale'
import { useStudioLocale } from './use-studio-locale'

const footerCopy: Record<StudioLocale, { how: string; cases: string; core: string; research: string; navLabel: string }> = {
  en: {
    how: 'How it works',
    cases: 'Use cases',
    core: 'QDIP Core',
    research: 'Research',
    navLabel: 'Footer navigation',
  },
  uk: {
    how: 'Як це працює',
    cases: 'Сценарії',
    core: 'QDIP Core',
    research: 'Дослідження',
    navLabel: 'Навігація у футері',
  },
  pl: {
    how: 'Jak to działa',
    cases: 'Przypadki użycia',
    core: 'QDIP Core',
    research: 'Badania',
    navLabel: 'Nawigacja stopki',
  },
}

export function StudioFooter() {
  const locale = useStudioLocale()
  const root = marketingHref(locale)
  const c = footerCopy[locale]

  return (
    <footer className={`${marketingStyles.footer} studio-site-footer`}>
      <Link href={root} aria-label="QDIP home"><QdipLogo /></Link>
      <nav aria-label={c.navLabel}>
        <Link href={`${root}/how-it-works`}>{c.how}</Link>
        <Link href={`${root}/use-cases`}>{c.cases}</Link>
        <Link href={`${root}/core`}>{c.core}</Link>
        <Link href={`${root}/core/research`}>{c.research}</Link>
      </nav>
      <span>© {new Date().getFullYear()} QDIP</span>
    </footer>
  )
}
