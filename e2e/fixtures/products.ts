import type { Page } from '@playwright/test'

export const storefrontUrl = 'http://127.0.0.1:5173'
export const adminUrl = 'http://127.0.0.1:5174'

const products = [
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie for daily wear.',
    price: 59.99,
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
    popularityScore: 95,
    variants: [
      {
        sku: 'hoodie-001-black-m',
        size: 'M',
        color: 'Black',
        stockQuantity: 8,
      },
    ],
  },
  {
    id: 'tee-001',
    name: 'Box Fit Street Tee',
    description: 'Heavy cotton tee with a clean shape.',
    price: 29.99,
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    category: 'tees',
    popularityScore: 88,
    variants: [
      {
        sku: 'tee-001-white-l',
        size: 'L',
        color: 'White',
        stockQuantity: 12,
      },
    ],
  },
]

export const mockProductApi = async (page: Page) => {
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(products),
    })
  })

  await page.route('**/api/products/*', async (route) => {
    const productId = route.request().url().split('/').at(-1)
    const product = products.find((candidate) => candidate.id === productId)

    if (!product) {
      await route.fulfill({
        contentType: 'application/json',
        status: 404,
        body: JSON.stringify({ code: 'not_found', message: 'Product not found' }),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(product),
    })
  })
}
