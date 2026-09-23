import { expect, test, type Page } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const routes = [
  { id: 'resource-allocation', path: '/resource-allocation', title: 'Resource Allocation' },
  { id: 'supply-network-resilience', path: '/supply-network-resilience', title: 'Supply Network Resilience' },
  { id: 'gtm-lab', path: '/gtm-lab', title: 'GTM Lab' },
] as const

function capturePageErrors(page: Page) {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  return errors
}

test.describe('Observatory production routing contract', () => {
  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale}${route.path} renders without client runtime errors`, async ({ page }) => {
        const errors = capturePageErrors(page)
        const response = await page.goto(
          `http://observatory.localhost:3000/${locale}${route.path}`,
          { waitUntil: 'domcontentloaded' }
        )

        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('#main-content')).toBeVisible()
        await expect(page.getByRole('link', { name: route.title, exact: true }).first()).toHaveAttribute(
          'aria-current',
          'page'
        )
        await page.waitForLoadState('networkidle')
        expect(errors.map((error) => error.message)).toEqual([])
      })
    }
  }

  for (const locale of locales) {
    test(`${locale} application navigation can visit every registered use case without page errors`, async ({ page }) => {
      const errors = capturePageErrors(page)
      const first = routes[0]
      const response = await page.goto(
        `http://observatory.localhost:3000/${locale}${first.path}`,
        { waitUntil: 'domcontentloaded' }
      )
      expect(response?.status()).toBeLessThan(400)

      for (const route of routes.slice(1)) {
        await page.getByRole('link', { name: route.title, exact: true }).first().click()
        await expect(page).toHaveURL(
          new RegExp(`observatory\\.localhost:3000/${locale}${route.path}$`)
        )
        await expect(page.locator('#main-content')).toBeVisible()
      }

      await page.waitForLoadState('networkidle')
      expect(errors.map((error) => error.message)).toEqual([])
    })
  }


  for (const route of routes) {
    test(`${route.id} desktop locale switches preserve the route without page errors`, async ({ page }) => {
      const errors = capturePageErrors(page)
      const response = await page.goto(
        `http://observatory.localhost:3000/en${route.path}`,
        { waitUntil: 'domcontentloaded' }
      )
      expect(response?.status()).toBeLessThan(400)

      for (const locale of ['uk', 'pl', 'en'] as const) {
        await page.locator(`a[data-locale="${locale}"]`).click()
        await expect(page).toHaveURL(
          new RegExp(`observatory\\.localhost:3000/${locale}${route.path}import { expect, test, type Page } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const routes = [
  { id: 'resource-allocation', path: '/resource-allocation', title: 'Resource Allocation' },
  { id: 'supply-network-resilience', path: '/supply-network-resilience', title: 'Supply Network Resilience' },
  { id: 'gtm-lab', path: '/gtm-lab', title: 'GTM Lab' },
] as const

function capturePageErrors(page: Page) {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  return errors
}

test.describe('Observatory production routing contract', () => {
  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale}${route.path} renders without client runtime errors`, async ({ page }) => {
        const errors = capturePageErrors(page)
        const response = await page.goto(
          `http://observatory.localhost:3000/${locale}${route.path}`,
          { waitUntil: 'domcontentloaded' }
        )

        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('#main-content')).toBeVisible()
        await expect(page.getByRole('link', { name: route.title, exact: true }).first()).toHaveAttribute(
          'aria-current',
          'page'
        )
        await page.waitForLoadState('networkidle')
        expect(errors.map((error) => error.message)).toEqual([])
      })
    }
  }

  for (const locale of locales) {
    test(`${locale} application navigation can visit every registered use case without page errors`, async ({ page }) => {
      const errors = capturePageErrors(page)
      const first = routes[0]
      const response = await page.goto(
        `http://observatory.localhost:3000/${locale}${first.path}`,
        { waitUntil: 'domcontentloaded' }
      )
      expect(response?.status()).toBeLessThan(400)

      for (const route of routes.slice(1)) {
        await page.getByRole('link', { name: route.title, exact: true }).first().click()
        await expect(page).toHaveURL(
          new RegExp(`observatory\\.localhost:3000/${locale}${route.path}$`)
        )
        await expect(page.locator('#main-content')).toBeVisible()
      }

      await page.waitForLoadState('networkidle')
      expect(errors.map((error) => error.message)).toEqual([])
    })
  }

)
        )
        await expect(page.locator('#main-content')).toBeVisible()
        await expect(page.locator(`a[data-locale="${locale}"]`)).toHaveAttribute('aria-current', 'page')
      }

      await page.waitForLoadState('networkidle')
      expect(errors.map((error) => error.message)).toEqual([])
    })
  }

  for (const route of routes) {
    test(`${route.id} mobile locale selector preserves the route without page errors`, async ({ page }) => {
      const errors = capturePageErrors(page)
      await page.setViewportSize({ width: 390, height: 844 })
      const response = await page.goto(
        `http://observatory.localhost:3000/en${route.path}`,
        { waitUntil: 'domcontentloaded' }
      )
      expect(response?.status()).toBeLessThan(400)

      const localeSelect = page.getByRole('combobox').first()
      await expect(localeSelect).toBeVisible()
      await localeSelect.selectOption('uk')
      await expect(page).toHaveURL(
        new RegExp(`observatory\\.localhost:3000/uk${route.path}import { expect, test, type Page } from '@playwright/test'

const locales = ['en', 'uk', 'pl'] as const
const routes = [
  { id: 'resource-allocation', path: '/resource-allocation', title: 'Resource Allocation' },
  { id: 'supply-network-resilience', path: '/supply-network-resilience', title: 'Supply Network Resilience' },
  { id: 'gtm-lab', path: '/gtm-lab', title: 'GTM Lab' },
] as const

function capturePageErrors(page: Page) {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  return errors
}

test.describe('Observatory production routing contract', () => {
  for (const locale of locales) {
    for (const route of routes) {
      test(`${locale}${route.path} renders without client runtime errors`, async ({ page }) => {
        const errors = capturePageErrors(page)
        const response = await page.goto(
          `http://observatory.localhost:3000/${locale}${route.path}`,
          { waitUntil: 'domcontentloaded' }
        )

        expect(response?.status()).toBeLessThan(400)
        await expect(page.locator('#main-content')).toBeVisible()
        await expect(page.getByRole('link', { name: route.title, exact: true }).first()).toHaveAttribute(
          'aria-current',
          'page'
        )
        await page.waitForLoadState('networkidle')
        expect(errors.map((error) => error.message)).toEqual([])
      })
    }
  }

  for (const locale of locales) {
    test(`${locale} application navigation can visit every registered use case without page errors`, async ({ page }) => {
      const errors = capturePageErrors(page)
      const first = routes[0]
      const response = await page.goto(
        `http://observatory.localhost:3000/${locale}${first.path}`,
        { waitUntil: 'domcontentloaded' }
      )
      expect(response?.status()).toBeLessThan(400)

      for (const route of routes.slice(1)) {
        await page.getByRole('link', { name: route.title, exact: true }).first().click()
        await expect(page).toHaveURL(
          new RegExp(`observatory\\.localhost:3000/${locale}${route.path}$`)
        )
        await expect(page.locator('#main-content')).toBeVisible()
      }

      await page.waitForLoadState('networkidle')
      expect(errors.map((error) => error.message)).toEqual([])
    })
  }

)
      )
      await expect(page.locator('#main-content')).toBeVisible()

      await page.waitForLoadState('networkidle')
      expect(errors.map((error) => error.message)).toEqual([])
    })
  }

  test('unknown use case remains a hard 404 instead of falling through to a broken renderer', async ({ page }) => {
    const errors = capturePageErrors(page)
    const response = await page.goto('http://observatory.localhost:3000/en/not-a-real-use-case')

    expect(response?.status()).toBe(404)
    expect(errors.map((error) => error.message)).toEqual([])
  })
})
