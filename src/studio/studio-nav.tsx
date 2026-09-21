'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, Braces, GitBranch, SlidersHorizontal } from 'lucide-react'
import { studioHref } from '@/lib/platform-urls'

const items = [
  { section: 'profiles', label: 'Decision Profiles', description: 'Build and run decisions', icon: SlidersHorizontal },
  { section: 'plugins', label: 'Capabilities', description: 'Inspect evidence providers', icon: Boxes },
  { section: 'bindings', label: 'Output Bindings', description: 'Connect outputs to dimensions', icon: GitBranch },
  { section: 'dimensions', label: 'Dimensions', description: 'Govern evaluation contracts', icon: Braces },
] as const

function isActive(pathname: string, section: string) {
  const cleanPath = pathname.replace(/^\/studio/, '') || '/'
  return cleanPath === `/${section}` || cleanPath.startsWith(`/${section}/`)
}

export function StudioNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="QDIP Studio">
      <span className="studio-nav-label">WORKSPACE</span>
      {items.map(({ section, label, description, icon: Icon }, index) => (
        <Link key={section} aria-current={isActive(pathname, section) ? 'page' : undefined} href={studioHref(section)}>
          <span className="studio-nav-icon" aria-hidden>
            <Icon size={17} />
          </span>
          <span className="studio-nav-copy">
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <i>{String(index + 1).padStart(2, '0')}</i>
        </Link>
      ))}
    </nav>
  )
}
