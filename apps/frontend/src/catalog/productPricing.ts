import type { Product } from '../types'

export interface ProductPriceDetails {
  readonly price: number
  readonly compareAtPrice?: number
  readonly saleAmount: number
  readonly salePercent: number
  readonly isOnSale: boolean
}

export const getProductPriceDetails = (product: Product): ProductPriceDetails => {
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.compareAtPrice
      : undefined
  const saleAmount = compareAtPrice ? Math.round((compareAtPrice - product.price) * 100) / 100 : 0
  const salePercent = compareAtPrice ? Math.round((saleAmount / compareAtPrice) * 100) : 0

  return {
    price: product.price,
    compareAtPrice,
    saleAmount,
    salePercent,
    isOnSale: Boolean(compareAtPrice),
  }
}
