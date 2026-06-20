export interface VariantMatrixInput {
  readonly color: readonly string[] | string
  readonly lowStockThreshold: string
  readonly size: readonly string[] | string
  readonly sku: string
  readonly stockQuantity: string
}

export interface VariantMatrixOutput {
  readonly color: string
  readonly lowStockThreshold: string
  readonly size: string
  readonly sku: string
  readonly stockQuantity: string
}

export const splitVariantValues = (value: readonly string[] | string) => {
  const values: readonly string[] = typeof value === 'string' ? value.split(',') : value

  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

export const formatSkuPart = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const buildVariantMatrix = ({
  color,
  existingSkus = [],
  lowStockThreshold,
  productId,
  size,
  sku,
  stockQuantity,
}: VariantMatrixInput & {
  readonly existingSkus?: string[]
  readonly productId: string
}): VariantMatrixOutput[] => {
  const sizes = splitVariantValues(size)
  const colors = splitVariantValues(color)
  const sizeValues = sizes.length > 0 ? sizes : ['']
  const colorValues = colors.length > 0 ? colors : ['']
  const skuPrefix = formatSkuPart(sku || productId)
  const existingSkuSet = new Set(existingSkus)
  const nextSkuSet = new Set<string>()

  return sizeValues.flatMap((sizeValue) =>
    colorValues
      .map((colorValue) => {
        const variantSku = [skuPrefix, sizeValue, colorValue]
          .map(formatSkuPart)
          .filter(Boolean)
          .join('-')

        return {
          color: colorValue,
          lowStockThreshold,
          size: sizeValue,
          sku: variantSku,
          stockQuantity,
        }
      })
      .filter((variant) => {
        if (!variant.sku || existingSkuSet.has(variant.sku) || nextSkuSet.has(variant.sku)) {
          return false
        }

        nextSkuSet.add(variant.sku)
        return true
      })
  )
}
