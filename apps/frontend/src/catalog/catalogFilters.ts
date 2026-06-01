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
const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const getSearchTokens = (product: Product): string[] => {
  const variantText =
    product.variants?.flatMap((variant) => [variant.size, variant.color]).filter(isString) ?? []
  const searchableText = `${product.name} ${product.description} ${product.category} ${variantText.join(
    ' '
  )}`

  return normalizeSearchText(searchableText).split(' ').filter(Boolean)
}

const getEditDistance = (first: string, second: string): number => {
  const distances = Array.from({ length: first.length + 1 }, (_, row) =>
    Array.from({ length: second.length + 1 }, (_, column) => (row === 0 ? column : row))
  )

  for (let row = 1; row <= first.length; row += 1) {
    distances[row][0] = row
  }

  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1
      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + cost
      )
    }
  }

  return distances[first.length][second.length]
}

const getTypoTolerance = (queryToken: string): number => {
  if (queryToken.length <= 3) {
    return 0
  }

  return queryToken.length <= 6 ? 1 : 2
}

const tokenMatches = (queryToken: string, productToken: string): boolean => {
  if (productToken.includes(queryToken)) {
    return true
  }

  return getEditDistance(queryToken, productToken) <= getTypoTolerance(queryToken)
}

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

  const tokens = getSearchTokens(product)
  const queryTokens = normalizedSearch.split(' ').filter(Boolean)

  return queryTokens.every((queryToken) =>
    tokens.some((productToken) => tokenMatches(queryToken, productToken))
  )
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

const getOutfitCategoryPriority = (category: string): string[] => {
  const normalizedCategory = category.toLowerCase()

  if (normalizedCategory.includes('bottom')) {
    return ['tees', 'hoodies', 'outerwear', 'accessories']
  }

  if (normalizedCategory.includes('tee')) {
    return ['bottoms', 'outerwear', 'hoodies', 'accessories']
  }

  if (normalizedCategory.includes('accessor')) {
    return ['hoodies', 'tees', 'bottoms', 'outerwear']
  }

  return ['bottoms', 'tees', 'accessories', 'outerwear', 'hoodies']
}

export const getCompleteTheFitProducts = (
  products: Product[],
  product: Product,
  limit = 3
): Product[] => {
  const priority = getOutfitCategoryPriority(product.category)

  return products
    .filter((candidate) => candidate.id !== product.id && candidate.category !== product.category)
    .sort((first, second) => {
      const firstPriority = priority.indexOf(first.category)
      const secondPriority = priority.indexOf(second.category)
      const normalizedFirstPriority = firstPriority === -1 ? priority.length : firstPriority
      const normalizedSecondPriority = secondPriority === -1 ? priority.length : secondPriority

      if (normalizedFirstPriority !== normalizedSecondPriority) {
        return normalizedFirstPriority - normalizedSecondPriority
      }

      return (second.popularityScore ?? 0) - (first.popularityScore ?? 0)
    })
    .slice(0, limit)
}

export const getSearchSuggestions = (
  products: Product[],
  searchTerm: string,
  limit = 6
): string[] => {
  const normalizedSearch = normalizeSearchText(searchTerm)

  if (normalizedSearch.length < 2) {
    return []
  }

  const candidates = products.flatMap((product) => [
    product.name,
    formatCategoryLabel(product.category),
    ...(product.variants?.map((variant) => variant.color).filter(isString) ?? []),
  ])

  return Array.from(new Set(candidates))
    .filter((candidate) => {
      const candidateTokens = normalizeSearchText(candidate).split(' ').filter(Boolean)
      return normalizedSearch
        .split(' ')
        .filter(Boolean)
        .every((queryToken) =>
          candidateTokens.some((candidateToken) => tokenMatches(queryToken, candidateToken))
        )
    })
    .slice(0, limit)
}

export const getNoResultsRecommendations = (
  products: Product[],
  filters: ProductDiscoveryFilters,
  limit = 4
): Product[] => {
  const relaxedMatches = applyProductDiscovery(products, {
    ...filters,
    searchTerm: '',
    sort: 'popular',
  })

  const source = relaxedMatches.length
    ? relaxedMatches
    : applyProductDiscovery(products, {
        category: ALL_CATEGORIES,
        searchTerm: '',
        sort: 'popular',
      })

  return source.slice(0, limit)
}
