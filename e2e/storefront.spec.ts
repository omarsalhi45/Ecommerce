import { expect, test } from '@playwright/test'
import { mockProductApi, storefrontUrl } from './fixtures/products'

test('shopper can browse products, add to cart, and reach checkout', async ({ page }) => {
  await mockProductApi(page)

  await page.goto(storefrontUrl)

  await expect(
    page.getByRole('heading', { name: 'Clothes made for fast days and late nights.' })
  ).toBeVisible()
  await expect(page.getByText('Everyday Weight Hoodie')).toBeVisible()

  await page
    .locator('div')
    .filter({ hasText: /^Everyday Weight Hoodie/ })
    .getByRole('button', { name: 'Add' })
    .click()

  const miniCart = page.getByRole('dialog', { name: 'Added to your cart' })
  await expect(miniCart).toBeVisible()
  await expect(miniCart.getByText('Estimated total')).toBeVisible()
  await expect(miniCart.getByText('$72.29')).toBeVisible()

  await miniCart.getByRole('link', { name: 'View cart' }).click()

  await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible()
  await expect(page.getByText('Everyday Weight Hoodie', { exact: true }).first()).toBeVisible()
  await expect(page.locator('main').getByText('Estimated total')).toBeVisible()
  await expect(page.locator('main').getByText('$72.29')).toBeVisible()

  await page.locator('main').getByRole('link', { name: 'Checkout' }).click()

  await expect(page.getByRole('heading', { name: 'Finish your order' })).toBeVisible()
  await expect(page.getByText('Estimated total $72.29')).toBeVisible()
})

test('shopper can open product details with variants and related products', async ({ page }) => {
  await mockProductApi(page)

  await page.goto(storefrontUrl)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page
    .locator('div')
    .filter({ hasText: /^Everyday Weight Hoodie/ })
    .getByRole('link', { name: 'Details' })
    .click()

  await expect(page).toHaveURL(/\/products\/hoodie-001$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.getByRole('heading', { name: 'Everyday Weight Hoodie' })).toBeVisible()
  await expect(page.getByText('Choose your option')).toBeVisible()
  await page.getByRole('button', { name: 'Select size M' }).click()
  await page.getByRole('button', { name: 'Select color Black' }).click()
  await expect(page.getByText('8 available in M / Black.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Reviews' })).toBeVisible()
  await expect(page.getByText('Soft and structured')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recommended pieces' })).toBeVisible()
})
