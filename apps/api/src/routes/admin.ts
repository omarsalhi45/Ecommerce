import { Router } from 'express'
import {
  deleteAdminProduct,
  getAdminAnalytics,
  getAdminInventory,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  patchAdminInventory,
  patchAdminOrderStatus,
  patchAdminProduct,
  postAdminProduct,
} from '../controllers/adminController'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticateRequest, requireRole } from '../middleware/authMiddleware'

const router = Router()

router.use(authenticateRequest)
router.use(requireRole(['admin']))

router.get('/analytics', asyncHandler(getAdminAnalytics))
router.get('/orders', asyncHandler(getAdminOrders))
router.patch('/orders/:id/status', asyncHandler(patchAdminOrderStatus))
router.get('/products', asyncHandler(getAdminProducts))
router.post('/products', asyncHandler(postAdminProduct))
router.patch('/products/:id', asyncHandler(patchAdminProduct))
router.delete('/products/:id', asyncHandler(deleteAdminProduct))
router.get('/inventory', asyncHandler(getAdminInventory))
router.patch('/inventory/:productId', asyncHandler(patchAdminInventory))
router.get('/users', asyncHandler(getAdminUsers))

export default router
