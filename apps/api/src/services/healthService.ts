export interface HealthStatus {
  readonly status: 'ok'
  readonly service: 'OSAI API'
  readonly timestamp: string
  readonly uptimeSeconds: number
}

export const getHealthStatus = (): HealthStatus => {
  return {
    status: 'ok',
    service: 'OSAI API',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  }
}
