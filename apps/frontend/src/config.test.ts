import { describe, expect, it } from 'vitest'
import { createFrontendConfig, normalizeApiBaseUrl, parseBooleanFlag } from './config'

describe('frontend config', () => {
  it('uses the local API URL when no env value is provided', () => {
    expect(normalizeApiBaseUrl(undefined)).toBe('http://localhost:4000/api')
  })

  it('trims trailing slashes from the API URL', () => {
    expect(normalizeApiBaseUrl(' https://api.osai.test/api/// ')).toBe('https://api.osai.test/api')
  })

  it('parses boolean flags intentionally', () => {
    expect(parseBooleanFlag('true')).toBe(true)
    expect(parseBooleanFlag(' TRUE ')).toBe(true)
    expect(parseBooleanFlag('false')).toBe(false)
    expect(parseBooleanFlag(undefined)).toBe(false)
  })

  it('creates the typed runtime config', () => {
    expect(
      createFrontendConfig({
        VITE_API_BASE_URL: 'https://api.osai.test/api/',
        VITE_ENABLE_DEBUG: 'true',
      })
    ).toEqual({
      apiBaseUrl: 'https://api.osai.test/api',
      enableDebug: true,
    })
  })
})
