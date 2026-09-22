import Link from 'next/link'
import { sharedI18n } from '@/lib/product-i18n'
import { marketingLocales, type MarketingLocale } from './qdip-copy'
import styles from './language-switcher.module.css'

const labels: Record<MarketingLocale, string> = { en: 'EN', uk: 'UA', pl: 'PL' }

type LanguageSwitcherProps = {
  locale: MarketingLocale
  hrefForLocale: (locale: MarketingLocale) => string
}

export function LanguageSwitcher({ locale, hrefForLocale }: LanguageSwitcherProps) {
  const a11y = sharedI18n[locale]
  return (
    <div className={styles.wrapper}>
      <nav aria-label={a11y.language} className={styles.root}>
        {marketingLocales.map((targetLocale) => (
          <Link
            aria-current={locale === targetLocale ? 'page' : undefined}
            href={hrefForLocale(targetLocale)}
            key={targetLocale}
          >
            {labels[targetLocale]}
          </Link>
        ))}
      </nav>
      <details className={styles.mobile}>
        <summary aria-label={a11y.language}>{labels[locale]}</summary>
        <div>
          {marketingLocales.map((targetLocale) => (
            <Link
              aria-current={locale === targetLocale ? 'page' : undefined}
              href={hrefForLocale(targetLocale)}
              key={targetLocale}
            >
              {labels[targetLocale]}
            </Link>
          ))}
        </div>
      </details>
    </div>
  )
}
