import { expect, test } from '@playwright/test'
import { adminUrl } from './fixtures/products'

test('admin login supports direct reload and dashboard avoids protected calls without a session', async ({
  page,
}) => {
  let protectedAdminRequests = 0

  await page.route('**/api/admin/**', async (route) => {
    protectedAdminRequests += 1
    await route.fulfill({
      contentType: 'application/json',
      status: 500,
      body: JSON.stringify({ code: 'unexpected_admin_request' }),
    })
  })

  await page.goto(`${adminUrl}/login`)
  await expect(page.getByRole('heading', { name: 'Back office login' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Back office login' })).toBeVisible()

  await page.goto(adminUrl)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Back office login' })).toBeVisible()
  expect(protectedAdminRequests).toBe(0)
})
