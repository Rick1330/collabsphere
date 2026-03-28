const heartbeatMs = Number.parseInt(process.env.WORKER_HEARTBEAT_MS ?? "5000", 10);

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
