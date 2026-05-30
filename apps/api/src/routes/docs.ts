import { Router } from 'express'
import { getOpenApiDocument } from '../controllers/docsController'

const router = Router()

router.get('/openapi.json', getOpenApiDocument)

export default router
