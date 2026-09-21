'use client'

import { Menu } from 'lucide-react'
import { StudioNav } from './studio-nav'

export function StudioMobileNavigation() {
  return (
    <details className="studio-mobile-navigation">
      <summary>
        <Menu size={16} aria-hidden />
        <span>Workspace</span>
      </summary>
      <div className="studio-mobile-navigation-sheet">
        <StudioNav />
      </div>
    </details>
  )
}
