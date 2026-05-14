import type { NextFunction, Request, Response } from 'express'
import { type AuthTokenPayload, type UserRole, verifyAuthToken } from '../services/authService'
import { ApiError } from './errorMiddleware'

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload
    }
  }
}

export const authenticateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.header('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined

  if (!token) {
    next(new ApiError(401, 'Authentication token is required', 'AUTH_REQUIRED'))
    return
  }

  req.auth = verifyAuthToken(token)
  next()
}

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError(403, 'You do not have access to this resource', 'AUTH_FORBIDDEN'))
      return
    }

    next()
  }
}
