import type { ErrorRequestHandler, RequestHandler } from 'express'

export class ApiError extends Error {
  readonly statusCode: number
  readonly code: string

  constructor(statusCode: number, message: string, code = 'API_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const isMulterError = error instanceof Error && error.name === 'MulterError'
  const statusCode = error instanceof ApiError ? error.statusCode : isMulterError ? 400 : 500
  const message = error instanceof Error ? error.message : 'Unexpected API error'
  const code =
    error instanceof ApiError
      ? error.code
      : isMulterError
        ? 'UPLOAD_ERROR'
        : 'INTERNAL_SERVER_ERROR'

  res.status(statusCode).json({
    code,
    message: statusCode === 500 ? 'Internal server error' : message,
  })
}
