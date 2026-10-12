import { defineConfig, devices } from '@playwright/test'
import { oidcTestConfig, oidcTestCookies } from './e2e/oidc-test-session'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    // Browser E2E uses a dedicated fake account and a test-only signing key.
    storageState: { cookies: oidcTestCookies(['studio', 'rr_operator']), origins: [] },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1',
    env: {
      ZITADEL_ISSUER: oidcTestConfig.issuer,
      ZITADEL_CLIENT_ID: oidcTestConfig.clientId,
      ZITADEL_QDIP_PROJECT_ID: oidcTestConfig.projectId,
      ZITADEL_QDIP_ORGANIZATION_ID: oidcTestConfig.organizationId,
      QDIP_AUTH_COOKIE_SECRET: oidcTestConfig.signingSecret,
    },
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
