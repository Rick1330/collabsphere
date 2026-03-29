const defaultHeartbeatMs = 5000;
const minHeartbeatMs = 1000;
const maxHeartbeatMs = 60000;

const parseHeartbeatMs = (value) => {
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

const heartbeatMs = parseHeartbeatMs(process.env.WORKER_HEARTBEAT_MS);

console.log("[worker] bootstrap started");
console.log(`[worker] heartbeat interval ${heartbeatMs}ms`);

const timer = setInterval(() => {
  console.log(`[worker] heartbeat ${new Date().toISOString()}`);
}, heartbeatMs);

const shutdown = (signal) => {
  console.log(`[worker] received ${signal}, shutting down`);
  clearInterval(timer);
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
