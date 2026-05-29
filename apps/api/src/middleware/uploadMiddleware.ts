import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import multer from 'multer'
import { apiConfig } from '../config'
import { ApiError } from './errorMiddleware'

const productImageUploadDir = path.join(apiConfig.uploadDir, 'product-images')
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

mkdirSync(productImageUploadDir, { recursive: true })

const getImageExtension = (mimeType: string): string => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/webp':
      return '.webp'
    case 'image/gif':
      return '.gif'
    default:
      return ''
  }
}

export const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, productImageUploadDir)
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${getImageExtension(file.mimetype)}`)
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(
        new ApiError(400, 'Only JPEG, PNG, WebP, or GIF images are allowed', 'INVALID_IMAGE')
      )
      return
    }

    callback(null, true)
  },
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
})
