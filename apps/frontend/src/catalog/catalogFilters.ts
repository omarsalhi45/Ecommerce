import type { Product } from '../types'

export type ProductSort = 'featured' | 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'name'

export interface ProductDiscoveryFilters {
  readonly category: string
  readonly searchTerm: string
  readonly sort: ProductSort
}

export const ALL_CATEGORIES = 'all'

export const formatCategoryLabel = (category: string): string =>
  category
    .split('-')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')

export const getProductCategories = (products: Product[]): string[] => {
  const categories = new Set(products.map((product) => product.category))
  return Array.from(categories).sort((first, second) => first.localeCompare(second))
}

const matchesSearch = (product: Product, normalizedSearch: string): boolean => {
  if (!normalizedSearch) {
    return true
  }

  const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase()
  return searchableText.includes(normalizedSearch)
}

export const applyProductDiscovery = (
  products: Product[],
  filters: ProductDiscoveryFilters
): Product[] => {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter(
    (product) =>
      (filters.category === ALL_CATEGORIES || product.category === filters.category) &&
      matchesSearch(product, normalizedSearch)
  )

  return [...filteredProducts].sort((first, second) => {
    switch (filters.sort) {
      case 'newest':
        return products.indexOf(second) - products.indexOf(first)
      case 'popular':
        return (second.popularityScore ?? 0) - (first.popularityScore ?? 0)
      case 'price-asc':
        return first.price - second.price
      case 'price-desc':
        return second.price - first.price
      case 'name':
        return first.name.localeCompare(second.name)
      case 'featured':
        return products.indexOf(first) - products.indexOf(second)
    }
  })
}

export const getRelatedProducts = (products: Product[], product: Product, limit = 3): Product[] => {
  const sameCategory = products.filter(
    (candidate) => candidate.id !== product.id && candidate.category === product.category
  )
  const fallback = products.filter(
    (candidate) => candidate.id !== product.id && candidate.category !== product.category
  )

  return [...sameCategory, ...fallback].slice(0, limit)
}
