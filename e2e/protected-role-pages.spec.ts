import { expect, test } from '@playwright/test'
import { oidcTestCookies } from './oidc-test-session'

test.describe('QDIP role-gated pages', () => {
  test('anonymous Studio renders sign-in instead of privileged workspace', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.goto('http://studio.localhost:3000/en/profiles')
    expect(response?.status()).toBe(200)
    await expect(page.getByTestId('qdip-access-gate')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
    await expect(page.locator('.studio-workspace')).toHaveCount(0)
    await expect(page.locator('.studio-sidebar')).toHaveCount(0)
  })

  test('RR-only user is denied Studio despite being authenticated', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['rr_operator']))
    await page.goto('http://studio.localhost:3000/en/plugins')
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible()
    await expect(page.getByText('Studio Access', { exact: true })).toBeVisible()
    await expect(page.locator('.studio-workspace')).toHaveCount(0)
  })

  test('Studio-only user is denied the RR operator workspace', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['studio']))
    await page.goto('http://observatory.localhost:3000/en/readiness-recovery')
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible()
    await expect(page.getByText('RR Operator', { exact: true })).toBeVisible()
    await expect(page.getByTestId('rr-kernel-only-workspace')).toHaveCount(0)
  })

  test('anonymous RR route is gated, but public Observatory demos are not', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('http://observatory.localhost:3000/uk/readiness-recovery')
    await expect(page.getByTestId('qdip-access-gate')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Увійти' })).toBeVisible()
    await expect(page.getByTestId('rr-kernel-only-workspace')).toHaveCount(0)

    await page.goto('http://observatory.localhost:3000/uk/resource-allocation')
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.getByTestId('qdip-access-gate')).toHaveCount(0)
  })

  test('Decision Audit is unavailable without Studio role', async ({ page }) => {
    await page.context().clearCookies()
    await page.context().addCookies(oidcTestCookies(['rr_operator']))
    await page.goto('http://observatory.localhost:3000/en/decisions')
    await expect(page.getByRole('heading', { name: 'Access restricted' })).toBeVisible()
    await expect(page.locator('.observatory-audit-layout')).toHaveCount(0)
  })

  test('Studio and RR roles allow their respective workspaces', async ({ page }) => {
    await page.goto('http://studio.localhost:3000/en/profiles')
    await expect(page.locator('.studio-workspace')).toBeVisible()
    await expect(page.getByTestId('qdip-access-gate')).toHaveCount(0)

    await page.goto('http://observatory.localhost:3000/en/readiness-recovery')
    await expect(page.getByTestId('rr-kernel-only-workspace')).toBeVisible()
    await expect(page.getByTestId('qdip-access-gate')).toHaveCount(0)
  })
})
