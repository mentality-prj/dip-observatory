import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'decision-studio.spec.ts',
  timeout: 45000,
  workers: 1,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 3000',
    url: 'http://localhost:3000/studio',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
