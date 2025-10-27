// Simple in-memory cache for tab views to avoid showing skeletons after first visit
// Note: This cache resets on full page reload. Suitable for SPA navigation.

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const store = new Map<string, CacheEntry<any>>();

export function getCache<T = unknown>(key: string): CacheEntry<T> | undefined {
  return store.get(key) as CacheEntry<T> | undefined;
}

export function setCache<T = unknown>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

export function clearCache(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}
