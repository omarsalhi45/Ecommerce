import { query } from '../db'
import type {
  CreateProductInput,
  InventoryItem,
  Product,
  UpdateProductInput,
} from '../services/productService'

interface ProductRow {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly price: string
  readonly image_url: string
  readonly category: string
}

interface InventoryRow extends ProductRow {
  readonly sku: string
  readonly size: string | null
  readonly color: string | null
  readonly stock_quantity: number
  readonly low_stock_threshold: number
}

const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  imageUrl: row.image_url,
  category: row.category,
})

const mapInventory = (row: InventoryRow): InventoryItem => ({
  product: mapProduct(row),
  sku: row.sku,
  size: row.size ?? undefined,
  color: row.color ?? undefined,
  stockQuantity: row.stock_quantity,
  lowStockThreshold: row.low_stock_threshold,
})

export const getProductsFromDb = async (): Promise<Product[]> => {
  const result = await query<ProductRow>(
    'SELECT id, name, description, price, image_url, category FROM products WHERE is_active = TRUE ORDER BY created_at ASC'
  )

  return result.rows.map(mapProduct)
}

export const getProductFromDb = async (id: string): Promise<Product | undefined> => {
  const result = await query<ProductRow>(
    'SELECT id, name, description, price, image_url, category FROM products WHERE id = $1 AND is_active = TRUE',
    [id]
  )

  return result.rows[0] ? mapProduct(result.rows[0]) : undefined
}

export const createProductInDb = async (input: CreateProductInput): Promise<Product> => {
  const result = await query<ProductRow>(
    `INSERT INTO products (id, name, description, price, image_url, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, description, price, image_url, category`,
    [input.id, input.name, input.description, input.price, input.imageUrl, input.category]
  )

  await query(
    `INSERT INTO inventory (product_id, sku, size, color, stock_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (product_id) DO NOTHING`,
    [
      input.id,
      input.sku ?? input.id.toUpperCase(),
      input.size,
      input.color,
      input.stockQuantity ?? 0,
      input.lowStockThreshold ?? 5,
    ]
  )

  return mapProduct(result.rows[0])
}

export const updateProductInDb = async (
  productId: string,
  input: UpdateProductInput
): Promise<Product | undefined> => {
  const existingProduct = await getProductFromDb(productId)

  if (!existingProduct) {
    return undefined
  }

  const result = await query<ProductRow>(
    `UPDATE products
     SET name = $2, description = $3, price = $4, image_url = $5, category = $6, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, price, image_url, category`,
    [
      productId,
      input.name ?? existingProduct.name,
      input.description ?? existingProduct.description,
      input.price ?? existingProduct.price,
      input.imageUrl ?? existingProduct.imageUrl,
      input.category ?? existingProduct.category,
    ]
  )

  return result.rows[0] ? mapProduct(result.rows[0]) : undefined
}

export const getInventoryFromDb = async (): Promise<InventoryItem[]> => {
  const result = await query<InventoryRow>(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price,
       p.image_url,
       p.category,
       i.sku,
       i.size,
       i.color,
       i.stock_quantity,
       i.low_stock_threshold
     FROM products p
     JOIN inventory i ON i.product_id = p.id
     WHERE p.is_active = TRUE
     ORDER BY p.created_at ASC`
  )

  return result.rows.map(mapInventory)
}

export const updateInventoryInDb = async (
  productId: string,
  stockQuantity: number
): Promise<InventoryItem | undefined> => {
  const result = await query<InventoryRow>(
    `UPDATE inventory
     SET stock_quantity = $2, updated_at = NOW()
     WHERE product_id = $1
     RETURNING
       product_id,
       sku,
       size,
       color,
       stock_quantity,
       low_stock_threshold`,
    [productId, stockQuantity]
  )

  if (!result.rows[0]) {
    return undefined
  }

  const product = await getProductFromDb(productId)

  if (!product) {
    return undefined
  }

  return {
    product,
    sku: result.rows[0].sku,
    size: result.rows[0].size ?? undefined,
    color: result.rows[0].color ?? undefined,
    stockQuantity: result.rows[0].stock_quantity,
    lowStockThreshold: result.rows[0].low_stock_threshold,
  }
}

export const deactivateProductInDb = async (productId: string): Promise<boolean> => {
  const result = await query(
    'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
    [productId]
  )

  return (result.rowCount ?? 0) > 0
}
