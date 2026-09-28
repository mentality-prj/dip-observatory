'use client'

import { useEffect, useRef } from 'react'
import {
  ChevronRight,
  FileUp,
  FlaskConical,
  Globe2,
  Home,
  Menu,
  Network,
  Scale,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react'
import { ProductShell, type DesignTheme } from '@/design-system'
import { useTranslations } from '@/i18n/provider'
import { buildLocalePath, SUPPORTED_LOCALES, type Locale } from '@/lib/observatory-i18n'
import { marketingHref, studioHref } from '@/lib/platform-urls'
import { systemApplicationCopy } from '@/observatory/application-copy'
import { findObservatoryApplicationByRoute, observableApplications } from '@/observatory/applications'
import { type UseCaseTheme } from '@/use-cases/registry'
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
  scale: Scale,
  upload: FileUp,
  heart: UsersRound,
  network: Network,
  sparkles: FlaskConical,
} as const

export function PrototypeShell({ locale, children, activeRoute, theme = 'cyan' }: PrototypeShellProps) {
  const activeNavRef = useRef<HTMLAnchorElement>(null)
  const navItems = observableApplications()
  const shared = useTranslations('shared')
  const observatory = useTranslations('observatory')
  const caseT = useTranslations('useCases')
  const activeItem = findObservatoryApplicationByRoute(activeRoute)

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeRoute])

  const localeHref = (next: Locale) => buildLocalePath(activeRoute, next)
  const labelFor = (item: (typeof navItems)[number]) =>
    item.kind === 'use-case'
      ? caseT(`${item.useCaseId}.title`)
      : systemApplicationCopy(locale, item.id as 'decision-challenge' | 'decision-intake').title
  const activeLabel = activeItem ? labelFor(activeItem) : 'Observatory'

  const nav = (
    <nav className={styles.navigation} aria-label={observatory('applications')}>
      {navItems.map((item) => {
        const active = activeItem?.id === item.id
        const Icon = NAV_ICONS[item.icon]
        return (
          <a
            ref={active ? activeNavRef : undefined}
            key={item.id}
            href={buildLocalePath(item.route, locale)}
            aria-current={active ? 'page' : undefined}
            className={styles.navLink}
          >
            <Icon className={styles.navIcon} aria-hidden />
            <span>{labelFor(item)}</span>
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
