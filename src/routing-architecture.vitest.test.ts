import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function source(path: string) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('platform routing architecture', () => {
  it('uses Next built-in routing instead of a custom request proxy', () => {
    expect(existsSync(resolve(projectRoot, 'src/proxy.ts'))).toBe(false)

    const config = source('next.config.ts')
    expect(config).toContain('async rewrites()')
    expect(config).toContain('async redirects()')
    expect(config).toContain("type: 'host'")
    expect(config).toContain('PLATFORM_HOST_PATTERNS')
    expect(config).not.toContain('NextResponse')
    expect(config).not.toContain('crypto.randomUUID')
    expect(config).not.toContain('x-qdip-internal-rewrite')
  })

  it('keeps Studio route state explicit instead of deriving it from request headers or the client router', () => {
    const layout = source('src/app/studio/layout.tsx')
    const sectionPage = source('src/app/studio/[section]/page.tsx')
    const profilePage = source('src/app/studio/profiles/[id]/[[...section]]/page.tsx')

    expect(layout).not.toContain("from 'next/headers'")
    expect(sectionPage).toContain('searchParams')
    expect(sectionPage).toContain('StudioSurfaceShell')
    expect(profilePage).toContain('searchParams')
    expect(profilePage).toContain('StudioSurfaceShell')
    expect(sectionPage).not.toContain('x-forwarded-host')
    expect(profilePage).not.toContain('x-forwarded-host')
  })

  it('keeps rewrite-sensitive navigation on native browser navigation', () => {
    const observatory = source('src/components/observatory/prototype-shell.tsx')
    const studioHeader = source('src/studio/studio-product-header.tsx')

    expect(observatory).toContain('nativeNavigation')
    expect(observatory).not.toContain("from 'next/link'")
    expect(observatory).not.toContain('usePathname(')
    expect(observatory).not.toContain('useRouter(')
    expect(studioHeader).toContain('nativeNavigation')
  })

  it('enforces client-router restrictions for the full Studio and Observatory navigation subtrees', () => {
    const eslint = source('eslint.config.mjs')

    expect(eslint).toContain("'src/studio/**/*.{ts,tsx}'")
    expect(eslint).toContain("'src/components/observatory/**/*.{ts,tsx}'")
    expect(eslint).toContain("name: 'next/link'")
    expect(eslint).toContain("importNames: ['usePathname', 'useRouter', 'useSearchParams']")
  })

  it('keeps host ownership in one declarative configuration', () => {
    const routing = source('src/routing-config.ts')
    const urls = source('src/lib/platform-routing.ts')

    expect(routing).toContain('PLATFORM_HOSTS')
    expect(routing).toContain('PLATFORM_HOST_PATTERNS')
    expect(routing).toContain('Platform host')
    expect(urls).toContain("from '@/routing-config'")
    expect(urls).not.toContain('x-forwarded-host')
    expect(urls).not.toContain('vercel.app')
  })
})
