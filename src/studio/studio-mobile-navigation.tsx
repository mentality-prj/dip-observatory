'use client'

import { Menu } from 'lucide-react'
import { studioCopy } from './studio-copy'
import { StudioNav } from './studio-nav'
import { useStudioLocale } from './use-studio-locale'

export function StudioMobileNavigation() {
  const c = studioCopy(useStudioLocale())
  return (
    <details className="studio-mobile-navigation">
      <summary>
        <Menu size={16} aria-hidden />
        <span>{c.nav.workspace}</span>
      </summary>
      <div className="studio-mobile-navigation-sheet">
        <StudioNav />
      </div>
    </details>
  )
}
