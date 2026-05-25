import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config()

const DEFAULT_PORT = 4000
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

export interface ApiConfig {
  readonly port: number
  readonly corsOrigins: string[]
  readonly databaseUrl?: string
  readonly jwtSecret: string
  readonly adminBootstrapSecret?: string
  readonly stripeSecretKey?: string
  readonly stripePublishableKey?: string
  readonly stripeWebhookSecret?: string
  readonly sentryDsn?: string
  readonly sentryTracesSampleRate: number
  readonly nodeEnv: string
}

export const parsePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT
  }

  const parsedPort = Number(value)

  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    throw new Error(`Invalid PORT value: ${value}`)
  }

  return parsedPort
}

export const parseCorsOrigins = (value: string | undefined): string[] => {
  if (!value?.trim()) {
    return DEFAULT_CORS_ORIGINS
  }

  return Array.from(
    new Set(
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    )
  )
}

export const parseSentryTracesSampleRate = (value: string | undefined): number => {
  if (!value?.trim()) {
    return 0
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    throw new Error(`Invalid SENTRY_TRACES_SAMPLE_RATE value: ${value}`)
  }

  return parsedValue
}

export const createApiConfig = (env: NodeJS.ProcessEnv): ApiConfig => {
  const nodeEnv = env.NODE_ENV ?? 'development'
  const jwtSecret = env.JWT_SECRET ?? 'osai_local_dev_secret_change_me'

  if (nodeEnv === 'production' && !env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production')
  }

  return {
    port: parsePort(env.PORT),
    corsOrigins: parseCorsOrigins(env.CORS_ORIGINS),
    databaseUrl: env.DATABASE_URL,
    jwtSecret,
    adminBootstrapSecret: env.ADMIN_BOOTSTRAP_SECRET,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    sentryDsn: env.SENTRY_DSN,
    sentryTracesSampleRate: parseSentryTracesSampleRate(env.SENTRY_TRACES_SAMPLE_RATE),
    nodeEnv,
  }
}

export const apiConfig = createApiConfig(process.env)
