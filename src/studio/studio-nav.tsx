'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Boxes, Braces, GitBranch, SlidersHorizontal } from 'lucide-react'
import { studioHref } from '@/lib/platform-urls'
import { studioLocaleFromPath, studioSectionFromPath } from './studio-locale'

const items = [
  { section: 'profiles', label: 'Decisions', description: 'Alternatives, evaluation, constraints, validation and runs', icon: SlidersHorizontal },
] as const

const platformItems = [
  { section: 'plugins', label: 'Evidence Sources', description: 'Domain capabilities and evidence providers', icon: Boxes },
  { section: 'bindings', label: 'Evidence Mapping', description: 'Map evidence outputs into the decision model', icon: GitBranch },
  { section: 'dimensions', label: 'Evaluation Contracts', description: 'Reusable platform evaluation contracts', icon: Braces },
] as const

function isActive(pathname: string, section: string) {
  const activeSection = studioSectionFromPath(pathname)
  return activeSection === section || activeSection.startsWith(`${section}/`)
}

export function StudioNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = studioLocaleFromPath(pathname, searchParams.get('lang'))
  const localizedHref = (section: string) => studioHref(section, locale)
  const renderItem = ({ section, label, description, icon: Icon }: (typeof items)[number] | (typeof platformItems)[number]) => (
    <Link key={section} aria-current={isActive(pathname, section) ? 'page' : undefined} href={localizedHref(section)}>
      <span className="studio-nav-icon" aria-hidden><Icon size={16} /></span>
      <span className="studio-nav-copy"><strong>{label}</strong><small className="sr-only">{description}</small></span>
    </Link>
  )

  return (
    <nav aria-label="QDIP Studio">
      <span className="studio-nav-label">DECISION WORKSPACE</span>
      {items.map(renderItem)}
      <span className="studio-nav-label">ADVANCED · PLATFORM</span>
      {platformItems.map(renderItem)}
    </nav>
  )
}
