import type { AuthState } from '../slices/authSlice'

const AUTH_STORAGE_KEY = 'osai.admin.auth'

const getLocalStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage
}

const readJson = <T>(key: string): T | undefined => {
  const storage = getLocalStorage()
  const value = storage?.getItem(key)

  if (!value) {
    return undefined
  }

  try {
    return JSON.parse(value) as T
  } catch {
    storage?.removeItem(key)
    return undefined
  }
}

export const loadPersistedAuth = (): AuthState | undefined => {
  const auth = readJson<AuthState>(AUTH_STORAGE_KEY)

  if (!auth?.token || !auth.user) {
    return undefined
  }

  return auth
}

export const savePersistedAuth = (auth: AuthState) => {
  const storage = getLocalStorage()

  if (!storage) {
    return
  }

  if (!auth.token || !auth.user) {
    storage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}
