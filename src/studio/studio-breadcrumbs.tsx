'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { studioLocaleFromPath } from './studio-locale'

export function StudioBreadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))
  const localizeHref = (href: string) => {
    if (href.startsWith('https://studio.qdip.ai')) {
      const target = new URL(href)
      const section = target.pathname
        .split('/')
        .filter(Boolean)
        .filter((part) => !['en', 'uk', 'pl'].includes(part))
        .join('/')
      return studioHref(section, locale)
    }
    if (href.startsWith('/studio')) {
      return studioHref(href.replace(/^\/studio\/?/, ''), locale)
    }
    return href
  }

  return (
    <nav aria-label="Breadcrumb" className="studio-breadcrumbs">
      <Link className="studio-breadcrumb-home" href={marketingHref(locale)} aria-label="QDIP home" title="QDIP home">
        <Home size={14} aria-hidden />
      </Link>
      <span aria-hidden="true"> / </span>
      <Link href={studioHref('', locale)}>Decision Studio</Link>
      {items.map((item, index) => (
        <span key={index}>
          <span aria-hidden="true"> / </span>
          {item.href ? (
            <Link href={localizeHref(item.href)}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
