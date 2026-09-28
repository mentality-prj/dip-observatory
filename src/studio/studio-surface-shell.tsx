import { Suspense, type ReactNode } from 'react'
import { DesignSystemProvider, ProductHeader } from '@/design-system'
import { marketingHref, studioSurfaceHref } from '@/lib/platform-urls'
import { StudioCoreStatus, StudioProductHeader } from './studio-product-header'
import { StudioFooter } from './studio-footer'
import { StudioMobileNavigation } from './studio-mobile-navigation'
import { StudioNav } from './studio-nav'
import { StudioLocaleProvider } from './use-studio-locale'
import { studioCopy } from './studio-copy'
import type { StudioLocale } from './studio-locale'

export function StudioSurfaceShell({
  locale,
  route,
  children,
}: {
  locale: StudioLocale
  route: string
  children: ReactNode
}) {
  const c = studioCopy(locale)
  const coreStatus = <StudioCoreStatus />

  return (
    <StudioLocaleProvider initialLocale={locale} initialRoute={route}>
      <DesignSystemProvider theme="green" mode="light" className="studio-shell">
        <Suspense
          fallback={
            <ProductHeader
              href={studioSurfaceHref('', locale)}
              brandHref={marketingHref(locale)}
              product="Studio"
              brandStatus={coreStatus}
              nativeNavigation
              utilities={
                <div className="studio-language-switcher" aria-hidden>
                  <span>EN</span>
                  <span>UA</span>
                  <span>PL</span>
                </div>
              }
            />
          }
        >
          <StudioProductHeader />
        </Suspense>

        <div className="studio-mobile-nav-wrap">
          <Suspense fallback={null}>
            <StudioMobileNavigation />
          </Suspense>
        </div>

        <aside className="studio-sidebar" aria-label={c.nav.workspace}>
          <div className="studio-sidebar-intro">
            <small>{c.nav.decisionWorkspace}</small>
            <h2>{c.shell.motto}</h2>
            <p>{c.decisionStudio.descriptions.profiles}</p>
          </div>
          <Suspense fallback={null}>
            <StudioNav />
          </Suspense>
        </aside>

        <div className="studio-workspace">
          <main className="studio-main ds-page" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>

        <Suspense fallback={null}>
          <StudioFooter />
        </Suspense>
      </DesignSystemProvider>
    </StudioLocaleProvider>
  )
}
