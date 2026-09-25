import Link from 'next/link'
import type { ReactNode } from 'react'

import { createTranslator } from '@/i18n/runtime'
import { marketingHref } from '@/lib/platform-urls'
import type { Locale } from '@/lib/observatory-i18n'
import { QdipLogo } from '@/components/marketing/qdip-logo'
import styles from './qdip-footer.module.css'

export type QdipFooterVariant = 'marketing' | 'observatory'

const path = (locale: Locale, slug: string) => `${marketingHref(locale)}/${slug}`

function FooterLink({
  href,
  children,
  className,
  ariaLabel,
  native,
  dataFooterBrand = false,
}: {
  href: string
  children: ReactNode
  className?: string
  ariaLabel?: string
  native: boolean
  dataFooterBrand?: boolean
}) {
  const brandAttribute = dataFooterBrand ? '' : undefined
  return native ? (
    <a className={className} href={href} aria-label={ariaLabel} data-footer-brand={brandAttribute}>
      {children}
    </a>
  ) : (
    <Link className={className} href={href} aria-label={ariaLabel} data-footer-brand={brandAttribute}>
      {children}
    </Link>
  )
}

export function QdipFooter({
  locale,
  variant = 'marketing',
  showNavigation = true,
  testId,
  className,
}: {
  locale: Locale
  variant?: QdipFooterVariant
  showNavigation?: boolean
  testId?: string
  className?: string
}) {
  const copy = createTranslator(locale, 'footer')
  const shared = createTranslator(locale, 'shared')
  const native = variant === 'observatory'

  return (
    <footer
      className={`${styles.footer}${className ? ` ${className}` : ''}`}
      data-variant={variant}
      data-testid={testId}
    >
      <div className={styles.inner}>
        <FooterLink
          className={styles.brand}
          href={marketingHref(locale)}
          ariaLabel={shared('home')}
          native={native}
          dataFooterBrand
        >
          <QdipLogo inverse />
        </FooterLink>

        {showNavigation ? (
          <nav className={styles.navigation} aria-label={shared('footerNavigation')}>
            <FooterLink href={path(locale, 'how-it-works')} native={native}>
              {copy('how')}
            </FooterLink>
            <FooterLink href={path(locale, 'use-cases')} native={native}>
              {copy('useCases')}
            </FooterLink>
            <FooterLink href={path(locale, 'core')} native={native}>
              {copy('core')}
            </FooterLink>
            <FooterLink href={path(locale, 'core/research')} native={native}>
              {copy('research')}
            </FooterLink>
          </nav>
        ) : null}

        <div className={styles.meta}>
          <span className={styles.copyright} data-footer-copyright>
            © {new Date().getFullYear()} QDIP
          </span>
          <span className={styles.disclaimer}>{copy('disclaimer')}</span>
        </div>
      </div>
    </footer>
  )
}
