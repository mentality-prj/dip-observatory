import { expect, test } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const demos = [
  ['Resource Allocation', '/resource-allocation'],
  ['Gas Decision', '/gas-forecast'],
  ['GTM Lab', '/gtm-lab'],
] as const

test.describe('current marketing demo routing', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} use-case demos route to Observatory`, async ({ page }) => {
      const response = await page.goto(`/${locale}/use-cases#demos`)
      expect(response?.status()).toBeLessThan(400)

      for (const [title, path] of demos) {
        await expect(page.getByRole('link', { name: `Open ${title}` })).toHaveAttribute(
          'href',
          `https://observatory.qdip.ai/en${path}`
        )
      }
    })
  }
})
