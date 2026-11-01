/**
 * BHAIRAVI Creations Digital Platform
 * Sliding Window IP Rate Limiter Module with LRU Eviction & TTL Sweeper
 * Target: src/server/middleware/rate_limiter.ts
 */

interface RateLimitTracker {
  count: number;
  windowStart: number;
  lastAccess: number;
}

export interface RateLimiterOptions {
  maxCapacity?: number;
  cleanupIntervalMs?: number;
  enableTimer?: boolean;
}

export class SlidingWindowRateLimiter {
  private tracker = new Map<string, RateLimitTracker>();
  private maxCapacity: number;
  private cleanupIntervalMs: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(
    private maxRequests: number,
    private windowMs: number,
    private defaultErrorMessage: string = 'Rate limit exceeded',
    options?: RateLimiterOptions
  ) {
    this.maxCapacity = options?.maxCapacity ?? 10_000;
    this.cleanupIntervalMs = options?.cleanupIntervalMs ?? Math.min(windowMs, 60_000);

    if (options?.enableTimer !== false) {
      this.startCleanupTimer();
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      this.evictExpired();
    }, this.cleanupIntervalMs);

    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Sweeps and evicts all entries whose sliding window has elapsed.
   * Returns number of evicted keys.
   */
  public evictExpired(now: number = Date.now()): number {
    let evicted = 0;
    for (const [key, entry] of this.tracker.entries()) {
      if (now - entry.windowStart > this.windowMs) {
        this.tracker.delete(key);
        evicted++;
      }
    }
    return evicted;
  }

  /**
   * Enforces LRU capacity constraint by evicting oldest entries.
   */
  private enforceCapacity(now: number): void {
    if (this.tracker.size >= this.maxCapacity) {
      // First pass: prune expired entries
      this.evictExpired(now);

      // Second pass: if still at or over capacity, evict least recently used entries
      while (this.tracker.size >= this.maxCapacity) {
        const oldestKey = this.tracker.keys().next().value;
        if (oldestKey === undefined) break;
        this.tracker.delete(oldestKey);
      }
    }
  }

  public check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number; error?: string } {
    const now = Date.now();
    const existing = this.tracker.get(key);

    let entry: RateLimitTracker;

    if (!existing || now - existing.windowStart > this.windowMs) {
      // New or expired window
      entry = { count: 1, windowStart: now, lastAccess: now };
    } else {
      entry = {
        count: existing.count + 1,
        windowStart: existing.windowStart,
        lastAccess: now
      };
    }

    // LRU re-insertion: delete and set moves key to most-recently-used position in Map
    this.tracker.delete(key);

    // Evict before insertion if at capacity
    this.enforceCapacity(now);

    this.tracker.set(key, entry);

    if (entry.count > this.maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.windowStart + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds, error: this.defaultErrorMessage };
    }

    return { allowed: true, remaining: this.maxRequests - entry.count, retryAfterSeconds: 0 };
  }

  public reset(key?: string): void {
    if (key) {
      this.tracker.delete(key);
    } else {
      this.tracker.clear();
    }
  }

  public size(): number {
    return this.tracker.size;
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.tracker.clear();
  }
}

// Global Limiter Singletons bound to environment settings
export const authRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.RATE_LIMIT_AUTH_PER_15_MINUTES) || 5,
  15 * 60 * 1000,
  'Too many login attempts from this IP. Throttled for 15 minutes.'
);

export const enquiryRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.RATE_LIMIT_ENQUIRY_MAX_PER_HOUR) || 5,
  60 * 60 * 1000,
  'Hourly custom order submission limit reached for this connection.'
);

export const telemetryRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.RATE_LIMIT_EVENTS_PER_MINUTE) || 60,
  60 * 1000,
  'Telemetry rate limit exceeded: max 60 requests per minute.'
);

export const aiAnalystRateLimiter = new SlidingWindowRateLimiter(
  Number(process.env.RATE_LIMIT_AI_ANALYST_PER_MINUTE) || 30,
  60 * 1000,
  'AI Analyst rate limit exceeded: maximum 30 requests per minute.'
);
