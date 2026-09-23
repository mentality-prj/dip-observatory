import { expect, test } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const demos = [
  ['Resource Allocation', '/resource-allocation'],
  ['GTM Lab', '/gtm-lab'],
] as const

const heroHeadlines = {
  en: 'Make complex decisions repeatable',
  uk: 'Приймайте складні рішення послідовно',
  pl: 'Podejmuj złożone decyzje w sposób powtarzalny',
} as const

const whyLabels = {
  en: 'Why QDIP',
  uk: 'Чому QDIP',
  pl: 'Dlaczego QDIP',
} as const

test.describe('current marketing routing', () => {
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
        await expect(page.getByRole('link', { name: `Open ${title}` })).toHaveAttribute(
          'href',
          `https://observatory.qdip.ai/${locale}${path}`
        )
      }
    })
  }
})


test('retired Gas Forecast demo is not publicly routable', async ({ page }) => {
  const response = await page.goto('http://observatory.localhost:3000/en/gas-forecast')
  expect(response?.status()).toBe(404)
})
