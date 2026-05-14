import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { apiConfig } from '../config'
import { isDatabaseConfigured } from '../db'
import { ApiError } from '../middleware/errorMiddleware'
import {
  findUserByEmailFromDb,
  findUserByIdFromDb,
  insertUserIntoDb,
  listUsersFromDb,
} from '../repositories/userRepository'

export type UserRole = 'customer' | 'admin'

export interface PublicUser {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
}

export interface StoredUser extends PublicUser {
  readonly passwordHash: string
}

export interface AuthTokenPayload {
  readonly userId: string
  readonly role: UserRole
}

export interface AuthResponse {
  readonly token: string
  readonly user: PublicUser
}

const users: StoredUser[] = []

const toPublicUser = (user: StoredUser): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
})

const findUserByEmail = async (email: string): Promise<StoredUser | undefined> => {
  if (isDatabaseConfigured) {
    return findUserByEmailFromDb(email)
  }

  return users.find((candidate) => candidate.email === email)
}

const findUserById = async (userId: string): Promise<StoredUser | undefined> => {
  if (isDatabaseConfigured) {
    return findUserByIdFromDb(userId)
  }

  return users.find((candidate) => candidate.id === userId)
}

const signToken = (user: StoredUser): string => {
  return jwt.sign({ userId: user.id, role: user.role }, apiConfig.jwtSecret, {
    expiresIn: '1d',
  })
}

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole = 'customer'
): Promise<AuthResponse> => {
  const normalizedEmail = email.toLowerCase()

  if (await findUserByEmail(normalizedEmail)) {
    throw new ApiError(409, 'Account already exists', 'AUTH_ACCOUNT_EXISTS')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user: StoredUser = {
    id: `user_${Date.now()}_${users.length + 1}`,
    name,
    email: normalizedEmail,
    role,
    passwordHash,
  }

  const storedUser = isDatabaseConfigured ? await insertUserIntoDb(user) : user

  if (!isDatabaseConfigured) {
    users.push(user)
  }

  return {
    token: signToken(storedUser),
    user: toPublicUser(storedUser),
  }
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const normalizedEmail = email.toLowerCase()
  const user = await findUserByEmail(normalizedEmail)

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Invalid email or password', 'AUTH_INVALID_CREDENTIALS')
  }

  return {
    token: signToken(user),
    user: toPublicUser(user),
  }
}

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, apiConfig.jwtSecret)

    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      typeof decoded.userId === 'string' &&
      (decoded.role === 'customer' || decoded.role === 'admin')
    ) {
      return {
        userId: decoded.userId,
        role: decoded.role,
      }
    }
  } catch {
    throw new ApiError(401, 'Invalid or expired token', 'AUTH_INVALID_TOKEN')
  }

  throw new ApiError(401, 'Invalid or expired token', 'AUTH_INVALID_TOKEN')
}

export const getPublicUserById = async (userId: string): Promise<PublicUser | undefined> => {
  const user = await findUserById(userId)
  return user ? toPublicUser(user) : undefined
}

export const listUsers = async (): Promise<PublicUser[]> => {
  if (isDatabaseConfigured) {
    return listUsersFromDb()
  }

  return users.map(toPublicUser)
}

export const hasAdminUser = async (): Promise<boolean> => {
  const allUsers = await listUsers()
  return allUsers.some((user) => user.role === 'admin')
}

export const resetAuthStoreForTests = () => {
  users.splice(0, users.length)
}
