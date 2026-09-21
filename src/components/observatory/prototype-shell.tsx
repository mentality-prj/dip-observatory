'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { ProductShell, type DesignTheme } from '@/design-system'
import { buildLocalePath, type Locale } from '@/lib/observatory-i18n'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { observableUseCases, type UseCaseTheme } from '@/use-cases/registry'
import styles from './prototype-shell.module.css'

export type PrototypeTheme = UseCaseTheme
type PrototypeShellProps = { locale: Locale; children: React.ReactNode; theme?: PrototypeTheme }
const LOCALES: Locale[] = ['en', 'uk', 'pl']
const LABEL: Record<Locale, string> = { en: 'EN', pl: 'PL', uk: 'UA' }
const HOME_LABEL: Record<Locale, string> = {
  en: 'QDIP Home',
  uk: 'Головна QDIP',
  pl: 'Strona główna QDIP',
}
const STUDIO_LABEL: Record<Locale, string> = {
  en: 'Configure in Studio',
  uk: 'Налаштувати в Studio',
  pl: 'Konfiguruj w Studio',
}

export function PrototypeShell({ locale, children, theme = 'cyan' }: PrototypeShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const activeNavRef = useRef<HTMLAnchorElement>(null)
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/'
  const navItems = observableUseCases()
  const isActive = (href: string) => normalizedPath === href || normalizedPath.startsWith(`${href}/`)
  const activeItem = navItems.find((item) => isActive(item.route))
  useEffect(() => activeNavRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }), [normalizedPath])
  const changeLocale = (next: Locale) => {
    if (next !== locale) startTransition(() => router.replace(buildLocalePath(normalizedPath, next)))
  }
  const nav = (
    <nav className={styles.navigation} aria-label="Observatory applications">
      {navItems.map((item) => {
        const active = isActive(item.route)
        return (
          <Link
            ref={active ? activeNavRef : undefined}
            key={item.id}
            href={buildLocalePath(item.route, locale)}
            aria-current={active ? 'page' : undefined}
            className={styles.navLink}
          >
            {item.title[locale]}
          </Link>
        )
      })}
    </nav>
  )
  const utilities = (
    <div className={styles.locale} aria-label="Language">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          disabled={pending}
          onClick={() => changeLocale(option)}
          aria-current={option === locale ? 'page' : undefined}
        >
          {LABEL[option]}
        </button>
      ))}
    </div>
  )
  return (
    <ProductShell
      theme={theme as DesignTheme}
      className={styles.shell}
      href={buildLocalePath('/', locale)}
      product="Observatory"
      navigation={<div className={styles.desktopNavigation}>{nav}</div>}
      mobileNavigation={<div className={styles.mobileNavigation}>{nav}</div>}
      siteLink={{ href: marketingHref(locale), label: HOME_LABEL[locale] }}
      productSwitch={{ href: studioHref(), label: STUDIO_LABEL[locale] }}
      utilities={utilities}
    >
      <div className={styles.stage}>
        <div className={styles.breadcrumb} aria-label="Breadcrumb">
          <Home />
          <ChevronRight />
          <span>{activeItem?.title[locale] ?? 'Observatory'}</span>
        </div>
        <div className={styles.content} id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </ProductShell>
  )
}
