import Link from 'next/link'

import { marketingHref } from '@/lib/platform-urls'
import { footerI18n, sharedI18n } from '@/lib/product-i18n'
import type { MarketingLocale } from '@/components/marketing/qdip-copy'
import { QdipLogo } from '@/components/marketing/qdip-logo'
import styles from './qdip-footer.module.css'

export type QdipFooterVariant = 'marketing' | 'observatory'

const path = (locale: MarketingLocale, slug: string) => `${marketingHref(locale)}/${slug}`

export function QdipFooter({
  locale,
  variant = 'marketing',
  showNavigation = true,
  testId,
  className,
}: {
  locale: MarketingLocale
  variant?: QdipFooterVariant
  showNavigation?: boolean
  testId?: string
  className?: string
}) {
  const c = footerI18n[locale]
  const a11y = sharedI18n[locale]

  return (
    <footer className={`${styles.footer}${className ? ` ${className}` : ``}`} data-variant={variant} data-testid={testId}>
      <div className={styles.inner}>
        <Link className={styles.brand} data-footer-brand href={marketingHref(locale)} aria-label={a11y.home}>
          <QdipLogo inverse />
        </Link>

        {showNavigation ? (
          <nav className={styles.navigation} aria-label={a11y.footerNavigation}>
            <Link href={path(locale, 'how-it-works')}>{c.how}</Link>
            <Link href={path(locale, 'use-cases')}>{c.useCases}</Link>
            <Link href={path(locale, 'core')}>{c.core}</Link>
            <Link href={path(locale, 'core/research')}>{c.research}</Link>
          </nav>
        ) : null}

        <div className={styles.meta}>
          <span className={styles.copyright} data-footer-copyright>© {new Date().getFullYear()} QDIP</span>
          <span className={styles.disclaimer}>{c.disclaimer}</span>
        </div>
      </div>
    </footer>
  )
}
