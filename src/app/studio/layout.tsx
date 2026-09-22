import { Suspense, type ReactNode } from 'react'
import { headers } from 'next/headers'
import '@/studio/studio.css'
import '@/studio/studio-finish.css'
import '@/studio/studio-mobile-status.css'
import { DesignSystemProvider, ProductHeader } from '@/design-system'
import { StudioNav } from '@/features/studio'
import { StudioFooter } from '@/studio/studio-footer'
import { parseStudioLocale } from '@/studio/studio-locale'
import { studioCopy } from '@/studio/studio-copy'
import { StudioCoreStatus, StudioProductHeader } from '@/studio/studio-product-header'
import { StudioMobileNavigation } from '@/studio/studio-mobile-navigation'
import { StudioLocaleProvider } from '@/studio/use-studio-locale'
import { marketingHref, studioHref } from '@/lib/platform-urls'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

const coreStatus = <StudioCoreStatus />

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const locale = parseStudioLocale(requestHeaders.get('x-qdip-studio-locale'))
  const c = studioCopy(locale)

  return (
    <StudioLocaleProvider initialLocale={locale}>
      <DesignSystemProvider theme="green" mode="light" className="studio-shell">
        <Suspense
          fallback={
            <ProductHeader
              className="studio-product-header"
              href={studioHref('', locale)}
              brandHref={marketingHref(locale)}
              product="Studio"
              brandStatus={coreStatus}
              utilities={
                <div className="studio-language-switcher" aria-hidden>
                  <span>EN</span><span>UA</span><span>PL</span>
                </div>
              }
            />
          }
        >
          <StudioProductHeader />
        </Suspense>

        <div className="studio-mobile-nav-wrap">
          <Suspense fallback={null}><StudioMobileNavigation /></Suspense>
        </div>

        <aside className="studio-sidebar" aria-label={c.nav.workspace}>
          <div className="studio-sidebar-intro">
            <small>{c.nav.decisionWorkspace}</small>
            <h2>{c.shell.motto}</h2>
            <p>{c.decisionStudio.descriptions.profiles}</p>
          </div>
          <Suspense fallback={null}><StudioNav /></Suspense>
        </aside>

        <div className="studio-workspace">
          <main className="studio-main ds-page" id="main-content" tabIndex={-1}>{children}</main>
        </div>

        <Suspense fallback={null}><StudioFooter /></Suspense>
      </DesignSystemProvider>
    </StudioLocaleProvider>
  )
}
