import { expect, test } from '@playwright/test'
import { oidcTestCookies } from './oidc-test-session'

test.describe('Observatory identity and mobile utilities', () => {
  test('profile reveals signed-in subject and all verified roles', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['studio', 'rr_operator', 'observatory_admin']))
    await page.goto('http://observatory.localhost:3000/uk/admin/plugins')
    const profile = page.getByTestId('observatory-profile')
    await expect(profile.locator('summary')).toBeVisible()
    await profile.locator('summary').click()
    await expect(profile.getByText('ID користувача: local-e2e-account')).toBeVisible()
    await expect(profile.getByText('Адміністратор Observatory')).toBeVisible()
    await expect(profile.getByText('Studio', { exact: true })).toBeVisible()
    await expect(profile.getByText('Оператор RR')).toBeVisible()
    await expect(profile.getByRole('button', { name: 'Вийти' })).toBeVisible()
  })

  for (const width of [375, 390]) {
    test(`mobile ${width}px shows a readable language selection and bounded profile`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.context().clearCookies()
      await page.context().addCookies(oidcTestCookies(['observatory_admin']))
      await page.goto('http://observatory.localhost:3000/en/admin/plugins')
      const language = page.getByRole('combobox', { name: 'Language' })
      await expect(language).toBeVisible()
      await expect(language).toHaveValue('en')
      await expect(language.locator('option:checked')).toHaveText('EN')
      const profile = page.getByTestId('observatory-profile')
      await expect(profile.locator('summary')).toBeVisible()
      const bounds = await profile.locator('summary').boundingBox()
      expect(bounds?.width).toBeGreaterThanOrEqual(40)
      expect(bounds?.width).toBeLessThan(160)
      await language.selectOption('uk')
      await expect(page).toHaveURL(/observatory\.localhost:3000\/uk\/admin\/plugins$/)
      await expect(page.getByRole('combobox', { name: 'Мова' })).toHaveValue('uk')
    })
  }
})
