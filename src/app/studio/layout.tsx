import type { ReactNode } from 'react'
import '@/studio/studio.css'
import { DesignSystemProvider, ProductHeader, StatusBadge } from '@/design-system'
import { StudioNav } from '@/features/studio'
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
        productSwitch={{ href: observatoryHref('en'), label: 'Open Observatory' }}
        status={
          <StatusBadge>
            <i /> Core connected
          </StatusBadge>
        }
        utilities={
          <nav className="studio-language-switcher" aria-label="Language">
            <a href="/en" aria-current="page">EN</a>
            <a href="/uk">UA</a>
            <a href="/pl">PL</a>
          </nav>
        }
      />
      <aside className="studio-sidebar" aria-label="Studio workspace navigation">
        <div className="studio-sidebar-intro">
          <small>DECISION WORKSPACE</small>
          <h2>Build decision systems</h2>
          <p>
            Configure reusable decision profiles, connect evidence sources and validate contracts before evaluation.
          </p>
        </div>
        <StudioNav />
        <div className="studio-sidebar-footer">
          <span>QDIP Studio</span>
          <small>Configuration · validation · evaluation</small>
        </div>
      </aside>
      <div className="studio-workspace">
        <main className="studio-main ds-page" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </DesignSystemProvider>
  )
}
