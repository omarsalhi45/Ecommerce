import { beforeEach, describe, expect, it } from 'vitest'
import {
  getPublicUserById,
  loginUser,
  registerUser,
  resetAuthStoreForTests,
  verifyAuthToken,
} from '../src/services/authService'

describe('authService', () => {
  beforeEach(() => {
    resetAuthStoreForTests()
  })

  it('registers users without exposing password hashes', async () => {
    const authResponse = await registerUser('Ari Customer', 'ari@example.com', 'password123')

    expect(authResponse.user).toMatchObject({
      name: 'Ari Customer',
      email: 'ari@example.com',
      role: 'customer',
    })
    expect(authResponse.user).not.toHaveProperty('passwordHash')
    expect(verifyAuthToken(authResponse.token)).toMatchObject({
      userId: authResponse.user.id,
      role: 'customer',
    })
  })

  it('logs in with valid credentials', async () => {
    const registered = await registerUser('Ari Customer', 'ari@example.com', 'password123')
    const loggedIn = await loginUser('ari@example.com', 'password123')

    expect(loggedIn.user).toEqual(registered.user)
    await expect(getPublicUserById(loggedIn.user.id)).resolves.toEqual(loggedIn.user)
  })

  it('rejects invalid credentials', async () => {
    await registerUser('Ari Customer', 'ari@example.com', 'password123')

    await expect(loginUser('ari@example.com', 'wrong-password')).rejects.toThrow(
      'Invalid email or password'
    )
  })
})
