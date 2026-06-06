import { Router } from 'express'
import {
  deleteAdminProduct,
  deleteAdminProductPermanently,
  getAdminAnalytics,
  getAdminInventory,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  patchAdminInventory,
  patchAdminOrderStatus,
  patchAdminProduct,
  patchAdminProductStatus,
  postAdminProduct,
  postAdminProductImageUpload,
} from '../controllers/adminController'
import { asyncHandler } from '../middleware/asyncHandler'
import { authenticateRequest, requireRole } from '../middleware/authMiddleware'
import { productImageUpload } from '../middleware/uploadMiddleware'

const router = Router()

router.use(authenticateRequest)
router.use(requireRole(['admin']))

router.get('/analytics', asyncHandler(getAdminAnalytics))
router.get('/orders', asyncHandler(getAdminOrders))
router.patch('/orders/:id/status', asyncHandler(patchAdminOrderStatus))
router.get('/products', asyncHandler(getAdminProducts))
router.post('/products', asyncHandler(postAdminProduct))
router.patch('/products/:id', asyncHandler(patchAdminProduct))
router.patch('/products/:id/status', asyncHandler(patchAdminProductStatus))
router.delete('/products/:id/permanent', asyncHandler(deleteAdminProductPermanently))
router.delete('/products/:id', asyncHandler(deleteAdminProduct))
router.post(
  '/uploads/product-image',
  productImageUpload.single('image'),
  asyncHandler(postAdminProductImageUpload)
)
router.get('/inventory', asyncHandler(getAdminInventory))
router.patch('/inventory/:productId', asyncHandler(patchAdminInventory))
router.get('/users', asyncHandler(getAdminUsers))

export default router
