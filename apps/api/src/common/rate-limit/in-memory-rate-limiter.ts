import { AppError } from "../filters/app-error.filter.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RateLimitBucket = {
  limit: number;
  windowMs: number;
  timestamps: number[];
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const trimExpiredTimestamps = ({
  nowMs,
  windowMs,
  timestamps,
}: {
  nowMs: number;
  windowMs: number;
  timestamps: number[];
}) => timestamps.filter((ts) => nowMs - ts < windowMs);

const getRetryAfterSeconds = ({
  nowMs,
  windowMs,
  timestamps,
}: {
  nowMs: number;
  windowMs: number;
  timestamps: number[];
}) => {
  if (timestamps.length === 0) return 0;
  const oldest = Math.min(...timestamps);
  return Math.max(1, Math.ceil(Math.max(0, oldest + windowMs - nowMs) / 1000));
};

const buildRateLimitError = (retryAfterSeconds: number) =>
  new AppError({
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
    headers: { "Retry-After": String(retryAfterSeconds) },
  });

// ---------------------------------------------------------------------------
// Core class
// ---------------------------------------------------------------------------

/**
 * Generic sliding-window in-memory rate limiter keyed by arbitrary string keys.
 * Instantiate with `limit` (max requests) and `windowMs` (window duration).
 *
 * @example
 * const limiter = new InMemoryRateLimiter({ limit: 10, windowMs: 5 * 60 * 1000 });
 * limiter.consume("192.168.1.1");  // throws RATE_LIMITED when exhausted
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => Date;

  constructor({
    limit,
    windowMs,
    now = () => new Date(),
  }: {
    limit: number;
    windowMs: number;
    now?: () => Date;
  }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
  }

  private getOrCreate(key: string): RateLimitBucket {
    const existing = this.buckets.get(key);
    if (existing) return existing;
    const created: RateLimitBucket = { limit: this.limit, windowMs: this.windowMs, timestamps: [] };
    this.buckets.set(key, created);
    return created;
  }

  private prune(nowMs: number) {
    for (const [key, bucket] of this.buckets.entries()) {
      bucket.timestamps = trimExpiredTimestamps({ nowMs, windowMs: this.windowMs, timestamps: bucket.timestamps });
      if (bucket.timestamps.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  /** Registers one request for `key`. Throws `AppError(RATE_LIMITED)` when the limit is exceeded. */
  consume(key: string) {
    const nowMs = this.now().getTime();
    this.prune(nowMs);

    const bucket = this.getOrCreate(key);
    const trimmed = trimExpiredTimestamps({ nowMs, windowMs: this.windowMs, timestamps: bucket.timestamps });
    bucket.timestamps = trimmed;

    if (trimmed.length >= this.limit) {
      throw buildRateLimitError(getRetryAfterSeconds({ nowMs, windowMs: this.windowMs, timestamps: trimmed }));
    }

    bucket.timestamps.push(nowMs);
  }

  /**
   * Internal test helper to avoid exposing private bucket state.
   */
  _debugStats(key?: string) {
    if (key) {
      return { timestamps: this.buckets.get(key)?.timestamps || [] };
    }
    return { bucketCount: this.buckets.size };
  }
}
