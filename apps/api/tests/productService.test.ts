import { beforeEach, describe, expect, it } from 'vitest'
import { resetCacheForTests } from '../src/services/cacheService'
import {
  getAllProducts,
  getProduct,
  getProductReviews,
  getRecommendedProducts,
} from '../src/services/productService'

describe('productService', () => {
  beforeEach(() => {
    resetCacheForTests()
  })

  it('returns the seeded product catalog', async () => {
    const products = await getAllProducts()

    expect(products).toHaveLength(20)
    expect(products.map((product) => product.id)).toEqual(
      expect.arrayContaining(['shirt-001', 'jacket-001', 'hoodie-001', 'pants-001', 'bag-001'])
    )
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

  it('returns sale compare-at pricing for marked-down products', async () => {
    const product = await getProduct('hoodie-003')

    expect(product).toMatchObject({
      id: 'hoodie-003',
      price: 74.99,
      compareAtPrice: 94.99,
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

  it('recommends popular products with category affinity', async () => {
    const recommendations = await getRecommendedProducts('hoodie-001', 2)

    expect(recommendations).toHaveLength(2)
    expect(recommendations[0]?.category).toBe('hoodies')
    expect(recommendations.map((product) => product.id)).not.toContain('hoodie-001')
  })
})
