import type { Request, Response } from 'express'
import { ApiError } from '../middleware/errorMiddleware'
import { listUsers } from '../services/authService'
import {
  type OrderStatus,
  getOrderAnalytics,
  getOrderList,
  updateOrderStatus,
} from '../services/orderService'
import {
  createInventoryVariant,
  createProduct,
  deleteInventoryVariantBySku,
  deleteProduct,
  deleteProductPermanently,
  getAdminProducts as getAdminProductsForManagement,
  getInventory,
  setProductActive,
  updateInventory,
  updateInventoryBySku,
  updateProduct,
} from '../services/productService'

const orderStatuses: OrderStatus[] = ['pending', 'shipped', 'delivered', 'cancelled']

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const readString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${fieldName} is required`, 'VALIDATION_ERROR')
  }

  return value.trim()
}

const readOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.trim() || undefined
}

const readOptionalNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null
  }

  return readOptionalString(value)
}

const readOptionalProductQuestions = (value: unknown) => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (!Array.isArray(value)) {
    throw new ApiError(400, 'Product questions must be a list', 'VALIDATION_ERROR')
  }

  const questions = value.map((item) => {
    if (!isRecord(item)) {
      throw new ApiError(400, 'Product question entries must be objects', 'VALIDATION_ERROR')
    }

    return {
      question: readString(item.question, 'Product question'),
      answer: readString(item.answer, 'Product answer'),
    }
  })

  return questions.length > 0 ? questions : null
}

const readNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    throw new ApiError(400, `${fieldName} must be a positive number`, 'VALIDATION_ERROR')
  }

  return value
}

const readOptionalNumber = (value: unknown, fieldName: string): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  return readNumber(value, fieldName)
}

const readBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new ApiError(400, `${fieldName} is required`, 'VALIDATION_ERROR')
  }

  return value
}

const validateCompareAtPrice = (price: number | undefined, compareAtPrice: number | undefined) => {
  if (price !== undefined && compareAtPrice !== undefined && compareAtPrice <= price) {
    throw new ApiError(400, 'Original price must be higher than the sale price', 'VALIDATION_ERROR')
  }
}

export const getAdminOrders = async (_req: Request, res: Response) => {
  res.json(await getOrderList())
}

export const patchAdminOrderStatus = async (req: Request, res: Response) => {
  if (!isRecord(req.body) || typeof req.body.status !== 'string') {
    throw new ApiError(400, 'Order status is required', 'VALIDATION_ERROR')
  }

  if (!orderStatuses.includes(req.body.status as OrderStatus)) {
    throw new ApiError(400, 'Order status is invalid', 'VALIDATION_ERROR')
  }

  const order = await updateOrderStatus(req.params.id, req.body.status as OrderStatus)

  if (!order) {
    throw new ApiError(404, 'Order not found', 'ORDER_NOT_FOUND')
  }

  res.json(order)
}

export const getAdminProducts = async (_req: Request, res: Response) => {
  res.json({ products: await getAdminProductsForManagement() })
}

export const postAdminProduct = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Product payload is required', 'VALIDATION_ERROR')
  }

  const price = readNumber(req.body.price, 'Product price')
  const compareAtPrice = readOptionalNumber(req.body.compareAtPrice, 'Original price')

  validateCompareAtPrice(price, compareAtPrice)

  const product = await createProduct({
    id: readOptionalString(req.body.id),
    name: readString(req.body.name, 'Product name'),
    description: readString(req.body.description, 'Product description'),
    price,
    compareAtPrice,
    imageUrl: readString(req.body.imageUrl, 'Product image URL'),
    category: readString(req.body.category, 'Product category'),
    modelHeight: readOptionalString(req.body.modelHeight),
    modelSize: readOptionalString(req.body.modelSize),
    fitDescription: readOptionalString(req.body.fitDescription),
    materialDescription: readOptionalString(req.body.materialDescription),
    careInstructions: readOptionalString(req.body.careInstructions),
    productStory: readOptionalString(req.body.productStory),
    productQuestions: readOptionalProductQuestions(req.body.productQuestions) ?? undefined,
    sku: typeof req.body.sku === 'string' ? req.body.sku : undefined,
    size: typeof req.body.size === 'string' ? req.body.size : undefined,
    color: typeof req.body.color === 'string' ? req.body.color : undefined,
    stockQuantity: typeof req.body.stockQuantity === 'number' ? req.body.stockQuantity : undefined,
    lowStockThreshold:
      typeof req.body.lowStockThreshold === 'number' ? req.body.lowStockThreshold : undefined,
  })

  res.status(201).json(product)
}

export const patchAdminProduct = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Product payload is required', 'VALIDATION_ERROR')
  }

  const price = typeof req.body.price === 'number' ? req.body.price : undefined
  const compareAtPrice = readOptionalNumber(req.body.compareAtPrice, 'Original price')

  validateCompareAtPrice(price, compareAtPrice)

  const product = await updateProduct(req.params.id, {
    name: typeof req.body.name === 'string' ? req.body.name : undefined,
    description: typeof req.body.description === 'string' ? req.body.description : undefined,
    price,
    compareAtPrice,
    imageUrl: typeof req.body.imageUrl === 'string' ? req.body.imageUrl : undefined,
    category: typeof req.body.category === 'string' ? req.body.category : undefined,
    modelHeight: readOptionalNullableString(req.body.modelHeight),
    modelSize: readOptionalNullableString(req.body.modelSize),
    fitDescription: readOptionalNullableString(req.body.fitDescription),
    materialDescription: readOptionalNullableString(req.body.materialDescription),
    careInstructions: readOptionalNullableString(req.body.careInstructions),
    productStory: readOptionalNullableString(req.body.productStory),
    productQuestions: readOptionalProductQuestions(req.body.productQuestions),
  })

  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  }

  res.json(product)
}

export const patchAdminProductStatus = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Product status payload is required', 'VALIDATION_ERROR')
  }

  const product = await setProductActive(req.params.id, readBoolean(req.body.isActive, 'isActive'))

  if (!product) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  }

  res.json(product)
}

export const deleteAdminProduct = async (req: Request, res: Response) => {
  const deleted = await deleteProduct(req.params.id)

  if (!deleted) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  }

  res.status(204).send()
}

export const deleteAdminProductPermanently = async (req: Request, res: Response) => {
  const deleted = await deleteProductPermanently(req.params.id)

  if (!deleted) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  }

  res.status(204).send()
}

export const getAdminInventory = async (_req: Request, res: Response) => {
  res.json({ inventory: await getInventory() })
}

export const postAdminInventoryVariant = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Inventory variant payload is required', 'VALIDATION_ERROR')
  }

  const inventoryItem = await createInventoryVariant({
    productId: req.params.productId,
    sku: readString(req.body.sku, 'Variant SKU'),
    size: typeof req.body.size === 'string' ? req.body.size.trim() || undefined : undefined,
    color: typeof req.body.color === 'string' ? req.body.color.trim() || undefined : undefined,
    stockQuantity: readOptionalNumber(req.body.stockQuantity, 'Stock quantity'),
    lowStockThreshold: readOptionalNumber(req.body.lowStockThreshold, 'Low stock threshold'),
  })

  if (!inventoryItem) {
    throw new ApiError(404, 'Product not found', 'PRODUCT_NOT_FOUND')
  }

  res.status(201).json(inventoryItem)
}

export const patchAdminInventory = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Inventory payload is required', 'VALIDATION_ERROR')
  }

  const stockQuantity = readOptionalNumber(req.body.stockQuantity, 'Stock quantity')
  const lowStockThreshold = readOptionalNumber(req.body.lowStockThreshold, 'Low stock threshold')
  if (stockQuantity === undefined && lowStockThreshold === undefined) {
    throw new ApiError(400, 'Inventory update is required', 'VALIDATION_ERROR')
  }
  const inventoryItem = await updateInventory(req.params.productId, {
    lowStockThreshold,
    stockQuantity,
  })

  if (!inventoryItem) {
    throw new ApiError(404, 'Inventory item not found', 'INVENTORY_NOT_FOUND')
  }

  res.json(inventoryItem)
}

export const patchAdminInventoryBySku = async (req: Request, res: Response) => {
  if (!isRecord(req.body)) {
    throw new ApiError(400, 'Inventory payload is required', 'VALIDATION_ERROR')
  }

  const stockQuantity = readOptionalNumber(req.body.stockQuantity, 'Stock quantity')
  const lowStockThreshold = readOptionalNumber(req.body.lowStockThreshold, 'Low stock threshold')
  if (stockQuantity === undefined && lowStockThreshold === undefined) {
    throw new ApiError(400, 'Inventory update is required', 'VALIDATION_ERROR')
  }
  const inventoryItem = await updateInventoryBySku(req.params.sku, {
    lowStockThreshold,
    stockQuantity,
  })

  if (!inventoryItem) {
    throw new ApiError(404, 'Inventory item not found', 'INVENTORY_NOT_FOUND')
  }

  res.json(inventoryItem)
}

export const deleteAdminInventoryBySku = async (req: Request, res: Response) => {
  const deleted = await deleteInventoryVariantBySku(req.params.sku)

  if (!deleted) {
    throw new ApiError(404, 'Inventory item not found', 'INVENTORY_NOT_FOUND')
  }

  res.status(204).send()
}

export const getAdminUsers = async (_req: Request, res: Response) => {
  res.json({ users: await listUsers() })
}

export const getAdminAnalytics = async (_req: Request, res: Response) => {
  res.json(await getOrderAnalytics())
}

export const postAdminProductImageUpload = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'Product image is required', 'VALIDATION_ERROR')
  }

  const protocol = req.get('x-forwarded-proto') ?? req.protocol
  const imageUrl = `${protocol}://${req.get('host')}/uploads/product-images/${req.file.filename}`

  res.status(201).json({ imageUrl })
}
