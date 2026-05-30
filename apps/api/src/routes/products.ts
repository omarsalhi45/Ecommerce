import { Router } from 'express'
import {
  getProductById,
  getProductRecommendations,
  getProducts,
  getReviewsByProductId,
} from '../controllers/productsController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getProducts))
router.get('/recommendations', asyncHandler(getProductRecommendations))
router.get('/:id/reviews', asyncHandler(getReviewsByProductId))
router.get('/:id', asyncHandler(getProductById))

export default router
