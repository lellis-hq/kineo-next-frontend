/**
 * Small client-side cache for browse reads. The TTL bounds staleness after a
 * backend mutation; the size bound keeps a long browsing session from growing
 * without limit. Entries are plain JSON data, never promises.
 */
const TTL_MS = 30_000;
const MAX_ENTRIES = 24;

interface Entry {
  data: unknown;
  at: number;
}

const entries = new Map<string, Entry>();

export function readBrowseCache<T>(key: string): T | undefined {
  const entry = entries.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.at > TTL_MS) {
    entries.delete(key);
    return undefined;
  }
  // Refresh insertion order so the LRU eviction keeps the recently used views.
  entries.delete(key);
  entries.set(key, entry);
  return entry.data as T;
}

export function writeBrowseCache<T>(key: string, data: T): T {
  entries.set(key, { data, at: Date.now() });
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
  return data;
}

export function invalidateBrowseCache(): void {
  entries.clear();
}
