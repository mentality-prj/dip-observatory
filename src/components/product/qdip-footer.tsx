import Link from 'next/link'

import { marketingHref } from '@/lib/platform-urls'
import { sharedI18n } from '@/lib/product-i18n'
import { marketingCopy, type MarketingLocale } from '@/components/marketing/qdip-copy'
import { QdipLogo } from '@/components/marketing/qdip-logo'
import styles from './qdip-footer.module.css'

export type QdipFooterVariant = 'marketing' | 'observatory'

const path = (locale: MarketingLocale, slug: string) => `${marketingHref(locale)}/${slug}`

export function QdipFooter({
  locale,
  variant = 'marketing',
  showNavigation = true,
  testId,
}: {
  locale: MarketingLocale
  variant?: QdipFooterVariant
  showNavigation?: boolean
  testId?: string
}) {
  const c = marketingCopy[locale]
  const a11y = sharedI18n[locale]
  const research = locale === 'en' ? 'Research' : locale === 'uk' ? 'Дослідження' : 'Badania'

  return (
    <footer className={styles.footer} data-variant={variant} data-testid={testId}>
      <div className={styles.inner}>
        <Link className={styles.brand} data-footer-brand href={marketingHref(locale)} aria-label={a11y.home}>
          <QdipLogo inverse />
        </Link>

        {showNavigation ? (
          <nav className={styles.navigation} aria-label={a11y.footerNavigation}>
            <Link href={path(locale, 'how-it-works')}>{c.nav[0]}</Link>
            <Link href={path(locale, 'use-cases')}>{c.nav[1]}</Link>
            <Link href={path(locale, 'core')}>QDIP Core</Link>
            <Link href={path(locale, 'core/research')}>{research}</Link>
          </nav>
        ) : null}

        <div className={styles.meta}>
          <span className={styles.copyright} data-footer-copyright>© {new Date().getFullYear()} QDIP</span>
          <span className={styles.disclaimer}>{c.hero[4]}</span>
        </div>
      </div>
    </footer>
  )
}
