import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import {
  ALL_CATEGORIES,
  applyProductDiscovery,
  formatCategoryLabel,
  getNoResultsRecommendations,
  getProductCategories,
  getProductColors,
  getProductSizes,
  getRelatedProducts,
  getSearchSuggestions,
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
    ratingSummary: {
      averageRating: 4.5,
      reviewCount: 2,
    },
    variants: [
      {
        sku: 'shirt-001-black-m',
        size: 'M',
        color: 'Black',
        stockQuantity: 8,
      },
    ],
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight city shell',
    price: 79.99,
    imageUrl: 'jacket.jpg',
    category: 'outerwear',
    popularityScore: 72,
    ratingSummary: {
      averageRating: 4,
      reviewCount: 1,
    },
    variants: [
      {
        sku: 'jacket-001-black-l',
        size: 'L',
        color: 'Black',
        stockQuantity: 0,
      },
    ],
  },
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie',
    price: 59.99,
    imageUrl: 'hoodie.jpg',
    category: 'hoodies',
    popularityScore: 95,
    ratingSummary: {
      averageRating: 5,
      reviewCount: 2,
    },
    variants: [
      {
        sku: 'hoodie-001-grey-m',
        size: 'M',
        color: 'Grey',
        stockQuantity: 3,
      },
    ],
  },
]

describe('catalogFilters', () => {
  it('formats category labels for shopper-facing controls', () => {
    expect(formatCategoryLabel('street-layers')).toBe('Street Layers')
  })

  it('returns sorted unique categories', () => {
    expect(getProductCategories(products)).toEqual(['hoodies', 'outerwear', 'tees'])
  })

  it('returns sorted unique variant sizes and colors', () => {
    expect(getProductSizes(products)).toEqual(['L', 'M'])
    expect(getProductColors(products)).toEqual(['Black', 'Grey'])
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

  it('matches small search typos against product text', () => {
    const visibleProducts = applyProductDiscovery(products, {
      category: ALL_CATEGORIES,
      searchTerm: 'hoddie',
      sort: 'featured',
    })

    expect(visibleProducts.map((product) => product.id)).toEqual(['hoodie-001'])
  })

  it('returns autocomplete suggestions from product names, categories, and colors', () => {
    expect(getSearchSuggestions(products, 'hoo')).toEqual(['Everyday Weight Hoodie', 'Hoodies'])
    expect(getSearchSuggestions(products, 'gre')).toEqual(['Grey'])
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

  it('filters products by variant, price, stock, and rating confidence', () => {
    const visibleProducts = applyProductDiscovery(products, {
      category: ALL_CATEGORIES,
      searchTerm: '',
      sort: 'featured',
      sizes: ['M'],
      colors: ['Grey'],
      priceRange: '30-60',
      inStockOnly: true,
      minRating: 4.8,
    })

    expect(visibleProducts.map((product) => product.id)).toEqual(['hoodie-001'])
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

  it('returns useful recommendations when current filters have no results', () => {
    const recommendedProducts = getNoResultsRecommendations(products, {
      category: ALL_CATEGORIES,
      searchTerm: 'not-a-real-piece',
      sort: 'featured',
      priceRange: '90-plus',
    })

    expect(recommendedProducts.map((product) => product.id)).toEqual([
      'hoodie-001',
      'shirt-001',
      'jacket-001',
    ])
  })
})
