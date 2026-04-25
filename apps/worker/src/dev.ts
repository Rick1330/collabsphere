import { EnvValidationError, parseRuntimeEnv } from "../../../packages/shared/src/runtime-env.js";
import { validateServiceEnv } from "../../../packages/shared/src/bootstrap-runtime.js";
import { startVerificationEmailProcessor } from "./jobs/email/verification-email-processor.js";

const defaultHeartbeatMs = 5000;
const minHeartbeatMs = 1000;
const maxHeartbeatMs = 60000;

const parseHeartbeatMs = (value: string | undefined) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return defaultHeartbeatMs;
  }

  if (!/^\d+$/.test(trimmed)) {
    console.warn(`[worker] invalid WORKER_HEARTBEAT_MS value "${value}", falling back to ${defaultHeartbeatMs}ms`);
    return defaultHeartbeatMs;
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(`[worker] invalid WORKER_HEARTBEAT_MS value "${value}", falling back to ${defaultHeartbeatMs}ms`);
    return defaultHeartbeatMs;
  }

  if (parsed < minHeartbeatMs) {
    console.warn(`[worker] WORKER_HEARTBEAT_MS below minimum, clamping to ${minHeartbeatMs}ms`);
    return minHeartbeatMs;
  }

  if (parsed > maxHeartbeatMs) {
    console.warn(`[worker] WORKER_HEARTBEAT_MS above maximum, clamping to ${maxHeartbeatMs}ms`);
    return maxHeartbeatMs;
  }

  return parsed;
};

const workerEnv = validateServiceEnv({
  service: "worker",
  parser: parseRuntimeEnv,
  validationErrorClass: EnvValidationError,
});
const stopVerificationEmailProcessor = startVerificationEmailProcessor({
  jwtAccessSecret: workerEnv.JWT_ACCESS_SECRET,
  baseUrl: workerEnv.BASE_URL,
});

const heartbeatMs = parseHeartbeatMs(process.env.WORKER_HEARTBEAT_MS);

console.log("[worker] bootstrap started");
console.log(`[worker] heartbeat interval ${heartbeatMs}ms`);

const timer = setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, heartbeatMs);

const shutdown = (signal: string) => {
  console.log(`[worker] received ${signal}, shutting down`);
  stopVerificationEmailProcessor();
  clearInterval(timer);
  process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
