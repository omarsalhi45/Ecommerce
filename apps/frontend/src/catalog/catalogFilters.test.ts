import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import {
  ALL_CATEGORIES,
  applyProductDiscovery,
  formatCategoryLabel,
  getProductCategories,
  getRelatedProducts,
} from './catalogFilters'

const products: Product[] = [
  {
    id: 'shirt-001',
    name: 'Box Fit Street Tee',
    description: 'Heavy cotton tee',
    price: 29.99,
    imageUrl: 'shirt.jpg',
    category: 'tees',
    popularityScore: 88,
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight city shell',
    price: 79.99,
    imageUrl: 'jacket.jpg',
    category: 'outerwear',
    popularityScore: 72,
  },
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
    popularityScore: 95,
  },
]

describe('catalogFilters', () => {
  it('formats category labels for shopper-facing controls', () => {
    expect(formatCategoryLabel('street-layers')).toBe('Street Layers')
  })

  it('returns sorted unique categories', () => {
    expect(getProductCategories(products)).toEqual(['hoodies', 'outerwear', 'tees'])
  })

  it('filters products by category and search term', () => {
    const visibleProducts = applyProductDiscovery(products, {
      category: 'outerwear',
      searchTerm: 'shell',
      sort: 'featured',
    })

    expect(visibleProducts.map((product) => product.id)).toEqual(['jacket-001'])
  })

  it('searches names, descriptions, and categories without mutating the source list', () => {
    const visibleProducts = applyProductDiscovery(products, {
      category: ALL_CATEGORIES,
      searchTerm: 'hood',
      sort: 'featured',
    })

    expect(visibleProducts.map((product) => product.id)).toEqual(['hoodie-001'])
    expect(products.map((product) => product.id)).toEqual(['shirt-001', 'jacket-001', 'hoodie-001'])
  })

  it('sorts products by price and latest catalog position', () => {
    expect(
      applyProductDiscovery(products, {
        category: ALL_CATEGORIES,
        searchTerm: '',
        sort: 'price-desc',
      }).map((product) => product.id)
    ).toEqual(['jacket-001', 'hoodie-001', 'shirt-001'])

    expect(
      applyProductDiscovery(products, {
        category: ALL_CATEGORIES,
        searchTerm: '',
        sort: 'newest',
      }).map((product) => product.id)
    ).toEqual(['hoodie-001', 'jacket-001', 'shirt-001'])
  })

  it('sorts products by popularity metadata', () => {
    expect(
      applyProductDiscovery(products, {
        category: ALL_CATEGORIES,
        searchTerm: '',
        sort: 'popular',
      }).map((product) => product.id)
    ).toEqual(['hoodie-001', 'shirt-001', 'jacket-001'])
  })

  it('returns same-category related products first with fallback items', () => {
    const relatedProducts = getRelatedProducts(
      [
        ...products,
        {
          id: 'tee-002',
          name: 'Washed Pocket Tee',
          description: 'Soft washed cotton tee',
          price: 34,
          imageUrl: 'tee.jpg',
          category: 'tees',
        },
      ],
      products[0],
      2
    )

    expect(relatedProducts.map((product) => product.id)).toEqual(['tee-002', 'jacket-001'])
  })
})
