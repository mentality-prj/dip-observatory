import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

test.describe('Studio responsive shell', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'studio.qdip.ai' } })

  for (const viewport of viewports) {
    test(`${viewport.name} keeps header, navigation and footer on one viewport grid`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.route('**/api/studio/dimensions', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })

      const response = await page.goto('/en')
      expect(response?.status()).toBeLessThan(400)

      const shell = page.locator('.studio-shell')
      const lockup = page.locator('.ds-product-lockup')
      const status = page.locator('.studio-core-status')
      const footer = page.locator('.studio-site-footer')

      await expect(shell).toBeVisible()
      await expect(lockup).toBeVisible()
      await expect(status).toHaveAttribute('data-state', 'connected')
      await expect(footer).toBeVisible()

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(1)

      const footerBox = await footer.boundingBox()
      expect(footerBox).not.toBeNull()
      expect(Math.abs((footerBox?.width ?? 0) - viewport.width)).toBeLessThanOrEqual(2)

      const lockupBox = await lockup.boundingBox()
      const statusBox = await status.boundingBox()
      expect(lockupBox).not.toBeNull()
      expect(statusBox).not.toBeNull()
      const brandGap = (statusBox?.x ?? 0) - ((lockupBox?.x ?? 0) + (lockupBox?.width ?? 0))
      expect(brandGap).toBeGreaterThanOrEqual(0)
      expect(brandGap).toBeLessThanOrEqual(8)

      if (viewport.width <= 980) {
        await expect(page.getByText('Workspace', { exact: true })).toBeVisible()
        await expect(page.locator('.studio-sidebar')).toBeHidden()
      } else {
        await expect(page.locator('.studio-sidebar')).toBeVisible()
      }
    })
  }
})
