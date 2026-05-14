import { describe, expect, it } from 'vitest'
import { createApiConfig, parseCorsOrigins, parsePort } from '../src/config'

describe('api config', () => {
  it('uses local defaults when env values are missing', () => {
    expect(createApiConfig({})).toMatchObject({
      port: 4000,
      corsOrigins: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      adminBootstrapSecret: undefined,
      nodeEnv: 'development',
    })
  })

  it('parses a valid port', () => {
    expect(parsePort('4500')).toBe(4500)
  })

  it('rejects invalid ports', () => {
    expect(() => parsePort('0')).toThrow('Invalid PORT value: 0')
    expect(() => parsePort('not-a-port')).toThrow('Invalid PORT value: not-a-port')
  })

  it('parses comma-separated CORS origins and removes duplicates', () => {
    expect(
      parseCorsOrigins('https://osai.test, http://localhost:5173, https://osai.test ')
    ).toEqual(['https://osai.test', 'http://localhost:5173'])
  })
})
