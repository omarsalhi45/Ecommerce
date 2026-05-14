import { Router } from 'express'
import { getProductById, getProducts } from '../controllers/productsController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getProducts))
router.get('/:id', asyncHandler(getProductById))

export default router
