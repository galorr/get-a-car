import { Injectable, signal, computed } from '@angular/core';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  excludedUrls: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cacheSignal = signal<Map<string, CacheEntry<any>>>(new Map());
  private configSignal = signal<CacheConfig>({
    ttl: 5 * 60 * 1000, // 5 minutes default TTL
    maxSize: 100, // Default max cache size
    excludedUrls: []
  });

  // Computed signal for cache size
  public cacheSize = computed(() => this.cacheSignal().size);

  // Computed signal for cache keys
  public cacheKeys = computed(() => Array.from(this.cacheSignal().keys()));

  constructor() {
    // Setup periodic cache cleanup
    setInterval(() => this.cleanupExpiredEntries(), 60 * 1000); // Cleanup every minute
  }

  /**
   * Configure the cache service
   */
  configure(config: Partial<CacheConfig>): void {
    this.configSignal.update(currentConfig => ({
      ...currentConfig,
      ...config
    }));
  }

  /**
   * Get the current cache configuration
   */
  getConfig(): CacheConfig {
    return this.configSignal();
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string): T | null {
    const cache = this.cacheSignal();
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const config = this.configSignal();

    // Check if entry has expired
    if (now - entry.timestamp > config.ttl) {
      this.remove(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T): void {
    const config = this.configSignal();

    // Check if URL should be excluded from caching
    if (config.excludedUrls?.some(pattern => key.includes(pattern))) {
      return;
    }

    this.cacheSignal.update(cache => {
      // Check if we need to remove oldest entries to maintain max size
      if (cache.size >= config.maxSize) {
        this.removeOldestEntries(1);
      }

      // Create a new Map to trigger change detection
      const newCache = new Map(cache);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        key
      });

      return newCache;
    });
  }

  /**
   * Remove an item from the cache
   */
  remove(key: string): void {
    this.cacheSignal.update(cache => {
      const newCache = new Map(cache);
      newCache.delete(key);
      return newCache;
    });
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cacheSignal.set(new Map());
  }

  /**
   * Remove entries that match a pattern
   */
  removeByPattern(pattern: string): void {
    this.cacheSignal.update(cache => {
      const newCache = new Map(cache);

      for (const key of newCache.keys()) {
        if (key.includes(pattern)) {
          newCache.delete(key);
        }
      }

      return newCache;
    });
  }

  /**
   * Check if an item exists in the cache and is not expired
   */
  has(key: string): boolean {
    const cache = this.cacheSignal();
    const entry = cache.get(key);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    const config = this.configSignal();

    // Check if entry has expired
    if (now - entry.timestamp > config.ttl) {
      this.remove(key);
      return false;
    }

    return true;
  }

  /**
   * Remove expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const config = this.configSignal();

    this.cacheSignal.update(cache => {
      const newCache = new Map(cache);

      for (const [key, entry] of newCache.entries()) {
        if (now - entry.timestamp > config.ttl) {
          newCache.delete(key);
        }
      }

      return newCache;
    });
  }

  /**
   * Remove the oldest entries from the cache
   */
  private removeOldestEntries(count: number): void {
    this.cacheSignal.update(cache => {
      const newCache = new Map(cache);
      const entries = Array.from(newCache.values())
        .sort((a, b) => a.timestamp - b.timestamp);

      // Remove the oldest entries
      for (let i = 0; i < Math.min(count, entries.length); i++) {
        newCache.delete(entries[i].key);
      }

      return newCache;
    });
  }
}
