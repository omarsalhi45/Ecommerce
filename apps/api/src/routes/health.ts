import { Router } from 'express'
import { getHealth, getReadiness } from '../controllers/healthController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getHealth))
router.get('/ready', asyncHandler(getReadiness))

export default router
