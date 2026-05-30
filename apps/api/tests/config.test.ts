import { describe, expect, it } from 'vitest'
import {
  createApiConfig,
  parseCorsOrigins,
  parseNonNegativeInteger,
  parsePort,
  parseSentryTracesSampleRate,
} from '../src/config'

describe('api config', () => {
  it('uses local defaults when env values are missing', () => {
    expect(createApiConfig({})).toMatchObject({
      port: 4000,
      corsOrigins: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
      adminBootstrapSecret: undefined,
      stripePublishableKey: undefined,
      stripeSecretKey: undefined,
      stripeWebhookSecret: undefined,
      sentryDsn: undefined,
      sentryTracesSampleRate: 0,
      productCacheTtlSeconds: 30,
      emailFrom: undefined,
      redisUrl: undefined,
      resendApiKey: undefined,
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

  it('parses optional Sentry traces sample rates', () => {
    expect(parseSentryTracesSampleRate(undefined)).toBe(0)
    expect(parseSentryTracesSampleRate('0.25')).toBe(0.25)
    expect(parseSentryTracesSampleRate('1')).toBe(1)
    expect(() => parseSentryTracesSampleRate('2')).toThrow(
      'Invalid SENTRY_TRACES_SAMPLE_RATE value: 2'
    )
  })

  it('parses non-negative integer feature settings', () => {
    expect(parseNonNegativeInteger(undefined, 30, 'PRODUCT_CACHE_TTL_SECONDS')).toBe(30)
    expect(parseNonNegativeInteger('0', 30, 'PRODUCT_CACHE_TTL_SECONDS')).toBe(0)
    expect(parseNonNegativeInteger('60', 30, 'PRODUCT_CACHE_TTL_SECONDS')).toBe(60)
    expect(() => parseNonNegativeInteger('-1', 30, 'PRODUCT_CACHE_TTL_SECONDS')).toThrow(
      'Invalid PRODUCT_CACHE_TTL_SECONDS value: -1'
    )
  })
})
