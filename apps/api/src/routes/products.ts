import { Router } from 'express'
import {
  getProductById,
  getProducts,
  getReviewsByProductId,
} from '../controllers/productsController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getProducts))
router.get('/:id/reviews', asyncHandler(getReviewsByProductId))
router.get('/:id', asyncHandler(getProductById))

export default router
