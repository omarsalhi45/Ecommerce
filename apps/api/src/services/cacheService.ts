interface CacheEntry<T> {
  readonly expiresAt: number
  readonly value: T
}

const cache = new Map<string, CacheEntry<unknown>>()

export const getCachedValue = <T>(key: string): T | undefined => {
  const entry = cache.get(key)

  if (!entry) {
    return undefined
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }

  return entry.value as T
}

export const setCachedValue = <T>(key: string, value: T, ttlSeconds: number): T => {
  if (ttlSeconds <= 0) {
    return value
  }

  cache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value,
  })

  return value
}

export const clearCacheByPrefix = (prefix: string) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

export const resetCacheForTests = () => {
  cache.clear()
}
