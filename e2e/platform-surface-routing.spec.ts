import { expect, test, type Page } from '@playwright/test'

function capturePageErrors(page: Page) {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  return errors
}

async function expectNoPageErrors(errors: Error[]) {
  await expect.poll(() => errors.map((error) => error.message), { timeout: 1_500 }).toEqual([])
}

test.describe('platform surface routing contract', () => {
  test('Observatory survives the original mixed locale and application navigation sequence', async ({ page }) => {
    const errors = capturePageErrors(page)

    const response = await page.goto('http://observatory.localhost:3000/uk', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    await page.locator('a[href="/uk/supply-network-optimization"]').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/uk\/supply-network-optimization$/)
    await page.locator('a.ds-product-lockup-product').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/uk\/?$/)

    await page.locator('a[data-locale="pl"]').click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/pl\/?$/)
    await page.locator('a[href="/pl/resource-allocation"]').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/pl\/resource-allocation$/)
    await page.locator('a.ds-product-lockup-product').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/pl\/?$/)

    await page.locator('a[data-locale="en"]').click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/en\/?$/)
    await page.locator('a[href="/en/gtm-lab"]').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/en\/gtm-lab$/)
    await page.locator('a.ds-product-lockup-product').first().click()
    await expect(page).toHaveURL(/observatory\.localhost:3000\/en\/?$/)

    await expect(page.locator('#main-content')).toBeVisible()
    await expectNoPageErrors(errors)
  })

  test('Studio preserves public route and locale through repeated native navigation', async ({ page }) => {
    const errors = capturePageErrors(page)

    const response = await page.goto('http://studio.localhost:3000/en/profiles', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('#main-content')).toBeVisible()

    await page.locator('a[href="/en/plugins"]:visible').first().click()
    await expect(page).toHaveURL(/studio\.localhost:3000\/en\/plugins$/)

    await page.locator('a[data-studio-locale="uk"]:visible').first().click()
    await expect(page).toHaveURL(/studio\.localhost:3000\/uk\/plugins$/)

    await page.locator('a[href="/uk/bindings"]:visible').first().click()
    await expect(page).toHaveURL(/studio\.localhost:3000\/uk\/bindings$/)

    await page.locator('a[data-studio-locale="pl"]:visible').first().click()
    await expect(page).toHaveURL(/studio\.localhost:3000\/pl\/bindings$/)

    await page.locator('a[href="/pl/dimensions"]:visible').first().click()
    await expect(page).toHaveURL(/studio\.localhost:3000\/pl\/dimensions$/)

    await expect(page.locator('#main-content')).toBeVisible()
    await expectNoPageErrors(errors)
  })

  test('canonical product roots never expose internal rewrite paths', async ({ page }) => {
    const observatory = await page.goto('http://observatory.localhost:3000/', { waitUntil: 'domcontentloaded' })
    expect(observatory?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/observatory\.localhost:3000\/en$/)

    const studio = await page.goto('http://studio.localhost:3000/', { waitUntil: 'domcontentloaded' })
    expect(studio?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/studio\.localhost:3000\/en\/profiles$/)

    const marketing = await page.goto('http://qdip.localhost:3000/', { waitUntil: 'domcontentloaded' })
    expect(marketing?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/qdip\.localhost:3000\/$/)
  })

  test('localized Decision Audit is routable and legacy URL canonicalizes', async ({ page }) => {
    const errors = capturePageErrors(page)

    const legacy = await page.goto('http://observatory.localhost:3000/decisions?decision=test-id', {
      waitUntil: 'domcontentloaded',
    })
    expect(legacy?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/observatory\.localhost:3000\/en\/decisions\?decision=test-id$/)
    await expect(page.locator('#main-content')).toBeVisible()

    const localized = await page.goto('http://observatory.localhost:3000/uk/decisions?decision=test-id', {
      waitUntil: 'domcontentloaded',
    })
    expect(localized?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/observatory\.localhost:3000\/uk\/decisions\?decision=test-id$/)
    await expect(page.locator('#main-content')).toBeVisible()

    await expectNoPageErrors(errors)
  })

  test('marketing localized routes remain on the marketing surface', async ({ page }) => {
    const errors = capturePageErrors(page)

    const response = await page.goto('http://qdip.localhost:3000/en', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBeLessThan(400)

    const pl = page.locator('a[href="/pl"]').first()
    await expect(pl).toBeVisible()
    await pl.click()
    await expect(page).toHaveURL(/qdip\.localhost:3000\/pl$/)

    const nested = await page.goto('http://qdip.localhost:3000/uk/core/architecture', {
      waitUntil: 'domcontentloaded',
    })
    expect(nested?.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/qdip\.localhost:3000\/uk\/core\/architecture$/)

    await expectNoPageErrors(errors)
  })
})
