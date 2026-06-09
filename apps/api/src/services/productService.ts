import { apiConfig } from '../config'
import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  createProductInDb,
  deactivateProductInDb,
  deleteProductPermanentlyInDb,
  getAdminProductsFromDb,
  getInventoryFromDb,
  getProductFromDb,
  getProductReviewsFromDb,
  getProductsFromDb,
  setProductActiveInDb,
  updateInventoryBySkuInDb,
  updateInventoryInDb,
  updateProductInDb,
} from '../repositories/productRepository'
import { clearCacheByPrefix, getCachedValue, setCachedValue } from './cacheService'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  compareAtPrice?: number
  imageUrl: string
  category: string
  isActive?: boolean
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
  readonly compareAtPrice?: number | null
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
    id: 'tee-002',
    name: 'Washed Logo Tee',
    description: 'Sun-faded cotton tee with a soft hand feel and small chest mark.',
    price: 34.99,
    compareAtPrice: 44.99,
    imageUrl:
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
    category: 'tees',
    popularityScore: 91,
  },
  {
    id: 'tee-003',
    name: 'Cropped Rib Tank',
    description: 'Clean ribbed tank built for warm days, gym layers, and open shirts.',
    price: 24.99,
    imageUrl:
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80',
    category: 'tees',
    popularityScore: 76,
  },
  {
    id: 'tee-004',
    name: 'Long Sleeve Skater Tee',
    description: 'Midweight long sleeve with dropped shoulders and sleeve hit graphics.',
    price: 42.99,
    imageUrl:
      'https://images.unsplash.com/photo-1506629905607-d405b7a30db9?auto=format&fit=crop&w=900&q=80',
    category: 'tees',
    popularityScore: 84,
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
    id: 'jacket-002',
    name: 'Canvas Coach Jacket',
    description: 'Structured cotton canvas jacket with snap front and roomy pockets.',
    price: 89.99,
    imageUrl:
      'https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80',
    category: 'outerwear',
    popularityScore: 83,
  },
  {
    id: 'jacket-003',
    name: 'Puffer Vest Layer',
    description: 'Light insulated vest for hoodies, cold mornings, and late train rides.',
    price: 69.99,
    compareAtPrice: 89.99,
    imageUrl:
      'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=900&q=80',
    category: 'outerwear',
    popularityScore: 78,
  },
  {
    id: 'jacket-004',
    name: 'Cropped Denim Jacket',
    description: 'Boxy denim jacket with a washed finish and sharp cropped proportion.',
    price: 94.99,
    imageUrl:
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80',
    category: 'outerwear',
    popularityScore: 86,
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
  {
    id: 'hoodie-002',
    name: 'Zip Layer Hoodie',
    description: 'Full-zip fleece hoodie with a slightly cropped body and double zipper.',
    price: 64.99,
    imageUrl:
      'https://images.unsplash.com/photo-1578681994506-b8f463449011?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
    popularityScore: 90,
  },
  {
    id: 'hoodie-003',
    name: 'Oversized Graphic Hoodie',
    description: 'Heavy fleece hoodie with a large back graphic and stacked cuffs.',
    price: 74.99,
    compareAtPrice: 94.99,
    imageUrl:
      'https://images.unsplash.com/photo-1565693413579-8ff3fdc1b03b?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
    popularityScore: 97,
  },
  {
    id: 'sweatshirt-001',
    name: 'Quarter Zip Sweatshirt',
    description: 'Soft collar sweatshirt for clean layering over tees or tanks.',
    price: 54.99,
    imageUrl:
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
    popularityScore: 81,
  },
  {
    id: 'pants-001',
    name: 'Wide Cargo Trouser',
    description: 'Wide-leg cargo pant with adjustable hems and deep side pockets.',
    price: 69.99,
    compareAtPrice: 84.99,
    imageUrl:
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    category: 'bottoms',
    popularityScore: 94,
  },
  {
    id: 'pants-002',
    name: 'Relaxed Utility Jean',
    description: 'Relaxed denim with workwear pocketing and a broken-in wash.',
    price: 74.99,
    imageUrl:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
    category: 'bottoms',
    popularityScore: 87,
  },
  {
    id: 'shorts-001',
    name: 'Nylon Trail Short',
    description: 'Light nylon shorts with mesh pockets and an easy elastic waist.',
    price: 44.99,
    imageUrl:
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=80',
    category: 'bottoms',
    popularityScore: 75,
  },
  {
    id: 'skirt-001',
    name: 'Pleated Court Skirt',
    description: 'Crisp pleated skirt with hidden shorts and a street-sport shape.',
    price: 49.99,
    imageUrl:
      'https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=80',
    category: 'bottoms',
    popularityScore: 82,
  },
  {
    id: 'cap-001',
    name: 'Low Profile Cap',
    description: 'Curved-brim cap with tonal embroidery and an adjustable back strap.',
    price: 24.99,
    imageUrl:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80',
    category: 'accessories',
    popularityScore: 79,
  },
  {
    id: 'bag-001',
    name: 'City Sling Bag',
    description: 'Compact crossbody sling with enough space for phone, keys, and wallet.',
    price: 39.99,
    imageUrl:
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
    category: 'accessories',
    popularityScore: 89,
  },
  {
    id: 'beanie-001',
    name: 'Rib Knit Beanie',
    description: 'Soft ribbed beanie with a shallow fold and subtle woven label.',
    price: 19.99,
    compareAtPrice: 29.99,
    imageUrl:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    category: 'accessories',
    popularityScore: 73,
  },
  {
    id: 'socks-001',
    name: 'Heavy Crew Sock Pack',
    description: 'Three-pack of cushioned crew socks with ribbed cuffs and logo knit.',
    price: 18.99,
    imageUrl:
      'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=80',
    category: 'accessories',
    popularityScore: 70,
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
    sku: 'OSAI-WASH-NAT-M',
    size: 'M',
    color: 'Natural',
    stockQuantity: 18,
    lowStockThreshold: 6,
  },
  {
    product: products[2],
    sku: 'OSAI-TANK-WHT-S',
    size: 'S',
    color: 'White',
    stockQuantity: 15,
    lowStockThreshold: 6,
  },
  {
    product: products[3],
    sku: 'OSAI-LS-BLU-L',
    size: 'L',
    color: 'Blue',
    stockQuantity: 11,
    lowStockThreshold: 5,
  },
  {
    product: products[4],
    sku: 'OSAI-WIND-BLK-L',
    size: 'L',
    color: 'Black',
    stockQuantity: 21,
    lowStockThreshold: 5,
  },
  {
    product: products[5],
    sku: 'OSAI-COACH-KHK-M',
    size: 'M',
    color: 'Khaki',
    stockQuantity: 9,
    lowStockThreshold: 4,
  },
  {
    product: products[6],
    sku: 'OSAI-VEST-GRN-L',
    size: 'L',
    color: 'Green',
    stockQuantity: 5,
    lowStockThreshold: 5,
  },
  {
    product: products[7],
    sku: 'OSAI-DENIM-BLU-M',
    size: 'M',
    color: 'Blue',
    stockQuantity: 13,
    lowStockThreshold: 5,
  },
  {
    product: products[8],
    sku: 'OSAI-HOOD-GRY-M',
    size: 'M',
    color: 'Grey',
    stockQuantity: 34,
    lowStockThreshold: 6,
  },
  {
    product: products[9],
    sku: 'OSAI-ZIP-BLK-S',
    size: 'S',
    color: 'Black',
    stockQuantity: 12,
    lowStockThreshold: 5,
  },
  {
    product: products[10],
    sku: 'OSAI-GRAPH-RED-L',
    size: 'L',
    color: 'Red',
    stockQuantity: 4,
    lowStockThreshold: 5,
  },
  {
    product: products[11],
    sku: 'OSAI-QZIP-CRM-M',
    size: 'M',
    color: 'Cream',
    stockQuantity: 16,
    lowStockThreshold: 6,
  },
  {
    product: products[12],
    sku: 'OSAI-CARGO-BLK-M',
    size: 'M',
    color: 'Black',
    stockQuantity: 7,
    lowStockThreshold: 5,
  },
  {
    product: products[13],
    sku: 'OSAI-JEAN-BLU-32',
    size: '32',
    color: 'Blue',
    stockQuantity: 14,
    lowStockThreshold: 5,
  },
  {
    product: products[14],
    sku: 'OSAI-SHORT-GRN-M',
    size: 'M',
    color: 'Green',
    stockQuantity: 20,
    lowStockThreshold: 6,
  },
  {
    product: products[15],
    sku: 'OSAI-SKIRT-BLK-S',
    size: 'S',
    color: 'Black',
    stockQuantity: 6,
    lowStockThreshold: 4,
  },
  {
    product: products[16],
    sku: 'OSAI-CAP-BLK-OS',
    size: 'OS',
    color: 'Black',
    stockQuantity: 32,
    lowStockThreshold: 8,
  },
  {
    product: products[17],
    sku: 'OSAI-SLING-GRY-OS',
    size: 'OS',
    color: 'Grey',
    stockQuantity: 10,
    lowStockThreshold: 4,
  },
  {
    product: products[18],
    sku: 'OSAI-BEANIE-GRN-OS',
    size: 'OS',
    color: 'Green',
    stockQuantity: 3,
    lowStockThreshold: 5,
  },
  {
    product: products[19],
    sku: 'OSAI-SOCK-WHT-OS',
    size: 'OS',
    color: 'White',
    stockQuantity: 40,
    lowStockThreshold: 10,
  },
]

const baseProductCount = products.length
const baseInventoryCount = inventory.length

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
  {
    id: 'review-tee-002-1',
    productId: 'tee-002',
    authorName: 'Jules',
    rating: 5,
    title: 'Vintage feel right away',
    body: 'The wash looks already broken in, but the collar still feels sturdy.',
    createdAt: '2026-03-01T11:00:00.000Z',
  },
  {
    id: 'review-hoodie-003-1',
    productId: 'hoodie-003',
    authorName: 'Nina',
    rating: 5,
    title: 'Big hoodie energy',
    body: 'Oversized without swallowing the whole outfit. The back graphic gets noticed.',
    createdAt: '2026-03-04T16:30:00.000Z',
  },
  {
    id: 'review-pants-001-1',
    productId: 'pants-001',
    authorName: 'Kai',
    rating: 5,
    title: 'Pocket layout is perfect',
    body: 'The shape sits wide but clean, and the cargo pockets do not balloon out.',
    createdAt: '2026-03-08T13:20:00.000Z',
  },
  {
    id: 'review-bag-001-1',
    productId: 'bag-001',
    authorName: 'Sami',
    rating: 4,
    title: 'Good city size',
    body: 'Fits daily stuff without feeling like a full backpack. Strap is comfortable.',
    createdAt: '2026-03-11T09:45:00.000Z',
  },
  {
    id: 'review-beanie-001-1',
    productId: 'beanie-001',
    authorName: 'Mina',
    rating: 5,
    title: 'Soft and not itchy',
    body: 'The fold sits low and the knit feels warmer than expected.',
    createdAt: '2026-03-14T19:10:00.000Z',
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
    products.filter((product) => product.isActive !== false).map(withInventoryVariant),
    apiConfig.productCacheTtlSeconds
  )
}

export const getAdminProducts = async (): Promise<Product[]> => {
  if (isDatabaseConfigured) {
    return getAdminProductsFromDb()
  }

  return products.map(withInventoryVariant)
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

  const product = products.find((candidate) => candidate.id === id && candidate.isActive !== false)
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
    compareAtPrice: input.compareAtPrice,
    imageUrl: input.imageUrl,
    category: input.category,
    isActive: true,
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
    compareAtPrice:
      input.compareAtPrice === undefined
        ? product.compareAtPrice
        : (input.compareAtPrice ?? undefined),
    imageUrl: input.imageUrl ?? product.imageUrl,
    category: input.category ?? product.category,
  })

  clearCacheByPrefix('products:')

  return product
}

export const setProductActive = async (
  productId: string,
  isActive: boolean
): Promise<Product | undefined> => {
  if (isDatabaseConfigured) {
    const product = await setProductActiveInDb(productId, isActive)
    clearCacheByPrefix('products:')
    return product
  }

  const product = products.find((candidate) => candidate.id === productId)

  if (!product) {
    return undefined
  }

  product.isActive = isActive
  clearCacheByPrefix('products:')

  return product
}

export const getInventory = async (): Promise<InventoryItem[]> => {
  if (isDatabaseConfigured) {
    return getInventoryFromDb()
  }

  return inventory.filter((item) => item.product.isActive !== false)
}

export const updateInventory = async (
  productId: string,
  input: {
    readonly stockQuantity?: number
    readonly lowStockThreshold?: number
  }
): Promise<InventoryItem | undefined> => {
  if (isDatabaseConfigured) {
    const item = await updateInventoryInDb(productId, input)
    clearCacheByPrefix('products:')
    return item
  }

  const inventoryItem = inventory.find((item) => item.product.id === productId)

  if (!inventoryItem) {
    return undefined
  }

  Object.assign(inventoryItem, input)
  clearCacheByPrefix('products:')

  return inventoryItem
}

export const updateInventoryBySku = async (
  sku: string,
  input: {
    readonly stockQuantity?: number
    readonly lowStockThreshold?: number
  }
): Promise<InventoryItem | undefined> => {
  if (isDatabaseConfigured) {
    const item = await updateInventoryBySkuInDb(sku, input)
    clearCacheByPrefix('products:')
    return item
  }

  const inventoryItem = inventory.find((item) => item.sku === sku)

  if (!inventoryItem) {
    return undefined
  }

  Object.assign(inventoryItem, input)
  clearCacheByPrefix('products:')

  return inventoryItem
}

export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (isDatabaseConfigured) {
    const deleted = await deactivateProductInDb(productId)
    clearCacheByPrefix('products:')
    return deleted
  }

  return Boolean(await setProductActive(productId, false))
}

export const deleteProductPermanently = async (productId: string): Promise<boolean> => {
  if (isDatabaseConfigured) {
    const deleted = await deleteProductPermanentlyInDb(productId)
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
  products.splice(baseProductCount, products.length - baseProductCount)
  inventory.splice(baseInventoryCount, inventory.length - baseInventoryCount)
}
