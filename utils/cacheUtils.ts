
interface CacheItem<T> {
  data: T;
  expiry: number;
  timestamp: number;
}

const CACHE_PREFIX = 'vivasaya_cache_';

/**
 * Prunes the cache to make space for a new item.
 * 1. Removes expired items.
 * 2. Removes oldest items (LRU) based on timestamp.
 */
const pruneCache = (keyToInsert: string, valueToInsert: string): boolean => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }

  const items: { key: string; expiry: number; timestamp: number }[] = [];
  
  for (const key of keys) {
    try {
      const itemStr = localStorage.getItem(key);
      if (itemStr) {
        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
          localStorage.removeItem(key);
        } else {
          items.push({ key, expiry: item.expiry, timestamp: item.timestamp || 0 });
        }
      }
    } catch (e) {
      localStorage.removeItem(key);
    }
  }

  try {
    localStorage.setItem(CACHE_PREFIX + keyToInsert, valueToInsert);
    return true;
  } catch (e) {
    // Continue to LRU
  }

  items.sort((a, b) => a.timestamp - b.timestamp);

  for (const item of items) {
    localStorage.removeItem(item.key);
    try {
      localStorage.setItem(CACHE_PREFIX + keyToInsert, valueToInsert);
      return true;
    } catch (e) {}
  }

  return false;
};

export const setCache = <T>(key: string, data: T, ttlMinutes: number): void => {
  const now = Date.now();
  const item: CacheItem<T> = {
    data,
    expiry: now + ttlMinutes * 60 * 1000,
    timestamp: now
  };
  
  const value = JSON.stringify(item);

  try {
    localStorage.setItem(CACHE_PREFIX + key, value);
  } catch (error) {
    console.warn('Storage full, pruning cache...');
    if (!pruneCache(key, value)) {
      console.warn('Failed to store item after pruning.');
    }
  }
};

export const getCache = <T>(key: string): T | null => {
  try {
    const itemStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;

    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = Date.now();

    if (now > item.expiry) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return item.data;
  } catch (error) {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
};

/**
 * Robust Invalidation: Clear all cache items
 */
export const clearAllCache = (): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
};

/**
 * Robust Invalidation: Clear specific patterns (e.g., all weather data)
 */
export const invalidateByPattern = (pattern: string): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
};
