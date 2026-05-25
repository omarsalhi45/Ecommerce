import type { NextFunction, Request, Response } from 'express'
import { apiConfig } from '../config'

const shouldLogRequests = apiConfig.nodeEnv !== 'test'

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  if (!shouldLogRequests) {
    next()
    return
  }

  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    }

    const message = JSON.stringify(logEntry)

    if (level === 'error') {
      console.error(message)
      return
    }

    if (level === 'warn') {
      console.warn(message)
      return
    }

    console.log(message)
  })

  next()
}
