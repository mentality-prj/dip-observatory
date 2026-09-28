import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = process.cwd()

function source(path: string) {
  return readFileSync(resolve(projectRoot, path), 'utf8')
}

describe('rewrite-sensitive routing architecture', () => {
  it('keeps Observatory shell independent from the Next client router', () => {
    const shell = source('src/components/observatory/prototype-shell.tsx')

    expect(shell).not.toContain("from 'next/navigation'")
    expect(shell).not.toContain("from 'next/link'")
    expect(shell).not.toContain('usePathname(')
    expect(shell).not.toContain('useRouter(')
    expect(shell).toContain('nativeNavigation')
  })

  it('keeps Studio route state server-owned and navigation native', () => {
    const files = [
      'src/studio/use-studio-locale.tsx',
      'src/studio/studio-nav.tsx',
      'src/studio/studio-language-switcher.tsx',
      'src/studio/studio-breadcrumbs.tsx',
      'src/studio/profile-dashboard.tsx',
      'src/studio/profile-detail.tsx',
      'src/studio/profile-runner.tsx',
    ]

    for (const path of files) {
      const content = source(path)
      expect(content, path).not.toContain("from 'next/navigation'")
      expect(content, path).not.toContain("from 'next/link'")
      expect(content, path).not.toContain('usePathname(')
      expect(content, path).not.toContain('useRouter(')
    }

    expect(source('src/studio/studio-product-header.tsx')).toContain('nativeNavigation')
    expect(source('src/app/studio/layout.tsx')).toContain("requestHeaders.get('x-qdip-studio-route')")
  })

  it('keeps proxy surface ownership explicit instead of wildcarding lookalike hosts', () => {
    const proxy = source('src/proxy.ts')

    expect(proxy).toContain("const STUDIO_HOSTS = new Set(['studio.qdip.ai', 'studio.localhost'])")
    expect(proxy).toContain("const OBSERVATORY_HOSTS = new Set(['observatory.qdip.ai', 'observatory.localhost'])")
    expect(proxy).not.toContain("host.startsWith('studio.')")
    expect(proxy).not.toContain("host.startsWith('observatory.')")
  })
})
