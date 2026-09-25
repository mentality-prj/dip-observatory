'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, Braces, GitBranch, SlidersHorizontal, Telescope } from 'lucide-react'
import { observatoryHref, studioHref } from '@/lib/platform-urls'
import { studioSectionFromPath } from './studio-locale'
import { studioCopy } from './studio-copy'
import { useStudioLocale } from './use-studio-locale'

export function StudioNav() {
  const pathname = usePathname()
  const locale = useStudioLocale()
  const c = studioCopy(locale)
  const localizedHref = (section: string) => studioHref(section, locale)
  const items = [
    { section: 'profiles', label: c.nav.decisions, description: c.nav.decisionsDescription, icon: SlidersHorizontal },
  ] as const
  const platformItems = [
    { section: 'plugins', label: c.nav.evidenceSources, description: c.nav.evidenceSourcesDescription, icon: Boxes },
    {
      section: 'bindings',
      label: c.nav.evidenceMapping,
      description: c.nav.evidenceMappingDescription,
      icon: GitBranch,
    },
    {
      section: 'dimensions',
      label: c.nav.evaluationContracts,
      description: c.nav.evaluationContractsDescription,
      icon: Braces,
    },
  ] as const

  const isActive = (section: string) => {
    const activeSection = studioSectionFromPath(pathname)
    return activeSection === section || activeSection.startsWith(`${section}/`)
  }
  const renderItem = ({
    section,
    label,
    description,
    icon: Icon,
  }: (typeof items)[number] | (typeof platformItems)[number]) => (
    <Link key={section} aria-current={isActive(section) ? 'page' : undefined} href={localizedHref(section)}>
      <span className="studio-nav-icon" aria-hidden>
        <Icon size={16} />
      </span>
      <span className="studio-nav-copy">
        <strong>{label}</strong>
        <small className="sr-only">{description}</small>
      </span>
    </Link>
  )

  return (
    <nav aria-label="QDIP Studio">
      <span className="studio-nav-label">{c.nav.decisionWorkspace}</span>
      {items.map(renderItem)}
      <span className="studio-nav-label">{c.nav.advancedPlatform}</span>
      {platformItems.map(renderItem)}
      <Link href={observatoryHref('', locale)}>
        <span className="studio-nav-icon" aria-hidden>
          <Telescope size={16} />
        </span>
        <span className="studio-nav-copy">
          <strong>{c.nav.openObservatory}</strong>
        </span>
      </Link>
    </nav>
  )
}
