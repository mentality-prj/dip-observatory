'use client'

import { Home } from 'lucide-react'
import { isSupportedLocale } from '@/i18n/config'
import { marketingHref, studioSurfaceHref } from '@/lib/platform-urls'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function StudioBreadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const locale = useStudioLocale()
  const c = studioCopy(locale)

  const localizeHref = (href: string) => {
    if (href.startsWith('https://studio.qdip.ai')) {
      const target = new URL(href)
      const parts = target.pathname.split('/').filter(Boolean)
      if (parts[0] && isSupportedLocale(parts[0])) parts.shift()
      return studioSurfaceHref(parts.join('/'), locale)
    }

    if (href.startsWith('/studio')) {
      return studioSurfaceHref(href.replace(/^\/studio\/?/, ''), locale)
    }

    const parts = href.split('/').filter(Boolean)
    if (parts[0] && isSupportedLocale(parts[0])) {
      return studioSurfaceHref(parts.slice(1).join('/'), locale)
    }

    return href
  }

  return (
    <nav aria-label={c.breadcrumbs.label} className="studio-breadcrumbs">
      <a
        className="studio-breadcrumb-home"
        href={marketingHref(locale)}
        aria-label={c.breadcrumbs.home}
        title={c.breadcrumbs.home}
      >
        <Home size={14} aria-hidden />
      </a>
      <span aria-hidden="true"> / </span>
      <a href={studioSurfaceHref('', locale)}>{c.breadcrumbs.studio}</a>
      {items.map((item, index) => (
        <span key={index}>
          <span aria-hidden="true"> / </span>
          {item.href ? <a href={localizeHref(item.href)}>{item.label}</a> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
