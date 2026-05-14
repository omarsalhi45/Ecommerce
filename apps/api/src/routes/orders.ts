import { Router } from 'express'
import { createCheckoutOrder, getOrder, getOrders } from '../controllers/ordersController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getOrders))
router.post('/', asyncHandler(createCheckoutOrder))
router.get('/:id', asyncHandler(getOrder))

export default router
