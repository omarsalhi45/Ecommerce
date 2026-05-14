import type { Request, Response } from 'express'
import { getAllProducts, getProduct } from '../services/productService'

export const getProducts = async (_req: Request, res: Response) => {
  const products = await getAllProducts()
  res.json(products)
}

export const getProductById = async (req: Request, res: Response) => {
  const product = await getProduct(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  res.json(product)
}
