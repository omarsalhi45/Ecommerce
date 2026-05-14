import type { Request, Response } from 'express'
import { apiConfig } from '../config'
import { ApiError } from '../middleware/errorMiddleware'
import { getPublicUserById, hasAdminUser, loginUser, registerUser } from '../services/authService'
import { validateLoginRequest, validateRegisterRequest } from '../validation/requestValidation'

export const register = async (req: Request, res: Response) => {
  const payload = validateRegisterRequest(req.body)
  const authResponse = await registerUser(payload.name, payload.email, payload.password)

  res.status(201).json(authResponse)
}

export const login = async (req: Request, res: Response) => {
  const payload = validateLoginRequest(req.body)
  const authResponse = await loginUser(payload.email, payload.password)

  res.json(authResponse)
}

export const bootstrapAdmin = async (req: Request, res: Response) => {
  if (apiConfig.nodeEnv === 'production') {
    throw new ApiError(403, 'Admin bootstrap is disabled in production', 'ADMIN_BOOTSTRAP_DISABLED')
  }

  if (apiConfig.adminBootstrapSecret) {
    const providedSecret = req.header('x-admin-bootstrap-secret')

    if (providedSecret !== apiConfig.adminBootstrapSecret) {
      throw new ApiError(403, 'Admin bootstrap secret is invalid', 'ADMIN_BOOTSTRAP_FORBIDDEN')
    }
  }

  if (await hasAdminUser()) {
    throw new ApiError(409, 'An admin user already exists', 'ADMIN_ALREADY_EXISTS')
  }

  const payload = validateRegisterRequest(req.body)
  const authResponse = await registerUser(payload.name, payload.email, payload.password, 'admin')

  res.status(201).json(authResponse)
}

export const getMe = async (req: Request, res: Response) => {
  if (!req.auth) {
    throw new ApiError(401, 'Authentication token is required', 'AUTH_REQUIRED')
  }

  const user = await getPublicUserById(req.auth.userId)

  if (!user) {
    throw new ApiError(401, 'User no longer exists', 'AUTH_INVALID_TOKEN')
  }

  res.json({ user })
}
