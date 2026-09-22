import { Suspense, type ReactNode } from 'react'
import '@/studio/studio.css'
import '@/studio/studio-finish.css'
import { DesignSystemProvider, ProductHeader } from '@/design-system'
import { StudioNav } from '@/features/studio'
import { StudioFooter } from '@/studio/studio-footer'
import { StudioCoreStatus, StudioProductHeader } from '@/studio/studio-product-header'
import { StudioMobileNavigation } from '@/studio/studio-mobile-navigation'
import { marketingHref, studioHref } from '@/lib/platform-urls'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

const coreStatus = <StudioCoreStatus />

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <DesignSystemProvider theme="green" mode="light" className="studio-shell">
      <Suspense
        fallback={
          <ProductHeader
            href={studioHref('', 'en')}
            brandHref={marketingHref('en')}
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

      <aside className="studio-sidebar" aria-label="Studio workspace navigation">
        <div className="studio-sidebar-intro">
          <small>DECISION WORKSPACE</small>
          <h2>Model · connect · validate</h2>
          <p>Configure the decision model and its evidence contracts.</p>
        </div>
        <Suspense fallback={null}><StudioNav /></Suspense>
      </aside>

      <div className="studio-workspace">
        <main className="studio-main ds-page" id="main-content" tabIndex={-1}>{children}</main>
      </div>

      <Suspense fallback={null}><StudioFooter /></Suspense>
    </DesignSystemProvider>
  )
}
