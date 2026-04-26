import { InMemoryRateLimiter } from "../common/rate-limit/in-memory-rate-limiter.js";

const verifyEmailLimitPerWindow = 10;
const fiveMinutesMs = 5 * 60 * 1000;

/**
 * Rate limiter for `POST /api/v1/auth/verify-email`.
 * Allows 10 requests per 5-minute sliding window per IP address.
 * Delegates all bucket/window logic to {@link InMemoryRateLimiter}.
 */
export class VerifyEmailRateLimiter {
  private readonly ipLimiter: InMemoryRateLimiter;

  constructor({ now = () => new Date() }: { now?: () => Date } = {}) {
    this.ipLimiter = new InMemoryRateLimiter({
      limit: verifyEmailLimitPerWindow,
      windowMs: fiveMinutesMs,
      now,
    });
  }

  consume({ ipAddress }: { ipAddress: string }) {
    this.ipLimiter.consume(ipAddress.trim() || "unknown");
  }
}
