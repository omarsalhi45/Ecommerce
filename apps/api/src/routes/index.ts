import { Router } from 'express'
import adminRouter from './admin'
import authRouter from './auth'
import docsRouter from './docs'
import healthRouter from './health'
import ordersRouter from './orders'
import productsRouter from './products'
import stripeRouter from './stripe'

const router = Router()

router.use('/admin', adminRouter)
router.use('/auth', authRouter)
router.use('/docs', docsRouter)
router.use('/health', healthRouter)
router.use('/products', productsRouter)
router.use('/orders', ordersRouter)
router.use('/stripe', stripeRouter)

export default router
