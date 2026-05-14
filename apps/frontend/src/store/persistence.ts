import type { AuthState } from '../slices/authSlice'
import type { CartItem } from '../slices/cartSlice'

const CART_STORAGE_KEY = 'osai.cart'
const AUTH_STORAGE_KEY = 'osai.auth'

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

export const loadPersistedCart = (): { items: CartItem[] } | undefined => {
  const cart = readJson<{ items?: CartItem[] }>(CART_STORAGE_KEY)

  if (!Array.isArray(cart?.items)) {
    return undefined
  }

  return {
    items: cart.items.filter(
      (item) =>
        typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0
    ),
  }
}

export const savePersistedCart = (items: CartItem[]) => {
  getLocalStorage()?.setItem(CART_STORAGE_KEY, JSON.stringify({ items }))
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
