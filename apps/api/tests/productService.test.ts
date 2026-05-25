import { describe, expect, it } from 'vitest'
import { getAllProducts, getProduct, getProductReviews } from '../src/services/productService'

describe('productService', () => {
  it('returns the seeded product catalog', async () => {
    const products = await getAllProducts()

    expect(products).toHaveLength(3)
    expect(products.map((product) => product.id)).toEqual(['shirt-001', 'jacket-001', 'hoodie-001'])
  })

  it('finds a product by id', async () => {
    const product = await getProduct('hoodie-001')

    expect(product).toMatchObject({
      id: 'hoodie-001',
      name: 'Everyday Weight Hoodie',
      category: 'hoodies',
      popularityScore: 95,
      ratingSummary: {
        averageRating: 5,
        reviewCount: 2,
      },
      variants: [
        {
          sku: 'OSAI-HOOD-GRY-M',
          size: 'M',
          color: 'Grey',
          stockQuantity: 34,
        },
      ],
    })
  })

  it('returns undefined for an unknown product id', async () => {
    const product = await getProduct('missing-product')

    expect(product).toBeUndefined()
  })

  it('returns product reviews for a product', async () => {
    const reviews = await getProductReviews('hoodie-001')

    expect(reviews).toHaveLength(2)
    expect(reviews[0]).toMatchObject({
      productId: 'hoodie-001',
      rating: 5,
      title: 'Soft and structured',
    })
  })
})
