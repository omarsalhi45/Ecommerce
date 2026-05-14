import type { Request, Response } from 'express'
import { getHealthStatus } from '../services/healthService'

export const getHealth = async (_req: Request, res: Response) => {
  res.json(getHealthStatus())
}

export const getReadiness = async (_req: Request, res: Response) => {
  res.json({
    ...getHealthStatus(),
    checks: {
      api: 'ok',
    },
  })
}
