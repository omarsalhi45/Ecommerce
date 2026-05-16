import { Router } from 'express'
import { handleStripeWebhook } from '../controllers/stripeController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.post('/webhook', asyncHandler(handleStripeWebhook))

export default router
