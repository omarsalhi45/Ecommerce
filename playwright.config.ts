import { defineConfig, devices } from '@playwright/test'

const frontendUrl = 'http://127.0.0.1:5173'
const adminUrl = 'http://127.0.0.1:5174'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node scripts/serve-spa.mjs apps/frontend/dist 5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: frontendUrl,
    },
    {
      command: 'node scripts/serve-spa.mjs apps/admin/dist 5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: adminUrl,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
  ],
})
