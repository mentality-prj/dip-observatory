'use client'

import { useEffect, useRef } from 'react'
import { ChevronRight, FlaskConical, Globe2, Home, Menu, Network, Scale, SlidersHorizontal, UsersRound } from 'lucide-react'
import { ProductShell, type DesignTheme } from '@/design-system'
import { useTranslations } from '@/i18n/provider'
import { buildLocalePath, SUPPORTED_LOCALES, type Locale } from '@/lib/observatory-i18n'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { observableUseCases, type UseCaseTheme } from '@/use-cases/registry'
import { ObservatoryFooter } from './observatory-footer'
import styles from './prototype-shell.module.css'

export type PrototypeTheme = UseCaseTheme
type PrototypeShellProps = {
  locale: Locale
  children: React.ReactNode
  activeRoute: string
  theme?: PrototypeTheme
}

const NAV_ICONS = {
  challenge: Scale,
  'resource-allocation': UsersRound,
  'supply-network-optimization': Network,
  'gtm-lab': FlaskConical,
} as const

export function PrototypeShell({
  locale,
  children,
  activeRoute,
  theme = 'cyan',
}: PrototypeShellProps) {
  const activeNavRef = useRef<HTMLAnchorElement>(null)
  const navItems = observableUseCases()
  const shared = useTranslations('shared')
  const observatory = useTranslations('observatory')
  const useCaseT = useTranslations('useCases')
  const isActive = (href: string) =>
    activeRoute === href || activeRoute.startsWith(`${href}/`)
  const activeItem = navItems.find((item) => isActive(item.route))
  const challengeActive = isActive('/challenges')

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeRoute])

  const localeHref = (next: Locale) => buildLocalePath(activeRoute, next)
  const activeLabel = challengeActive
    ? observatory('challenge')
    : activeItem
      ? useCaseT(`${activeItem.id}.title`)
      : 'Observatory'

  const nav = (
    <nav className={styles.navigation} aria-label={observatory('applications')}>
      <a
        ref={challengeActive ? activeNavRef : undefined}
        href={buildLocalePath('/challenges', locale)}
        aria-current={challengeActive ? 'page' : undefined}
        className={styles.navLink}
      >
        <Scale className={styles.navIcon} aria-hidden />
        <span>{observatory('challenge')}</span>
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
            <span>{useCaseT(`${item.id}.title`)}</span>
          </a>
        )
      })}
    </nav>
  )

  const utilities = (
    <div className={styles.localeControls}>
      <div className={styles.locale} aria-label={shared('language')}>
        {SUPPORTED_LOCALES.map((option) => (
          <a
            key={option}
            href={localeHref(option)}
            aria-current={option === locale ? 'page' : undefined}
            data-locale={option}
          >
            {shared(`localeLabels.${option}`)}
          </a>
        ))}
      </div>
      <label className={styles.localeSelect}>
        <Globe2 aria-hidden />
        <span className="sr-only">{shared('language')}</span>
        <select
          value={locale}
          onChange={(event) => {
            const next = event.target.value as Locale
            if (next !== locale) window.location.assign(localeHref(next))
          }}
        >
          {SUPPORTED_LOCALES.map((option) => (
            <option key={option} value={option}>
              {shared(`localeLabels.${option}`)}
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
      nativeNavigation
      navigation={<div className={styles.desktopNavigation}>{nav}</div>}
      mobileNavigation={
        <details className={styles.mobileMenu}>
          <summary>
            <Menu aria-hidden /> <span>{observatory('mobileApplications')}</span>
          </summary>
          <div className={styles.mobileNavigation}>
            {nav}
            <a className={styles.mobileProductLink} href={studioHref('', locale)}>
              <SlidersHorizontal size={15} aria-hidden />
              {observatory('openStudio')}
            </a>
          </div>
        </details>
      }
      productSwitch={{
        href: studioHref('', locale),
        label: observatory('openStudio'),
        icon: <SlidersHorizontal size={15} />,
      }}
      utilities={utilities}
    >
      <div className={styles.stage}>
        <div className={styles.breadcrumb} aria-label={shared('breadcrumb')}>
          <a className={styles.breadcrumbHome} href={marketingHref(locale)} aria-label={shared('home')}>
            <Home />
          </a>
          <ChevronRight />
          <span>{activeLabel}</span>
        </div>
        <div className={styles.content} id="main-content" tabIndex={-1}>
          {children}
        </div>
      </div>
      <ObservatoryFooter locale={locale} />
    </ProductShell>
  )
}
