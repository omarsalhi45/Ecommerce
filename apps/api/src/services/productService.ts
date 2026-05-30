import { apiConfig } from '../config'
import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  createProductInDb,
  deactivateProductInDb,
  getInventoryFromDb,
  getProductFromDb,
  getProductReviewsFromDb,
  getProductsFromDb,
  updateInventoryInDb,
  updateProductInDb,
} from '../repositories/productRepository'
import { clearCacheByPrefix, getCachedValue, setCachedValue } from './cacheService'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
  variants?: ProductVariant[]
  popularityScore?: number
  ratingSummary?: ProductRatingSummary
}

export interface ProductVariant {
  readonly sku: string
  readonly size?: string
  readonly color?: string
  readonly stockQuantity: number
}

export interface ProductRatingSummary {
  readonly averageRating: number
  readonly reviewCount: number
}

export interface ProductReview {
  readonly id: string
  readonly productId: string
  readonly authorName: string
  readonly rating: number
  readonly title: string
  readonly body: string
  readonly createdAt: string
}

export interface CreateProductInput extends Product {
  readonly sku?: string
  readonly size?: string
  readonly color?: string
  readonly stockQuantity?: number
  readonly lowStockThreshold?: number
}

export interface UpdateProductInput {
  readonly name?: string
  readonly description?: string
  readonly price?: number
  readonly imageUrl?: string
  readonly category?: string
}

export interface InventoryItem {
  readonly product: Product
  readonly sku: string
  readonly size?: string
  readonly color?: string
  readonly stockQuantity: number
  readonly lowStockThreshold: number
}

const products: Product[] = [
  {
    id: 'shirt-001',
    name: 'Box Fit Street Tee',
    description: 'Heavy cotton tee with a relaxed shape and clean OSAI mark.',
    price: 29.99,
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    category: 'tees',
    popularityScore: 88,
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight shell with a crisp finish for city weather.',
    price: 79.99,
    imageUrl:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
    category: 'outerwear',
    popularityScore: 72,
  },
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie cut for layering without feeling bulky.',
    price: 59.99,
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
    popularityScore: 95,
  },
]

const inventory: InventoryItem[] = [
  {
    product: products[0],
    sku: 'OSAI-TEE-BLK-M',
    size: 'M',
    color: 'Black',
    stockQuantity: 48,
    lowStockThreshold: 8,
  },
  {
    product: products[1],
    sku: 'OSAI-WIND-BLK-L',
    size: 'L',
    color: 'Black',
    stockQuantity: 21,
    lowStockThreshold: 5,
  },
  {
    product: products[2],
    sku: 'OSAI-HOOD-GRY-M',
    size: 'M',
    color: 'Grey',
    stockQuantity: 34,
    lowStockThreshold: 6,
  },
]

const productReviews: ProductReview[] = [
  {
    id: 'review-shirt-001-1',
    productId: 'shirt-001',
    authorName: 'Maya',
    rating: 5,
    title: 'Perfect boxy shape',
    body: 'The cotton feels heavy without being stiff, and the fit lands exactly right.',
    createdAt: '2026-01-14T10:00:00.000Z',
  },
  {
    id: 'review-shirt-001-2',
    productId: 'shirt-001',
    authorName: 'Noah',
    rating: 4,
    title: 'Easy everyday tee',
    body: 'Clean graphic, good collar, and it works under jackets.',
    createdAt: '2026-01-22T14:30:00.000Z',
  },
  {
    id: 'review-jacket-001-1',
    productId: 'jacket-001',
    authorName: 'Iris',
    rating: 4,
    title: 'Light but useful',
    body: 'Good for windy nights and packs down smaller than expected.',
    createdAt: '2026-02-03T09:15:00.000Z',
  },
  {
    id: 'review-hoodie-001-1',
    productId: 'hoodie-001',
    authorName: 'Leo',
    rating: 5,
    title: 'Soft and structured',
    body: 'Warm enough for late walks but still has a clean streetwear shape.',
    createdAt: '2026-02-11T18:45:00.000Z',
  },
  {
    id: 'review-hoodie-001-2',
    productId: 'hoodie-001',
    authorName: 'Ari',
    rating: 5,
    title: 'Favorite hoodie this month',
    body: 'The fleece is comfortable and the hood sits nicely without bunching.',
    createdAt: '2026-02-18T12:20:00.000Z',
  },
]

const getRatingSummary = (productId: string): ProductRatingSummary => {
  const reviews = productReviews.filter((review) => review.productId === productId)
  const reviewCount = reviews.length

  if (reviewCount === 0) {
    return { averageRating: 0, reviewCount: 0 }
  }

  const averageRating = reviews.reduce((total, review) => total + review.rating, 0) / reviewCount

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount,
  }
}

const withInventoryVariant = (product: Product): Product => {
  const productInventory = inventory.find((item) => item.product.id === product.id)
  const ratingSummary = getRatingSummary(product.id)

  if (!productInventory) {
    return {
      ...product,
      ratingSummary,
    }
  }

  return {
    ...product,
    ratingSummary,
    variants: [
      {
        sku: productInventory.sku,
        size: productInventory.size,
        color: productInventory.color,
        stockQuantity: productInventory.stockQuantity,
      },
    ],
  }
}

export const getAllProducts = async (): Promise<Product[]> => {
  const cachedProducts = getCachedValue<Product[]>('products:all')

  if (cachedProducts) {
    return cachedProducts
  }

  if (isDatabaseConfigured) {
    return setCachedValue(
      'products:all',
      await getProductsFromDb(),
      apiConfig.productCacheTtlSeconds
    )
  }

  return setCachedValue(
    'products:all',
    products.map(withInventoryVariant),
    apiConfig.productCacheTtlSeconds
  )
}

export const getProduct = async (id: string): Promise<Product | undefined> => {
  const cacheKey = `products:${id}`
  const cachedProduct = getCachedValue<Product | undefined>(cacheKey)

  if (cachedProduct) {
    return cachedProduct
  }

  if (isDatabaseConfigured) {
    return setCachedValue(cacheKey, await getProductFromDb(id), apiConfig.productCacheTtlSeconds)
  }

  const product = products.find((candidate) => candidate.id === id)
  return setCachedValue(
    cacheKey,
    product ? withInventoryVariant(product) : undefined,
    apiConfig.productCacheTtlSeconds
  )
}

export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  if (isDatabaseConfigured) {
    return getProductReviewsFromDb(productId)
  }

  return productReviews.filter((review) => review.productId === productId)
}

export const getRecommendedProducts = async (productId?: string, limit = 4): Promise<Product[]> => {
  const allProducts = await getAllProducts()
  const anchorProduct = productId
    ? allProducts.find((product) => product.id === productId)
    : undefined

  return allProducts
    .filter((product) => product.id !== productId)
    .sort((first, second) => {
      const firstCategoryScore =
        anchorProduct && first.category === anchorProduct.category ? 1000 : 0
      const secondCategoryScore =
        anchorProduct && second.category === anchorProduct.category ? 1000 : 0
      const firstScore =
        firstCategoryScore +
        (first.popularityScore ?? 0) +
        (first.ratingSummary?.averageRating ?? 0) * 10
      const secondScore =
        secondCategoryScore +
        (second.popularityScore ?? 0) +
        (second.ratingSummary?.averageRating ?? 0) * 10

      return secondScore - firstScore || first.name.localeCompare(second.name)
    })
    .slice(0, limit)
}

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  if (isDatabaseConfigured) {
    const product = await createProductInDb(input)
    clearCacheByPrefix('products:')
    return product
  }

  if (products.some((product) => product.id === input.id)) {
    throw new ApiError(409, 'Product already exists', 'PRODUCT_EXISTS')
  }

  const product: Product = {
    id: input.id,
    name: input.name,
    description: input.description,
    price: input.price,
    imageUrl: input.imageUrl,
    category: input.category,
  }

  products.push(product)
  inventory.push({
    product,
    sku: input.sku ?? input.id.toUpperCase(),
    size: input.size,
    color: input.color,
    stockQuantity: input.stockQuantity ?? 0,
    lowStockThreshold: input.lowStockThreshold ?? 5,
  })

  clearCacheByPrefix('products:')

  return product
}

export const updateProduct = async (
  productId: string,
  input: UpdateProductInput
): Promise<Product | undefined> => {
  if (isDatabaseConfigured) {
    const product = await updateProductInDb(productId, input)
    clearCacheByPrefix('products:')
    return product
  }

  const product = products.find((candidate) => candidate.id === productId)

  if (!product) {
    return undefined
  }

  Object.assign(product, {
    name: input.name ?? product.name,
    description: input.description ?? product.description,
    price: input.price ?? product.price,
    imageUrl: input.imageUrl ?? product.imageUrl,
    category: input.category ?? product.category,
  })

  clearCacheByPrefix('products:')

  return product
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  if (isDatabaseConfigured) {
    return getInventoryFromDb()
  }

  return inventory
}

export const updateInventory = async (
  productId: string,
  stockQuantity: number
): Promise<InventoryItem | undefined> => {
  if (isDatabaseConfigured) {
    const item = await updateInventoryInDb(productId, stockQuantity)
    clearCacheByPrefix('products:')
    return item
  }

  const inventoryItem = inventory.find((item) => item.product.id === productId)

  if (!inventoryItem) {
    return undefined
  }

  Object.assign(inventoryItem, { stockQuantity })
  clearCacheByPrefix('products:')

  return inventoryItem
}

export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (isDatabaseConfigured) {
    const deleted = await deactivateProductInDb(productId)
    clearCacheByPrefix('products:')
    return deleted
  }

  const productIndex = products.findIndex((product) => product.id === productId)

  if (productIndex === -1) {
    return false
  }

  products.splice(productIndex, 1)
  const inventoryIndex = inventory.findIndex((item) => item.product.id === productId)

  if (inventoryIndex >= 0) {
    inventory.splice(inventoryIndex, 1)
  }

  clearCacheByPrefix('products:')

  return true
}

export const resetProductStoreForTests = () => {
  products.splice(3, products.length - 3)
  inventory.splice(3, inventory.length - 3)
}
