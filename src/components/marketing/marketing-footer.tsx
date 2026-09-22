import Link from 'next/link'
import { marketingLocaleHref } from '@/lib/platform-urls'
import { sharedI18n } from '@/lib/product-i18n'
import { marketingCopy, type MarketingLocale } from './qdip-copy'
import { QdipLogo } from './qdip-logo'
import shellStyles from './marketing-shell.module.css'

const path = (locale: MarketingLocale, slug: string) => `${marketingLocaleHref(locale)}/${slug}`

export function MarketingFooter({ locale }: { locale: MarketingLocale }) {
  const c = marketingCopy[locale]
  const a11y = sharedI18n[locale]
  const research = locale === 'en' ? 'Research' : locale === 'uk' ? 'Дослідження' : 'Badania'

  return (
    <footer className={shellStyles.footer}>
      <Link className={shellStyles.footerBrand} href={marketingLocaleHref(locale)} aria-label={a11y.home}>
        <QdipLogo inverse />
      </Link>
      <nav aria-label={a11y.footerNavigation}>
        <Link href={path(locale, 'how-it-works')}>{c.nav[0]}</Link>
        <Link href={path(locale, 'use-cases')}>{c.nav[1]}</Link>
        <Link href={path(locale, 'core')}>QDIP Core</Link>
        <Link href={path(locale, 'core/research')}>{research}</Link>
      </nav>
      <span className={shellStyles.copyright}>© {new Date().getFullYear()} QDIP</span>
    </footer>
  )
}
