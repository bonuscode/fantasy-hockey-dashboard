interface CacheEntry<T> {
  value: T;
  expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}
