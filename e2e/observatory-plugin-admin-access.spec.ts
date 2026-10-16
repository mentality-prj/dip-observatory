import { expect, test } from '@playwright/test'
import { oidcTestCookies } from './oidc-test-session'

const adminPage = 'http://observatory.localhost:3000/uk/admin/plugins'
const adminApi = 'http://observatory.localhost:3000/api/observatory/admin/plugins'

test.describe('Observatory admin route must never hide permission errors as 404', () => {
  test('signed Observatory admin can open the real nested page', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['observatory_admin']))
    const response = await page.goto(adminPage)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: 'Керування плагінами' })).toBeVisible()
    await expect(page.getByTestId('qdip-access-gate')).toHaveCount(0)
    const session = await page.request.get('http://observatory.localhost:3000/api/auth/session')
    expect(session.status()).toBe(200)
    expect((await session.json()).observatoryAdmin).toBe(true)
  })

  test('signed non-admin receives an actionable access gate, not 404', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['studio']))
    const response = await page.goto(adminPage)
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('qdip-access-gate')).toBeVisible()
    await expect(page.getByText('Поточна сесія не містить цієї ролі.', { exact: false })).toBeVisible()
    const api = await page.request.get(adminApi)
    expect(api.status()).toBe(403)
  })

  test('anonymous user is redirected to login and admin API rejects access', async ({ page }) => {
    await page.context().clearCookies()
    const pageResponse = await page.request.get(adminPage, { maxRedirects: 0 })
    expect([302, 303, 307, 308]).toContain(pageResponse.status())
    expect(pageResponse.headers().location).toContain('/api/auth/login')
    const apiResponse = await page.request.get(adminApi)
    expect(apiResponse.status()).toBe(401)
  })
})
