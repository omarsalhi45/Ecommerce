const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'

interface FrontendEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_DEBUG?: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string
}

interface FrontendConfig {
  readonly apiBaseUrl: string
  readonly enableDebug: boolean
  readonly stripePublishableKey?: string
}

export const normalizeApiBaseUrl = (value: string | undefined): string => {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL
  }

  return trimmedValue.replace(/\/+$/, '')
}

export const parseBooleanFlag = (value: string | undefined): boolean => {
  return value?.trim().toLowerCase() === 'true'
}

export const normalizeStripePublishableKey = (value: string | undefined): string | undefined => {
  const trimmedValue = value?.trim()

  if (!trimmedValue || trimmedValue.startsWith('your_')) {
    return undefined
  }

  return trimmedValue
}

export const createFrontendConfig = (env: FrontendEnv): FrontendConfig => {
  return {
    apiBaseUrl: normalizeApiBaseUrl(env.VITE_API_BASE_URL),
    enableDebug: parseBooleanFlag(env.VITE_ENABLE_DEBUG),
    stripePublishableKey: normalizeStripePublishableKey(env.VITE_STRIPE_PUBLISHABLE_KEY),
  }
}

export const frontendConfig = createFrontendConfig({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
})
