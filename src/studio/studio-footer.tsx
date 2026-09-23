'use client'

import Link from 'next/link'

import { QdipLogo } from '@/components/marketing/qdip-logo'
import { marketingHref } from '@/lib/platform-urls'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function StudioFooter() {
  const locale = useStudioLocale()
  const root = marketingHref(locale)
  const common = studioCopy(locale)

  return (
    <footer className="studio-site-footer" data-testid="studio-footer">
      <div className="studio-site-footer-inner">
        <Link className="studio-site-footer-brand" href={root} aria-label={common.breadcrumbs.home}>
          <QdipLogo />
        </Link>
        <span className="studio-site-footer-copyright">© {new Date().getFullYear()} QDIP</span>
      </div>
    </footer>
  )
}
