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
