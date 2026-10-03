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
  for (const viewport of viewports) {
    test(`${viewport.name} keeps header, navigation and footer on one viewport grid`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.route('**/api/studio/dimensions', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })

      const response = await page.goto('http://studio.localhost:3000/en')
      expect(response?.status()).toBeLessThan(400)
      expect(new URL(page.url()).origin).toBe('http://studio.localhost:3000')

      const stylesheetOrigins = await page.evaluate(() =>
        Array.from(document.styleSheets)
          .map((sheet) => sheet.href)
          .filter((href): href is string => Boolean(href))
          .map((href) => new URL(href).origin)
      )
      expect(stylesheetOrigins.every((origin) => origin === 'http://studio.localhost:3000')).toBe(true)

      const shell = page.locator('.studio-shell')
      const lockup = page.locator('.ds-product-lockup')
      const wordmarkFrame = page.locator('.ds-product-lockup-wordmark-frame')
      const headerActions = page.locator('.ds-product-header-actions')
      const status = page.locator('[data-studio-core-status]')
      const languageControls = page.locator('.studio-language-controls')
      const footer = page.getByTestId('studio-footer')
      const mobileLocale = page.locator('.studio-language-controls details')

      await expect(shell).toBeVisible()
      await expect(lockup).toBeVisible()
      await expect(status).toHaveAttribute('data-state', 'connected')
      await expect(headerActions.locator(':scope > [data-studio-core-status]')).toBeVisible()
      await expect(page.locator('.ds-product-header-brand [data-studio-core-status]')).toHaveCount(0)
      await expect(languageControls).toBeVisible()
      await expect(footer).toBeVisible()
      await expect(footer).toHaveAttribute('data-variant', 'studio')

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(1)

      const footerBox = await footer.boundingBox()
      expect(footerBox).not.toBeNull()
      expect(Math.abs((footerBox?.x ?? 0) - 0)).toBeLessThanOrEqual(1)
      expect(Math.abs((footerBox?.width ?? 0) - viewport.width)).toBeLessThanOrEqual(2)
      await expect(footer.getByRole('navigation')).toHaveCount(0)

      const footerBrandBox = await footer.locator('[data-footer-brand]').boundingBox()
      const footerCopyrightBox = await footer.locator('[data-footer-copyright]').boundingBox()
      expect(footerBrandBox).not.toBeNull()
      expect(footerCopyrightBox).not.toBeNull()
      expect(Math.abs((footerBrandBox?.x ?? 0) - (footerCopyrightBox?.x ?? 0))).toBeLessThanOrEqual(1)
      const footerLogoFilter = await footer.locator('img').evaluate((element) => getComputedStyle(element).filter)
      expect(footerLogoFilter).toBe('brightness(0) invert(1)')
      const footerTheme = await footer.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          backgroundImage: style.backgroundImage,
          color: style.color,
          position: style.position,
          zIndex: style.zIndex,
        }
      })
      expect(footerTheme.backgroundImage).toContain('radial-gradient')
      expect(footerTheme.backgroundImage).toContain('linear-gradient')
      expect(footerTheme.color).toBe('rgb(255, 255, 255)')
      expect(footerTheme.position).toBe('relative')
      expect(footerTheme.zIndex).toBe('2')

      const lockupBox = await lockup.boundingBox()
      const wordmarkFrameBox = await wordmarkFrame.boundingBox()
      const statusBox = await status.boundingBox()
      const languageBox = await languageControls.boundingBox()
      expect(lockupBox).not.toBeNull()
      expect(wordmarkFrameBox).not.toBeNull()
      expect(statusBox).not.toBeNull()
      expect(languageBox).not.toBeNull()

      // The shared frame remains wide enough to avoid clipping the QDIP artwork.
      expect(Math.abs((wordmarkFrameBox?.width ?? 0) - PRODUCT_WORDMARK_FRAME_WIDTH)).toBeLessThanOrEqual(1)
      const expectedLeft = viewport.width <= 760 ? 14 : 22
      expect(Math.abs((lockupBox?.x ?? 0) - expectedLeft)).toBeLessThanOrEqual(1)

      // Core connectivity belongs to the right-side action group and remains
      // immediately before the shared language control at every viewport.
      expect(statusBox?.x ?? 0).toBeGreaterThan(lockupBox?.x ?? 0)
      expect((statusBox?.x ?? 0) + (statusBox?.width ?? 0)).toBeLessThanOrEqual((languageBox?.x ?? 0) + 1)
      const statusCenterY = (statusBox?.y ?? 0) + (statusBox?.height ?? 0) / 2
      const languageCenterY = (languageBox?.y ?? 0) + (languageBox?.height ?? 0) / 2
      expect(Math.abs(statusCenterY - languageCenterY)).toBeLessThanOrEqual(2)

      if (viewport.width <= 600) {
        await expect(mobileLocale).toBeVisible()
        await expect(mobileLocale.locator('summary')).toBeVisible()
      }

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
