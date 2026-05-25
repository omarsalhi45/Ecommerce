import * as Sentry from '@sentry/node'
import type { ErrorRequestHandler } from 'express'
import { apiConfig } from './config'
import { ApiError } from './middleware/errorMiddleware'

let isMonitoringInitialized = false

const isConfiguredDsn = (value: string | undefined): value is string => {
  const trimmedValue = value?.trim()
  return Boolean(trimmedValue && !trimmedValue.startsWith('your_'))
}

export const initializeMonitoring = () => {
  if (isMonitoringInitialized || !isConfiguredDsn(apiConfig.sentryDsn)) {
    return
  }

  Sentry.init({
    dsn: apiConfig.sentryDsn,
    environment: apiConfig.nodeEnv,
    tracesSampleRate: apiConfig.sentryTracesSampleRate,
  })
  isMonitoringInitialized = true
}

export const monitoringErrorHandler: ErrorRequestHandler = (error, _req, _res, next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500

  if (isMonitoringInitialized && statusCode >= 500) {
    Sentry.captureException(error)
  }

  next(error)
}
