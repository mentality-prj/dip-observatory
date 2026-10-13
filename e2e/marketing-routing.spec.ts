import { expect, test } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const demos = [
  ['Resource Allocation', '/resource-allocation'],
  ['Supply Network Optimization', '/supply-network-optimization'],
  ['GTM Lab', '/gtm-lab'],
] as const

const openLabels = {
  en: 'Open',
  uk: 'Відкрити',
  pl: 'Otwórz',
} as const

const useCaseLocalization = {
  en: {
    heading: 'One Decision Engine. Reusable decision patterns.',
    body: 'Resource Allocation, Supply Network Optimization and GTM Lab are working applications.',
  },
  uk: {
    heading: 'Один рушій рішень. Багаторазові патерни рішень.',
    body: 'Resource Allocation, Supply Network Optimization і GTM Lab — робочі застосунки.',
  },
  pl: {
    heading: 'Jeden silnik decyzyjny. Wielokrotnego użytku wzorce decyzji.',
    body: 'Resource Allocation, Supply Network Optimization i GTM Lab to działające aplikacje.',
  },
} as const

const heroHeadlines = {
  en: 'Turn uncertainty into decisions',
  uk: 'Перетворюйте невизначеність на рішення',
  pl: 'Przekształcaj niepewność w decyzje',
} as const

const whyLabels = {
  en: 'Why QDIP',
  uk: 'Чому QDIP',
  pl: 'Dlaczego QDIP',
} as const

test.describe('current marketing routing', () => {
  test('marketing network texture stays above the opaque surface on desktop and mobile', async ({ page, request }) => {
    const asset = await request.get('http://qdip.localhost:3000/qdip-network.svg')
    expect(asset.status()).toBe(200)
    expect(asset.headers()['content-type']).toContain('image/svg+xml')

    for (const viewport of [
      { width: 1440, height: 900, locale: 'en' },
      { width: 390, height: 844, locale: 'uk' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const response = await page.goto(`http://qdip.localhost:3000/${viewport.locale}`)
      expect(response?.status()).toBeLessThan(400)

      const layers = await page.locator('#main-content').evaluate((main) => {
        const shell = main.parentElement
        if (!shell) throw new Error('Marketing shell not found')
        const texture = getComputedStyle(shell, '::before')
        return {
          image: texture.backgroundImage,
          position: texture.position,
          opacity: Number(texture.opacity),
          zIndex: Number(texture.zIndex),
          mainZIndex: Number(getComputedStyle(main).zIndex),
          shellIsolation: getComputedStyle(shell).isolation,
        }
      })

      expect(layers.image).toContain('qdip-network.svg')
      expect(layers.position).toBe('fixed')
      expect(layers.opacity).toBeGreaterThan(0)
      expect(layers.shellIsolation).toBe('isolate')
      expect(layers.mainZIndex).toBeGreaterThan(layers.zIndex)
    }
  })

  test('desktop decision scene expands without changing mobile arrangement', async ({ page }) => {
    for (const viewport of [
      { width: 1440, height: 900, expectedLayout: 'row' },
      { width: 390, height: 844, expectedLayout: 'column' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://qdip.localhost:3000/en')
      const scene = page.locator('figure[aria-label]').first()
      const hero = page.locator('#main-content > section').first()
      await expect(scene).toBeVisible()
      const width = await scene.evaluate((node) => node.getBoundingClientRect().width)
      const heroWidth = await hero.evaluate((node) => node.getBoundingClientRect().width)
      expect(width).toBeGreaterThan(heroWidth * 0.85)
      await expect(scene).toHaveCSS('flex-direction', viewport.expectedLayout)
    }
  })

  test('marketing ambient motion and decision trace honor reduced-motion', async ({ page }) => {
    await page.goto('http://qdip.localhost:3000/en')
    const scene = page.locator('figure[aria-label]').first()
    const livePath = scene.locator('path[class*="livePath"]')
    await expect(livePath).toHaveCSS('animation-name', /qdip-trace-signal/)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(livePath).toHaveCSS('animation-name', 'none')
  })

  test('desktop network is visible, while mobile hero text stays unobstructed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    for (const viewport of [
      { width: 1440, height: 900, networkVisible: true },
      { width: 768, height: 1024, networkVisible: false },
      { width: 390, height: 844, networkVisible: false },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://qdip.localhost:3000/en')
      const network = page.getByTestId('marketing-network-motion')
      if (viewport.networkVisible) {
        await expect(network).toBeVisible()
        await expect(network.locator('g[class*="activePaths"] path').first()).toHaveCSS(
          'animation-name',
          /qdip-network-flow/
        )
      } else {
        await expect(network).toBeHidden()
        const hero = page.locator('#main-content > section').first()
        const heading = hero.getByRole('heading', { level: 1 })
        const primary = hero.getByRole('link', { name: /Explore|See|Open|Observatory/i }).first()
        await expect(heading).toBeVisible()
        await expect(primary).toBeVisible()
        await expect(primary).toHaveCSS('animation-name', /qdip-cta-arrive/)
        const headingRect = await heading.boundingBox()
        const ctaRect = await primary.boundingBox()
        expect(headingRect).not.toBeNull()
        expect(ctaRect).not.toBeNull()
        expect((ctaRect?.y ?? 0)).toBeGreaterThan((headingRect?.y ?? 0) + (headingRect?.height ?? 0))
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
        expect(overflow).toBeLessThanOrEqual(1)
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const hero = page.locator('#main-content > section').first()
    await expect(hero.locator('a[class*="primaryButtonLarge"]').first()).toHaveCSS('animation-name', 'none')
  })

  for (const locale of locales) {
    test(`${locale} homepage keeps buyer navigation and headline semantics intact`, async ({ page }) => {
      const response = await page.goto(`http://qdip.localhost:3000/${locale}`)
      expect(response?.status()).toBeLessThan(400)

      await expect(page.getByRole('heading', { level: 1, name: heroHeadlines[locale] })).toBeVisible()
      const why = page.getByRole('link', { name: whyLabels[locale] }).first()
      await expect(why).toHaveAttribute('href', /#why$/)
      await expect(page.locator('#why')).toHaveCount(1)
    })

    test(`${locale} use-case demos route to Observatory`, async ({ page }) => {
      const response = await page.goto(`http://qdip.localhost:3000/${locale}/use-cases#demos`)
      expect(response?.status()).toBeLessThan(400)

      for (const [title, path] of demos) {
        await expect(page.getByRole('link', { name: `${openLabels[locale]} ${title}` })).toHaveAttribute(
          'href',
          `https://observatory.qdip.ai/${locale}${path}`
        )
      }

      await expect(page.getByRole('heading', { level: 1, name: useCaseLocalization[locale].heading })).toBeVisible()
      await expect(page.getByText(useCaseLocalization[locale].body, { exact: false })).toBeVisible()
    })
  }
})
