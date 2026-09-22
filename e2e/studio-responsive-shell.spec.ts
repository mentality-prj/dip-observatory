import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

const PRODUCT_WORDMARK_FRAME_WIDTH = 124

test.describe('Studio responsive shell', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'studio.qdip.ai' } })

  for (const viewport of viewports) {
    test(`${viewport.name} keeps header, navigation and footer on one viewport grid`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.route('**/api/studio/dimensions', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })

      const response = await page.goto('/en')
      expect(response?.status()).toBeLessThan(400)

      const shell = page.locator('.studio-shell')
      const lockup = page.locator('.ds-product-lockup')
      const wordmarkFrame = page.locator('.ds-product-lockup-wordmark-frame')
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
      const wordmarkFrameBox = await wordmarkFrame.boundingBox()
      const statusBox = await status.boundingBox()
      expect(lockupBox).not.toBeNull()
      expect(wordmarkFrameBox).not.toBeNull()
      expect(statusBox).not.toBeNull()

      // Frozen brand geometry: assert the actual shared ProductLockup contract.
      // The frame was intentionally widened to 124px so the QDIP wordmark is not clipped.
      expect(Math.abs((wordmarkFrameBox?.width ?? 0) - PRODUCT_WORDMARK_FRAME_WIDTH)).toBeLessThanOrEqual(1)
      const expectedLeft = viewport.width <= 760 ? 14 : 22
      expect(Math.abs((lockupBox?.x ?? 0) - expectedLeft)).toBeLessThanOrEqual(1)

      const brandGap = (statusBox?.x ?? 0) - ((lockupBox?.x ?? 0) + (lockupBox?.width ?? 0))
      expect(brandGap).toBeGreaterThanOrEqual(0)
      expect(brandGap).toBeLessThanOrEqual(2)

      const statusTopOffset = (statusBox?.y ?? 0) - (lockupBox?.y ?? 0)
      const expectedStatusTop = viewport.width <= 760
        ? { min: 10, max: 13 }
        : { min: 4, max: 10 }
      expect(statusTopOffset).toBeGreaterThanOrEqual(expectedStatusTop.min)
      expect(statusTopOffset).toBeLessThanOrEqual(expectedStatusTop.max)

      if (viewport.width <= 980) {
        await expect(page.getByText('Workspace', { exact: true })).toBeVisible()
        await expect(page.locator('.studio-sidebar')).toBeHidden()
      } else {
        await expect(page.locator('.studio-sidebar')).toBeVisible()
      }

      await testInfo.attach(`studio-${viewport.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      })
    })
  }
})
