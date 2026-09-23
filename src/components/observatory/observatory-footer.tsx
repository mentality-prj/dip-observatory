import Link from 'next/link'

import { ProductLockup } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { sharedI18n } from '@/lib/product-i18n'
import { observableUseCases } from '@/use-cases/registry'
import styles from './observatory-footer.module.css'

const copy = {
  en: {
    applications: 'Decision applications',
    product: 'QDIP platform',
    overview: 'Observatory overview',
    studio: 'Open Studio',
    how: 'How it works',
    core: 'QDIP Core',
    research: 'Research',
    note: 'Inspect recommendations, alternatives, evidence and decision history.',
  },
  uk: {
    applications: 'Застосунки для прийняття рішень',
    product: 'Платформа QDIP',
    overview: 'Огляд Observatory',
    studio: 'Відкрити Studio',
    how: 'Як це працює',
    core: 'QDIP Core',
    research: 'Дослідження',
    note: 'Перевіряйте рекомендації, альтернативи, докази та історію рішень.',
  },
  pl: {
    applications: 'Aplikacje decyzyjne',
    product: 'Platforma QDIP',
    overview: 'Przegląd Observatory',
    studio: 'Otwórz Studio',
    how: 'Jak to działa',
    core: 'QDIP Core',
    research: 'Badania',
    note: 'Weryfikuj rekomendacje, alternatywy, dowody i historię decyzji.',
  },
} as const

function marketingPath(locale: Locale, path: string) {
  return `${marketingHref(locale)}/${path}`
}

export function ObservatoryFooter({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const a11y = sharedI18n[locale]
  const applications = observableUseCases()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <ProductLockup
            href={`/${locale}`}
            brandHref={marketingHref(locale)}
            product="Observatory"
            className={styles.lockup}
          />
          <p>{t.note}</p>
        </div>

        <div className={styles.links}>
          <nav aria-label={t.applications}>
            <span className={styles.label}>{t.applications}</span>
            <Link href={`/${locale}`}>{t.overview}</Link>
            {applications.map((application) => (
              <Link key={application.id} href={`/${locale}${application.route}`}>
                {application.title[locale]}
              </Link>
            ))}
          </nav>

          <nav aria-label={t.product}>
            <span className={styles.label}>{t.product}</span>
            <Link href={studioHref('', locale)}>{t.studio}</Link>
            <Link href={marketingPath(locale, 'how-it-works')}>{t.how}</Link>
            <Link href={marketingPath(locale, 'core')}>{t.core}</Link>
            <Link href={marketingPath(locale, 'core/research')}>{t.research}</Link>
          </nav>
        </div>
      </div>

      <div className={styles.meta}>
        <span>© {new Date().getFullYear()} QDIP</span>
        <Link href={marketingHref(locale)} aria-label={a11y.home}>
          qdip.ai
        </Link>
      </div>
    </footer>
  )
}
