import { expect, test } from '@playwright/test'

test.describe('visible Zitadel entry points', () => {
  const surfaces = [
    {
      url: 'http://qdip.localhost:3000/en',
      locale: 'en',
      returnTo: 'https://qdip.ai/en',
      label: 'Sign in',
    },
    {
      url: 'http://observatory.localhost:3000/uk/challenges',
      locale: 'uk',
      returnTo: 'https://observatory.qdip.ai/uk/challenges',
      label: 'Увійти',
    },
    {
      url: 'http://studio.localhost:3000/pl/profiles',
      locale: 'pl',
      returnTo: 'https://studio.qdip.ai/pl',
      label: 'Zaloguj się',
    },
  ] as const

  for (const surface of surfaces) {
    test(`${surface.locale} exposes a visible, correct Zitadel sign-in URL`, async ({ page }) => {
      const response = await page.goto(surface.url)
      expect(response?.status()).toBeLessThan(400)
      const link = page.getByRole('link', { name: surface.label, exact: true })
      await expect(link).toBeVisible()
      const href = await link.getAttribute('href')
      expect(href).toBeTruthy()
      const url = new URL(href!)
      expect(url.origin).toBe('https://qdip.ai')
      expect(url.pathname).toBe('/api/auth/login')
      expect(url.searchParams.get('return_to')).toBe(surface.returnTo)
    })
  }

  test('mobile marketing header keeps sign-in visible without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://qdip.localhost:3000/pl')
    const login = page.getByRole('link', { name: 'Zaloguj się', exact: true })
    await expect(login).toBeVisible()
    const rect = await login.boundingBox()
    expect(rect).not.toBeNull()
    expect((rect?.x ?? 0) + (rect?.width ?? 0)).toBeLessThanOrEqual(390)
    const headerOverflow = await page
      .locator('header')
      .first()
      .evaluate((header) => header.scrollWidth - header.clientWidth)
    expect(headerOverflow).toBeLessThanOrEqual(1)
  })
})
