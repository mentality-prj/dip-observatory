'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { ChevronRight, FlaskConical, Globe2, Home, Menu, Network, Scale, SlidersHorizontal, UsersRound } from 'lucide-react'
import { ProductShell, type DesignTheme } from '@/design-system'
import { buildLocalePath, type Locale } from '@/lib/observatory-i18n'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { observatoryI18n, sharedI18n } from '@/lib/product-i18n'
import { observableUseCases, type UseCaseTheme } from '@/use-cases/registry'
import { ObservatoryFooter } from './observatory-footer'
import styles from './prototype-shell.module.css'

export type PrototypeTheme = UseCaseTheme
type PrototypeShellProps = { locale: Locale; children: React.ReactNode; theme?: PrototypeTheme }
const LOCALES: Locale[] = ['en', 'uk', 'pl']
const LABEL: Record<Locale, string> = { en: 'EN', pl: 'PL', uk: 'UA' }
const CHALLENGE_LABEL: Record<Locale, string> = {
  en: 'Decision Challenge',
  uk: 'Виклик рішень',
  pl: 'Wyzwanie decyzyjne',
}
const NAV_ICONS = {
  challenge: Scale,
  'resource-allocation': UsersRound,
  'supply-network-optimization': Network,
  'gtm-lab': FlaskConical,
} as const

const STUDIO_LABEL: Record<Locale, string> = {
  en: 'Open Studio',
  uk: 'Відкрити Studio',
  pl: 'Otwórz Studio',
}

export function PrototypeShell({ locale, children, theme = 'cyan' }: PrototypeShellProps) {
  const pathname = usePathname()
  const activeNavRef = useRef<HTMLAnchorElement>(null)
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), '') || '/'
  const navItems = observableUseCases()
  const a11y = sharedI18n[locale]
  const observatory = observatoryI18n[locale]
  const isActive = (href: string) => normalizedPath === href || normalizedPath.startsWith(`${href}/`)
  const activeItem = navItems.find((item) => isActive(item.route))
  const challengeActive = isActive('/challenges')

  useEffect(() => activeNavRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' }), [normalizedPath])

  const localeHref = (next: Locale) => buildLocalePath(normalizedPath, next)

  const nav = (
    <nav className={styles.navigation} aria-label={observatory.applications}>
      <a
        ref={challengeActive ? activeNavRef : undefined}
        href={buildLocalePath('/challenges', locale)}
        aria-current={challengeActive ? 'page' : undefined}
        className={styles.navLink}
      >
        <Scale className={styles.navIcon} aria-hidden />
        <span>{CHALLENGE_LABEL[locale]}</span>
      </a>
      {navItems.map((item) => {
        const active = isActive(item.route)
        const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS]
        return (
          <a
            ref={active ? activeNavRef : undefined}
            key={item.id}
            href={buildLocalePath(item.route, locale)}
            aria-current={active ? 'page' : undefined}
            className={styles.navLink}
          >
            {Icon ? <Icon className={styles.navIcon} aria-hidden /> : null}
            <span>{item.title[locale]}</span>
          </a>
        )
      })}
    </nav>
  )

  const utilities = (
    <div className={styles.localeControls}>
      <div className={styles.locale} aria-label={a11y.language}>
        {LOCALES.map((option) => (
          <a
            key={option}
            href={localeHref(option)}
            aria-current={option === locale ? 'page' : undefined}
            data-locale={option}
          >
            {LABEL[option]}
          </a>
        ))}
      </div>
      <label className={styles.localeSelect}>
        <Globe2 aria-hidden />
        <span className="sr-only">{a11y.language}</span>
        <select
          value={locale}
          onChange={(event) => {
            const next = event.target.value as Locale
            if (next !== locale) window.location.assign(localeHref(next))
          }}
        >
          {LOCALES.map((option) => (
            <option key={option} value={option}>
              {LABEL[option]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )

  return (
    <ProductShell
      theme={theme as DesignTheme}
      className={styles.shell}
      href={buildLocalePath('/', locale)}
      brandHref={marketingHref(locale)}
      product="Observatory"
      nativeProductNavigation
      navigation={<div className={styles.desktopNavigation}>{nav}</div>}
      mobileNavigation={
        <details className={styles.mobileMenu}>
          <summary>
            <Menu aria-hidden /> <span>{observatory.mobileApplications}</span>
          </summary>
          <div className={styles.mobileNavigation}>
            {nav}
            <Link className={styles.mobileProductLink} href={studioHref('', locale)}>
              <SlidersHorizontal size={15} aria-hidden />
              {STUDIO_LABEL[locale]}
            </Link>
          </div>
        </details>
      }
      productSwitch={{
        href: studioHref('', locale),
        label: STUDIO_LABEL[locale],
        icon: <SlidersHorizontal size={15} />,
      }}
      utilities={utilities}
    >
      <div className={styles.stage}>
        <div className={styles.breadcrumb} aria-label={a11y.breadcrumb}>
          <Link className={styles.breadcrumbHome} href={marketingHref(locale)} aria-label={a11y.home}>
            <Home />
          </Link>
          <ChevronRight />
          <span>{challengeActive ? CHALLENGE_LABEL[locale] : (activeItem?.title[locale] ?? 'Observatory')}</span>
        </div>
        <div className={styles.content} id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
      <ObservatoryFooter locale={locale} />
    </ProductShell>
  )
}
