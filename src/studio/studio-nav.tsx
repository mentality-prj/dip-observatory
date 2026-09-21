'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Boxes, Braces, GitBranch, SlidersHorizontal } from 'lucide-react'
import { studioHref } from '@/lib/platform-urls'

const items = [
  { section: 'profiles', label: 'Decision Profiles', description: 'Models and runs', icon: SlidersHorizontal },
  { section: 'plugins', label: 'Capabilities', description: 'Evidence providers', icon: Boxes },
  { section: 'bindings', label: 'Output Bindings', description: 'Output mapping', icon: GitBranch },
  { section: 'dimensions', label: 'Dimensions', description: 'Evaluation contracts', icon: Braces },
] as const

function isActive(pathname: string, section: string) {
  const cleanPath = pathname.replace(/^\/studio/, '') || '/'
  return cleanPath === `/${section}` || cleanPath.startsWith(`/${section}/`)
}

export function StudioNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lang = searchParams.get('lang')
  const localizedHref = (section: string) => `${studioHref(section)}${lang && lang !== 'en' ? `?lang=${lang}` : ''}`
  return (
    <nav aria-label="QDIP Studio">
      <span className="studio-nav-label">WORKSPACE</span>
      {items.map(({ section, label, description, icon: Icon }) => (
        <Link key={section} aria-current={isActive(pathname, section) ? 'page' : undefined} href={localizedHref(section)}>
          <span className="studio-nav-icon" aria-hidden>
            <Icon size={16} />
          </span>
          <span className="studio-nav-copy">
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
        </Link>
      ))}
    </nav>
  )
}
