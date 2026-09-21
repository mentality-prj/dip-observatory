import { Suspense, type ReactNode } from 'react'
import '@/studio/studio.css'
import '@/studio/studio-finish.css'
import { DesignSystemProvider, ProductHeader, StatusBadge } from '@/design-system'
import { StudioNav } from '@/features/studio'
import { StudioLanguageSwitcher } from '@/studio/studio-language-switcher'
import { marketingHref, observatoryHref, studioHref } from '@/lib/platform-urls'

export const metadata = {
  title: 'QDIP Studio',
  description: 'Configure, validate and evaluate decision systems with QDIP.',
}

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <DesignSystemProvider theme="green" mode="light" className="studio-shell">
      <ProductHeader
        href={studioHref()}
        brandHref={marketingHref('en')}
        product="Studio"
        navigation={
          <StatusBadge>
            <i /> Core connected
          </StatusBadge>
        }
        productSwitch={{ href: observatoryHref(), label: 'Open Observatory' }}
        utilities={
          <Suspense fallback={<div className="studio-language-switcher" aria-hidden><span>EN</span><span>UA</span><span>PL</span></div>}>
            <StudioLanguageSwitcher />
          </Suspense>
        }
      />
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
        <main className="studio-main ds-page" id="main-content" tabIndex={-1}>{children}</main>
      </div>
    </DesignSystemProvider>
  )
}
