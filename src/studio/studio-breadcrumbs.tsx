'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function StudioBreadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const locale = useStudioLocale()
  const c = studioCopy(locale)
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
    <nav aria-label={c.breadcrumbs.label} className="studio-breadcrumbs">
      <Link className="studio-breadcrumb-home" href={marketingHref(locale)} aria-label={c.breadcrumbs.home} title={c.breadcrumbs.home}>
        <Home size={14} aria-hidden />
      </Link>
      <span aria-hidden="true"> / </span>
      <Link href={studioHref('', locale)}>{c.breadcrumbs.studio}</Link>
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
