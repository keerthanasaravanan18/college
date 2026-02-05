
/**
 * Internal store for API keys to support rotation on quota exhaustion.
 * The first key is always the primary one from the environment.
 */
const API_KEYS = Array.from(new Set([
  process.env.API_KEY,
])).filter(Boolean) as string[];

let currentKeyIndex = 0;

/**
 * Returns the currently active API key.
 */
export const getApiKey = (): string => {
  return API_KEYS[currentKeyIndex] || (process.env.API_KEY as string);
};

/**
 * Rotates to the next available API key in the pool.
 */
export const rotateApiKey = (): void => {
  if (API_KEYS.length <= 1) return;
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.warn(`Quota exhausted. Switched to API Key Index: ${currentKeyIndex}`);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes a function with exponential backoff retry logic.
 * Automatically rotates API keys if a 429 error occurs.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  initialDelay = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error).toLowerCase();
    const isRateLimit = 
      error?.status === 429 || 
      error?.message?.includes('429') || 
      errorString.includes('quota') || 
      errorString.includes('resource_exhausted');

    if (retries > 0 && isRateLimit) {
      // Exponential backoff with jitter: (baseDelay * 2^retry) + random
      const delay = initialDelay + Math.random() * 1000;
      console.warn(`Gemini Rate Limit Hit. Retrying in ${Math.round(delay)}ms... (${retries} retries left)`);
      
      // Rotate key if we have backups
      if (API_KEYS.length > 1) rotateApiKey();
      
      await sleep(delay);
      return withRetry(fn, retries - 1, initialDelay * 2);
    }
    throw error;
  }
}

/**
 * Prevents concurrent identical requests to save quota.
 * If a request for "key" is in flight, returns that promise instead of starting a new one.
 */
const requestMap = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (requestMap.has(key)) {
    return requestMap.get(key);
  }

  const promise = fn().finally(() => {
    requestMap.delete(key);
  });

  requestMap.set(key, promise);
  return promise;
}
