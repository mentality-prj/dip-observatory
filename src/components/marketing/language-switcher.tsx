import Link from 'next/link'
import { marketingLocales, type MarketingLocale } from './qdip-copy'
import styles from './language-switcher.module.css'

const labels: Record<MarketingLocale, string> = { en: 'EN', uk: 'UA', pl: 'PL' }

type LanguageSwitcherProps = {
  locale: MarketingLocale
  hrefForLocale: (locale: MarketingLocale) => string
}

export function LanguageSwitcher({ locale, hrefForLocale }: LanguageSwitcherProps) {
  return (
    <div className={styles.wrapper}>
      <nav aria-label="Language" className={styles.root}>
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
        <summary aria-label="Language">{labels[locale]}</summary>
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
