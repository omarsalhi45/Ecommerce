import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { getProductPriceDetails } from './productPricing'

const product: Product = {
  id: 'hoodie-001',
  name: 'Everyday Weight Hoodie',
  description: 'Soft fleece hoodie',
  price: 59.99,
  imageUrl: 'hoodie.jpg',
  category: 'hoodies',
}

describe('getProductPriceDetails', () => {
  it('calculates sale amount and percentage from compare-at pricing', () => {
    expect(getProductPriceDetails({ ...product, compareAtPrice: 79.99 })).toEqual({
      price: 59.99,
      compareAtPrice: 79.99,
      saleAmount: 20,
      salePercent: 25,
      isOnSale: true,
    })
  })

  it('ignores compare-at pricing that is not higher than the current price', () => {
    expect(getProductPriceDetails({ ...product, compareAtPrice: 49.99 })).toEqual({
      price: 59.99,
      compareAtPrice: undefined,
      saleAmount: 0,
      salePercent: 0,
      isOnSale: false,
    })
  })
})
