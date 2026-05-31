import type { Product } from '../types'

export type ProductSort = 'featured' | 'newest' | 'popular' | 'price-asc' | 'price-desc' | 'name'
export type ProductPriceRange = 'all' | 'under-30' | '30-60' | '60-90' | '90-plus'

export interface ProductDiscoveryFilters {
  readonly category: string
  readonly searchTerm: string
  readonly sort: ProductSort
  readonly sizes?: readonly string[]
  readonly colors?: readonly string[]
  readonly priceRange?: ProductPriceRange
  readonly inStockOnly?: boolean
  readonly minRating?: number
}

export const ALL_CATEGORIES = 'all'
export const ALL_PRICES: ProductPriceRange = 'all'

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

const isString = (value: string | undefined): value is string => Boolean(value)

export const getProductSizes = (products: Product[]): string[] => {
  const sizes = products.flatMap(
    (product) => product.variants?.map((variant) => variant.size).filter(isString) ?? []
  )
  return Array.from(new Set(sizes)).sort((first, second) => first.localeCompare(second))
}

export const getProductColors = (products: Product[]): string[] => {
  const colors = products.flatMap(
    (product) => product.variants?.map((variant) => variant.color).filter(isString) ?? []
  )
  return Array.from(new Set(colors)).sort((first, second) => first.localeCompare(second))
}

const matchesSearch = (product: Product, normalizedSearch: string): boolean => {
  if (!normalizedSearch) {
    return true
  }

  const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase()
  return searchableText.includes(normalizedSearch)
}

const matchesSelectedVariantField = (
  product: Product,
  selectedValues: readonly string[] | undefined,
  field: 'size' | 'color'
): boolean => {
  if (!selectedValues?.length) {
    return true
  }

  return (
    product.variants?.some((variant) => {
      const value = variant[field]
      return Boolean(value && selectedValues.includes(value))
    }) ?? false
  )
}

const matchesPriceRange = (
  product: Product,
  priceRange: ProductPriceRange | undefined
): boolean => {
  switch (priceRange ?? ALL_PRICES) {
    case 'under-30':
      return product.price < 30
    case '30-60':
      return product.price >= 30 && product.price < 60
    case '60-90':
      return product.price >= 60 && product.price < 90
    case '90-plus':
      return product.price >= 90
    case 'all':
      return true
  }
}

const hasInStockVariant = (product: Product): boolean =>
  product.variants?.some((variant) => variant.stockQuantity > 0) ?? true

export const applyProductDiscovery = (
  products: Product[],
  filters: ProductDiscoveryFilters
): Product[] => {
  const normalizedSearch = filters.searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter(
    (product) =>
      (filters.category === ALL_CATEGORIES || product.category === filters.category) &&
      matchesSearch(product, normalizedSearch) &&
      matchesSelectedVariantField(product, filters.sizes, 'size') &&
      matchesSelectedVariantField(product, filters.colors, 'color') &&
      matchesPriceRange(product, filters.priceRange) &&
      (!filters.inStockOnly || hasInStockVariant(product)) &&
      (product.ratingSummary?.averageRating ?? 0) >= (filters.minRating ?? 0)
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
