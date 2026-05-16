import { describe, expect, it } from 'vitest'
import { getAllProducts, getProduct } from '../src/services/productService'

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
    })
  })

  it('returns undefined for an unknown product id', async () => {
    const product = await getProduct('missing-product')

    expect(product).toBeUndefined()
  })
})
