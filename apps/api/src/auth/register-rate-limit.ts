import { AppError } from "../common/filters/app-error.filter.js";

type RateLimitBucket = {
  limit: number;
  windowMs: number;
  timestamps: number[];
};

const registerLimitPerHour = 5;
const oneHourMs = 60 * 60 * 1000;
const millisecondsPerSecond = 1000;

const trimExpiredTimestamps = ({
  nowMs,
  windowMs,
  timestamps,
}: {
  nowMs: number;
  windowMs: number;
  timestamps: number[];
}) => timestamps.filter((timestamp) => nowMs - timestamp < windowMs);

const getRetryAfterSeconds = ({
  nowMs,
  windowMs,
  timestamps,
}: {
  nowMs: number;
  windowMs: number;
  timestamps: number[];
}) => {
  if (timestamps.length === 0) {
    return 0;
  }

  const oldestTimestamp = Math.min(...timestamps);
  const waitMs = Math.max(0, oldestTimestamp + windowMs - nowMs);
  return Math.max(1, Math.ceil(waitMs / millisecondsPerSecond));
};

const createBucket = (): RateLimitBucket => ({
  limit: registerLimitPerHour,
  windowMs: oneHourMs,
  timestamps: [],
});

const buildRateLimitError = (retryAfterSeconds: number) =>
  new AppError({
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
    headers: {
      "Retry-After": String(retryAfterSeconds),
    },
  });

export class RegisterRateLimiter {
  private readonly ipBuckets = new Map<string, RateLimitBucket>();

  private readonly emailBuckets = new Map<string, RateLimitBucket>();

  private readonly now: () => Date;

  constructor({ now = () => new Date() }: { now?: () => Date } = {}) {
    this.now = now;
  }

  private getBucket({
    source,
    key,
  }: {
    source: Map<string, RateLimitBucket>;
    key: string;
  }) {
    const existing = source.get(key);

    if (existing) {
      return existing;
    }

    const created = createBucket();
    source.set(key, created);
    return created;
  }

  private assertAllowed({
    source,
    key,
    bucket,
    nowMs,
  }: {
    source: Map<string, RateLimitBucket>;
    key: string;
    bucket: RateLimitBucket;
    nowMs: number;
  }) {
    const trimmed = trimExpiredTimestamps({
      nowMs,
      windowMs: bucket.windowMs,
      timestamps: bucket.timestamps,
    });
    bucket.timestamps = trimmed;
    if (trimmed.length === 0) {
      source.delete(key);
      return;
    }

    if (trimmed.length >= bucket.limit) {
      throw buildRateLimitError(
        getRetryAfterSeconds({
          nowMs,
          windowMs: bucket.windowMs,
          timestamps: trimmed,
        }),
      );
    }
  }

  private pruneSource(source: Map<string, RateLimitBucket>, nowMs: number) {
    for (const [key, bucket] of source.entries()) {
      bucket.timestamps = trimExpiredTimestamps({
        nowMs,
        windowMs: bucket.windowMs,
        timestamps: bucket.timestamps,
      });
      if (bucket.timestamps.length === 0) {
        source.delete(key);
      }
    }
  }

  consume({ ipAddress, normalizedEmail }: { ipAddress: string; normalizedEmail: string }) {
    const nowMs = this.now().getTime();
    this.pruneSource(this.ipBuckets, nowMs);
    this.pruneSource(this.emailBuckets, nowMs);
    const ipKey = ipAddress.trim() || "unknown";
    const emailKey = normalizedEmail.trim().toLowerCase();
    const ipBucket = this.getBucket({
      source: this.ipBuckets,
      key: ipKey,
    });
    const emailBucket = this.getBucket({
      source: this.emailBuckets,
      key: emailKey,
    });

    try {
      this.assertAllowed({
        source: this.ipBuckets,
        key: ipKey,
        bucket: ipBucket,
        nowMs,
      });
      this.assertAllowed({
        source: this.emailBuckets,
        key: emailKey,
        bucket: emailBucket,
        nowMs,
      });
    } catch (error) {
      if (error instanceof AppError && error.code === "RATE_LIMITED") {
        throw error;
      }

      throw buildRateLimitError(1);
    }

    const activeIpBucket =
      this.ipBuckets.get(ipKey) ??
      this.getBucket({
        source: this.ipBuckets,
        key: ipKey,
      });
    const activeEmailBucket =
      this.emailBuckets.get(emailKey) ??
      this.getBucket({
        source: this.emailBuckets,
        key: emailKey,
      });

    activeIpBucket.timestamps.push(nowMs);
    activeEmailBucket.timestamps.push(nowMs);
  }
}
