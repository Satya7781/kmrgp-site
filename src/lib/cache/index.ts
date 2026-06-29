import { LRUCache } from "lru-cache"

interface CacheEntry<T> {
  value: T
}

const cache = new LRUCache<string, CacheEntry<unknown>>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true,
})

export function cacheGet<T>(key: string): T | undefined {
  const entry = cache.get(key)
  return entry?.value as T | undefined
}

export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  cache.set(key, { value }, { ttl })
}

export function cacheDelete(key: string): void {
  cache.delete(key)
}

export function cacheDeletePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

export function cacheKeys(): string[] {
  return [...cache.keys()]
}
