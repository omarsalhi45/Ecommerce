import { Router } from 'express'
import { bootstrapAdmin, getMe, login, register } from '../controllers/authController'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticateRequest } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/bootstrap-admin', asyncHandler(bootstrapAdmin))
router.get('/me', authenticateRequest, asyncHandler(getMe))

export default router
