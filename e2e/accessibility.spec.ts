import { expect, test } from '@playwright/test'
import { expectNoAccessibilityViolations } from './fixtures/accessibility'
import { adminUrl, mockProductApi, storefrontUrl } from './fixtures/products'

const storefrontPages = [
  { name: 'storefront home', path: '/' },
  { name: 'product detail', path: '/products/hoodie-001' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
]

for (const pageConfig of storefrontPages) {
  test(`${pageConfig.name} has no critical accessibility violations`, async ({ page }) => {
    await mockProductApi(page)
    await page.goto(`${storefrontUrl}${pageConfig.path}`)

    await expectNoAccessibilityViolations(page)
  })
}

test('admin login has no critical accessibility violations', async ({ page }) => {
  await page.goto(`${adminUrl}/login`)

  await expectNoAccessibilityViolations(page)
})

test('storefront primary navigation is keyboard reachable', async ({ page }) => {
  await mockProductApi(page)
  await page.goto(storefrontUrl)

  await page.keyboard.press('Tab')
  await expect(page.getByLabel('OSAI home')).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Shop', exact: true })).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(
    page.getByLabel('Main navigation').getByRole('link', { name: 'Wishlist', exact: true })
  ).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Cart' }).first()).toBeFocused()
})

test('admin login form exposes keyboard-reachable labeled fields', async ({ page }) => {
  await page.goto(`${adminUrl}/login`)

  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  await expect(page.getByLabel('Email')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Password')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Log in to admin' })).toBeFocused()
})
