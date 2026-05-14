const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'

interface FrontendEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ENABLE_DEBUG?: string
}

interface FrontendConfig {
  readonly apiBaseUrl: string
  readonly enableDebug: boolean
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

export const createFrontendConfig = (env: FrontendEnv): FrontendConfig => {
  return {
    apiBaseUrl: normalizeApiBaseUrl(env.VITE_API_BASE_URL),
    enableDebug: parseBooleanFlag(env.VITE_ENABLE_DEBUG),
  }
}

export const frontendConfig = createFrontendConfig({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG,
})
