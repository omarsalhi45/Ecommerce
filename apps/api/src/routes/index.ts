import { Router } from 'express'
import adminRouter from './admin'
import authRouter from './auth'
import healthRouter from './health'
import ordersRouter from './orders'
import productsRouter from './products'

const router = Router()

router.use('/admin', adminRouter)
router.use('/auth', authRouter)
router.use('/health', healthRouter)
router.use('/products', productsRouter)
router.use('/orders', ordersRouter)

export default router
