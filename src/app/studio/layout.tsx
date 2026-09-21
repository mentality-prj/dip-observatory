import { Suspense, type ReactNode } from 'react'
import { Cable, Telescope } from 'lucide-react'
import '@/studio/studio.css'
import '@/studio/studio-finish.css'
import { DesignSystemProvider, ProductHeader, StatusBadge } from '@/design-system'
import { StudioNav } from '@/features/studio'
import { StudioProductHeader } from '@/studio/studio-product-header'
import { StudioMobileNavigation } from '@/studio/studio-mobile-navigation'
import { marketingHref, observatoryHref, studioHref } from '@/lib/platform-urls'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <DesignSystemProvider theme="green" mode="light" className="studio-shell">
      <Suspense
        fallback={
          <ProductHeader
            href={studioHref('', 'en')}
            brandHref={marketingHref('en')}
            product="Studio"
            navigation={
              <StatusBadge>
                <Cable size={13} aria-hidden />
                Core connected
              </StatusBadge>
            }
            productSwitch={{
              href: observatoryHref('', 'en'),
              label: 'Open Observatory',
              icon: <Telescope size={15} />,
            }}
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
        <Suspense fallback={null}>
          <StudioMobileNavigation />
        </Suspense>
      </div>

      <aside className="studio-sidebar" aria-label="Studio workspace navigation">
        <div className="studio-sidebar-intro">
          <small>DECISION WORKSPACE</small>
          <h2>Model · connect · validate</h2>
          <p>Configure the decision model and its evidence contracts.</p>
        </div>
        <Suspense fallback={null}>
          <StudioNav />
        </Suspense>
        <div className="studio-sidebar-footer">
          <span>QDIP Studio</span>
          <small>Decision system workspace</small>
        </div>
      </aside>

      <div className="studio-workspace">
        <main className="studio-main ds-page" id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="studio-footer">
          <span><strong>QDIP</strong> <b>Studio</b></span>
          <small>Decision intelligence workspace</small>
        </footer>
      </div>
    </DesignSystemProvider>
  )
}
