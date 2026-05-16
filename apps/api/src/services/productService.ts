import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  createProductInDb,
  deactivateProductInDb,
  getInventoryFromDb,
  getProductFromDb,
  getProductsFromDb,
  updateInventoryInDb,
  updateProductInDb,
} from '../repositories/productRepository'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  category: string
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
  },
  {
    id: 'jacket-001',
    name: 'Night Run Windbreaker',
    description: 'Lightweight shell with a crisp finish for city weather.',
    price: 79.99,
    imageUrl:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80',
    category: 'outerwear',
  },
  {
    id: 'hoodie-001',
    name: 'Everyday Weight Hoodie',
    description: 'Soft fleece hoodie cut for layering without feeling bulky.',
    price: 59.99,
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    category: 'hoodies',
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

export const getAllProducts = async (): Promise<Product[]> => {
  if (isDatabaseConfigured) {
    return getProductsFromDb()
  }

  return products
}

export const getProduct = async (id: string): Promise<Product | undefined> => {
  if (isDatabaseConfigured) {
    return getProductFromDb(id)
  }

  return products.find((product) => product.id === id)
}

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  if (isDatabaseConfigured) {
    return createProductInDb(input)
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

  return product
}

export const updateProduct = async (
  productId: string,
  input: UpdateProductInput
): Promise<Product | undefined> => {
  if (isDatabaseConfigured) {
    return updateProductInDb(productId, input)
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
    return updateInventoryInDb(productId, stockQuantity)
  }

  const inventoryItem = inventory.find((item) => item.product.id === productId)

  if (!inventoryItem) {
    return undefined
  }

  Object.assign(inventoryItem, { stockQuantity })

  return inventoryItem
}

export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (isDatabaseConfigured) {
    return deactivateProductInDb(productId)
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

  return true
}

export const resetProductStoreForTests = () => {
  products.splice(3, products.length - 3)
  inventory.splice(3, inventory.length - 3)
}
