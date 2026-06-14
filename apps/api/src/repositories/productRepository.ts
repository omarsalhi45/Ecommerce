import { query } from '../db'
import type {
  CreateProductInput,
  InventoryItem,
  Product,
  ProductQuestion,
  ProductReview,
  ProductVariant,
  UpdateProductInput,
} from '../services/productService'

interface ProductRow {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly price: string
  readonly compare_at_price?: string | null
  readonly image_url: string
  readonly category: string
  readonly model_height?: string | null
  readonly model_size?: string | null
  readonly fit_description?: string | null
  readonly material_description?: string | null
  readonly care_instructions?: string | null
  readonly product_story?: string | null
  readonly product_questions?: unknown
  readonly is_active?: boolean | null
  readonly popularity_score?: number | null
  readonly average_rating?: string | null
  readonly review_count?: number | string | null
}

interface InventoryRow extends ProductRow {
  readonly sku: string
  readonly size: string | null
  readonly color: string | null
  readonly stock_quantity: number
  readonly low_stock_threshold: number
}

interface ProductReviewRow {
  readonly id: string
  readonly product_id: string
  readonly author_name: string
  readonly rating: number
  readonly title: string
  readonly body: string
  readonly created_at: Date | string
}

const productSelectWithRatings = `
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.compare_at_price,
    p.image_url,
    p.category,
    p.model_height,
    p.model_size,
    p.fit_description,
    p.material_description,
    p.care_instructions,
    p.product_story,
    p.product_questions,
    p.is_active,
    p.popularity_score,
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS average_rating,
    COUNT(r.id)::int AS review_count
  FROM products p
  LEFT JOIN product_reviews r ON r.product_id = p.id
`

const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
  imageUrl: row.image_url,
  category: row.category,
  modelHeight: row.model_height ?? undefined,
  modelSize: row.model_size ?? undefined,
  fitDescription: row.fit_description ?? undefined,
  materialDescription: row.material_description ?? undefined,
  careInstructions: row.care_instructions ?? undefined,
  productStory: row.product_story ?? undefined,
  productQuestions: parseProductQuestions(row.product_questions),
  isActive: row.is_active ?? true,
  popularityScore: row.popularity_score ?? undefined,
  ratingSummary: {
    averageRating: Number(row.average_rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
  },
})

const parseProductQuestions = (value: unknown): ProductQuestion[] | undefined => {
  if (typeof value === 'string') {
    try {
      return parseProductQuestions(JSON.parse(value))
    } catch {
      return undefined
    }
  }

  if (!Array.isArray(value)) {
    return undefined
  }

  const questions = value
    .filter((item): item is Record<string, unknown> => {
      return typeof item === 'object' && item !== null && !Array.isArray(item)
    })
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question.trim() : '',
      answer: typeof item.answer === 'string' ? item.answer.trim() : '',
    }))
    .filter((item) => item.question && item.answer)

  return questions.length > 0 ? questions : undefined
}

const mapProductVariant = (row: InventoryRow): ProductVariant => ({
  sku: row.sku,
  size: row.size ?? undefined,
  color: row.color ?? undefined,
  stockQuantity: row.stock_quantity,
})

const getVariantsForProductIds = async (
  productIds: readonly string[]
): Promise<Map<string, ProductVariant[]>> => {
  if (productIds.length === 0) {
    return new Map()
  }

  const result = await query<InventoryRow>(
    `SELECT
       p.id,
       p.name,
       p.description,
       p.price,
       p.compare_at_price,
       p.image_url,
       p.category,
       p.model_height,
       p.model_size,
       p.fit_description,
       p.material_description,
       p.care_instructions,
       p.product_story,
       p.product_questions,
       p.is_active,
       i.sku,
       i.size,
       i.color,
       i.stock_quantity,
       i.low_stock_threshold
     FROM products p
     JOIN inventory i ON i.product_id = p.id
     WHERE p.id = ANY($1::text[])
     ORDER BY i.size NULLS LAST, i.color NULLS LAST, i.sku`,
    [productIds as string[]]
  )

  return result.rows.reduce((variantsByProductId, row) => {
    const variants = variantsByProductId.get(row.id) ?? []
    variants.push(mapProductVariant(row))
    variantsByProductId.set(row.id, variants)
    return variantsByProductId
  }, new Map<string, ProductVariant[]>())
}

const attachVariants = (product: Product, variants: ProductVariant[] | undefined): Product => ({
  ...product,
  variants: variants ?? [],
})

const mapInventory = (row: InventoryRow): InventoryItem => ({
  product: mapProduct(row),
  sku: row.sku,
  size: row.size ?? undefined,
  color: row.color ?? undefined,
  stockQuantity: row.stock_quantity,
  lowStockThreshold: row.low_stock_threshold,
})

const mapProductReview = (row: ProductReviewRow): ProductReview => ({
  id: row.id,
  productId: row.product_id,
  authorName: row.author_name,
  rating: row.rating,
  title: row.title,
  body: row.body,
  createdAt:
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString(),
})

const createUniqueProductIdInDb = async (baseId: string): Promise<string> => {
  let candidateId = baseId
  let suffix = 2

  while (true) {
    const result = await query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM products WHERE id = $1) AS exists',
      [candidateId]
    )

    if (!result.rows[0]?.exists) {
      return candidateId
    }

    candidateId = `${baseId}-${suffix}`
    suffix += 1
  }
}

export const getProductsFromDb = async (): Promise<Product[]> => {
  const result = await query<ProductRow>(
    `${productSelectWithRatings}
     WHERE p.is_active = TRUE
     GROUP BY p.id
     ORDER BY p.created_at ASC`
  )

  const products = result.rows.map(mapProduct)
  const variantsByProductId = await getVariantsForProductIds(products.map((product) => product.id))

  return products.map((product) => attachVariants(product, variantsByProductId.get(product.id)))
}

export const getAdminProductsFromDb = async (): Promise<Product[]> => {
  const result = await query<ProductRow>(
    `${productSelectWithRatings}
     GROUP BY p.id
     ORDER BY p.created_at ASC`
  )

  const products = result.rows.map(mapProduct)
  const variantsByProductId = await getVariantsForProductIds(products.map((product) => product.id))

  return products.map((product) => attachVariants(product, variantsByProductId.get(product.id)))
}

export const getProductFromDb = async (id: string): Promise<Product | undefined> => {
  const result = await query<ProductRow>(
    `${productSelectWithRatings}
     WHERE p.id = $1 AND p.is_active = TRUE
     GROUP BY p.id`,
    [id]
  )

  if (!result.rows[0]) {
    return undefined
  }

  const product = mapProduct(result.rows[0])
  const variantsByProductId = await getVariantsForProductIds([id])

  return attachVariants(product, variantsByProductId.get(id))
}

const getAdminProductFromDb = async (id: string): Promise<Product | undefined> => {
  const result = await query<ProductRow>(
    `${productSelectWithRatings}
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  )

  if (!result.rows[0]) {
    return undefined
  }

  const product = mapProduct(result.rows[0])
  const variantsByProductId = await getVariantsForProductIds([id])

  return attachVariants(product, variantsByProductId.get(id))
}

export const getProductReviewsFromDb = async (productId: string): Promise<ProductReview[]> => {
  const result = await query<ProductReviewRow>(
    `SELECT id, product_id, author_name, rating, title, body, created_at
     FROM product_reviews
     WHERE product_id = $1
     ORDER BY created_at DESC`,
    [productId]
  )

  return result.rows.map(mapProductReview)
}

export const createProductInDb = async (input: CreateProductInput): Promise<Product> => {
  const productId = await createUniqueProductIdInDb(input.id ?? input.name)
  const result = await query<ProductRow>(
    `INSERT INTO products (
       id,
       name,
       description,
       price,
       compare_at_price,
       image_url,
       category,
       model_height,
       model_size,
       fit_description,
       material_description,
       care_instructions,
       product_story,
       product_questions
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING
       id,
       name,
       description,
       price,
       compare_at_price,
       image_url,
       category,
       model_height,
       model_size,
       fit_description,
       material_description,
       care_instructions,
       product_story,
       product_questions,
       is_active,
       popularity_score`,
    [
      productId,
      input.name,
      input.description,
      input.price,
      input.compareAtPrice,
      input.imageUrl,
      input.category,
      input.modelHeight,
      input.modelSize,
      input.fitDescription,
      input.materialDescription,
      input.careInstructions,
      input.productStory,
      input.productQuestions ? JSON.stringify(input.productQuestions) : null,
    ]
  )

  await query(
    `INSERT INTO inventory (product_id, sku, size, color, stock_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (sku) DO NOTHING`,
    [
      productId,
      input.sku ?? productId.toUpperCase(),
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
  const existingProduct = await getAdminProductFromDb(productId)

  if (!existingProduct) {
    return undefined
  }

  const result = await query<ProductRow>(
    `UPDATE products
     SET
       name = $2,
       description = $3,
       price = $4,
       compare_at_price = $5,
       image_url = $6,
       category = $7,
       model_height = $8,
       model_size = $9,
       fit_description = $10,
       material_description = $11,
       care_instructions = $12,
       product_story = $13,
       product_questions = $14,
       updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       name,
       description,
       price,
       compare_at_price,
       image_url,
       category,
       model_height,
       model_size,
       fit_description,
       material_description,
       care_instructions,
       product_story,
       product_questions,
       is_active,
       popularity_score`,
    [
      productId,
      input.name ?? existingProduct.name,
      input.description ?? existingProduct.description,
      input.price ?? existingProduct.price,
      input.compareAtPrice === undefined ? existingProduct.compareAtPrice : input.compareAtPrice,
      input.imageUrl ?? existingProduct.imageUrl,
      input.category ?? existingProduct.category,
      input.modelHeight === undefined ? existingProduct.modelHeight : input.modelHeight,
      input.modelSize === undefined ? existingProduct.modelSize : input.modelSize,
      input.fitDescription === undefined ? existingProduct.fitDescription : input.fitDescription,
      input.materialDescription === undefined
        ? existingProduct.materialDescription
        : input.materialDescription,
      input.careInstructions === undefined
        ? existingProduct.careInstructions
        : input.careInstructions,
      input.productStory === undefined ? existingProduct.productStory : input.productStory,
      input.productQuestions === undefined
        ? existingProduct.productQuestions
          ? JSON.stringify(existingProduct.productQuestions)
          : null
        : input.productQuestions
          ? JSON.stringify(input.productQuestions)
          : null,
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
       p.compare_at_price,
       p.image_url,
       p.category,
       p.model_height,
       p.model_size,
       p.fit_description,
       p.material_description,
       p.care_instructions,
       p.product_story,
       p.product_questions,
       p.is_active,
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

export const createInventoryVariantInDb = async (input: {
  readonly productId: string
  readonly sku: string
  readonly size?: string
  readonly color?: string
  readonly stockQuantity?: number
  readonly lowStockThreshold?: number
}): Promise<InventoryItem | undefined> => {
  const product = await getProductFromDb(input.productId)

  if (!product) {
    return undefined
  }

  const result = await query<InventoryRow>(
    `INSERT INTO inventory (product_id, sku, size, color, stock_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       product_id AS id,
       sku,
       size,
       color,
       stock_quantity,
       low_stock_threshold`,
    [
      input.productId,
      input.sku,
      input.size,
      input.color,
      input.stockQuantity ?? 0,
      input.lowStockThreshold ?? 5,
    ]
  )

  return {
    product,
    sku: result.rows[0].sku,
    size: result.rows[0].size ?? undefined,
    color: result.rows[0].color ?? undefined,
    stockQuantity: result.rows[0].stock_quantity,
    lowStockThreshold: result.rows[0].low_stock_threshold,
  }
}

export const updateInventoryInDb = async (
  productId: string,
  input: {
    readonly stockQuantity?: number
    readonly lowStockThreshold?: number
  }
): Promise<InventoryItem | undefined> => {
  const result = await query<InventoryRow>(
    `UPDATE inventory
     SET
       stock_quantity = COALESCE($2, stock_quantity),
       low_stock_threshold = COALESCE($3, low_stock_threshold),
       updated_at = NOW()
     WHERE product_id = $1
     RETURNING
       product_id AS id,
       sku,
       size,
       color,
       stock_quantity,
       low_stock_threshold`,
    [productId, input.stockQuantity ?? null, input.lowStockThreshold ?? null]
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

export const updateInventoryBySkuInDb = async (
  sku: string,
  input: {
    readonly stockQuantity?: number
    readonly lowStockThreshold?: number
  }
): Promise<InventoryItem | undefined> => {
  const result = await query<InventoryRow>(
    `UPDATE inventory
     SET
       stock_quantity = COALESCE($2, stock_quantity),
       low_stock_threshold = COALESCE($3, low_stock_threshold),
       updated_at = NOW()
     WHERE sku = $1
     RETURNING
       product_id AS id,
       sku,
       size,
       color,
       stock_quantity,
       low_stock_threshold`,
    [sku, input.stockQuantity ?? null, input.lowStockThreshold ?? null]
  )

  if (!result.rows[0]) {
    return undefined
  }

  const product = await getProductFromDb(result.rows[0].id)

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

export const deleteInventoryBySkuInDb = async (sku: string): Promise<boolean> => {
  const result = await query('DELETE FROM inventory WHERE sku = $1', [sku])

  return (result.rowCount ?? 0) > 0
}

export const deactivateProductInDb = async (productId: string): Promise<boolean> => {
  return Boolean(await setProductActiveInDb(productId, false))
}

export const deleteProductPermanentlyInDb = async (productId: string): Promise<boolean> => {
  const result = await query('DELETE FROM products WHERE id = $1', [productId])

  return (result.rowCount ?? 0) > 0
}

export const setProductActiveInDb = async (
  productId: string,
  isActive: boolean
): Promise<Product | undefined> => {
  const result = await query<ProductRow>(
    `UPDATE products
     SET is_active = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, price, compare_at_price, image_url, category, is_active, popularity_score`,
    [productId, isActive]
  )

  if (!result.rows[0]) {
    return undefined
  }

  return mapProduct(result.rows[0])
}
