const LOCAL_STORAGE_KEY = 'iptv_local_posters_v1';

export interface CachedPosterRecord {
  url: string;
  source: 'itunes' | 'tvmaze' | 'tmdb' | 'custom';
  savedAt: string;
}

// In-Memory RAM Cache for 0ms Instant Lookups
const memoryCache = new Map<string, string>();
let isInitialized = false;

function initMemoryCache() {
  if (isInitialized) return;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, CachedPosterRecord> = JSON.parse(raw);
      for (const [key, val] of Object.entries(parsed)) {
        if (val && val.url) {
          memoryCache.set(key.toLowerCase().trim(), val.url);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load local poster cache from storage:', e);
  }
  isInitialized = true;
}

export function getLocalPoster(cleanTitle: string): string | null {
  if (!cleanTitle) return null;
  initMemoryCache();
  const normalizedKey = cleanTitle.toLowerCase().trim();
  return memoryCache.get(normalizedKey) || null;
}

export function saveLocalPoster(
  cleanTitle: string,
  url: string,
  source: CachedPosterRecord['source'] = 'itunes'
) {
  if (!cleanTitle || !url) return;
  initMemoryCache();

  const normalizedKey = cleanTitle.toLowerCase().trim();
  memoryCache.set(normalizedKey, url);

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const store: Record<string, CachedPosterRecord> = raw ? JSON.parse(raw) : {};
    store[normalizedKey] = {
      url,
      source,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Local cache save error:', e);
  }
}

export function clearLocalPosterCache() {
  memoryCache.clear();
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear local poster cache:', e);
  }
}
