import { InMemoryRateLimiter } from "../common/rate-limit/in-memory-rate-limiter.js";

const registerLimitPerHour = 5;
const oneHourMs = 60 * 60 * 1000;

/**
 * Rate limiter for `POST /api/v1/auth/register`.
 * Applies two independent sliding-window checks:
 *  - 5 registrations / hour / IP
 *  - 5 registrations / hour / normalised email
 * Delegates all bucket/window logic to {@link InMemoryRateLimiter}.
 */
export class RegisterRateLimiter {
  private readonly ipLimiter: InMemoryRateLimiter;
  private readonly emailLimiter: InMemoryRateLimiter;

  constructor({ now = () => new Date() }: { now?: () => Date } = {}) {
    const opts = { limit: registerLimitPerHour, windowMs: oneHourMs, now };
    this.ipLimiter = new InMemoryRateLimiter(opts);
    this.emailLimiter = new InMemoryRateLimiter(opts);
  }

  consume({ ipAddress, normalizedEmail }: { ipAddress: string; normalizedEmail: string }) {
    // Check IP first so we don't record the email attempt when IP is already throttled.
    this.ipLimiter.consume(ipAddress.trim() || "unknown");
    this.emailLimiter.consume(normalizedEmail.trim().toLowerCase());
  }
}
