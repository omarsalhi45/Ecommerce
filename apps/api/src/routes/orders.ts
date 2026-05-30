import { Router } from 'express'
import {
  createCheckoutOrder,
  createCheckoutPayment,
  getOrder,
  getOrders,
  streamOrderStatus,
} from '../controllers/ordersController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getOrders))
router.post('/', asyncHandler(createCheckoutOrder))
router.post('/payment-intent', asyncHandler(createCheckoutPayment))
router.get('/:id/events', asyncHandler(streamOrderStatus))
router.get('/:id', asyncHandler(getOrder))

export default router
