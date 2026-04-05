const deterministicTimestamp = "2026-01-01T00:00:00.000Z";
const postgresHandshakeCode = 80877103;
const defaultRetryDelayMs = 1000;
const defaultMaxAttempts = 20;
const defaultAttemptTimeoutMs = 2000;
const digitsOnlyPattern = /^\d+$/;

function createPortError(name: string, rawValue: unknown) {
  return new Error(`${name} must be a valid TCP port (1-65535), got: ${String(rawValue)}`);
}

function requireDigitsOnly(name: string, rawValue: unknown): asserts rawValue is string {
  if (typeof rawValue !== "string" || !digitsOnlyPattern.test(rawValue)) {
    throw createPortError(name, rawValue);
  }
}

function requirePortRange(name: string, value: number, rawValue: unknown) {
  if (value < 1 || value > 65_535) {
    throw createPortError(name, rawValue);
  }
}

function parsePort(name: string, rawValue: unknown) {
  requireDigitsOnly(name, rawValue);
  const value = Number.parseInt(rawValue, 10);
  requirePortRange(name, value, rawValue);
  return value;
}

function createPostgresSslRequest() {
  const request = Buffer.alloc(8);
  request.writeInt32BE(8, 0);
  request.writeInt32BE(postgresHandshakeCode, 4);
  return request;
}

export function createServiceSmokeFixtures(env: NodeJS.ProcessEnv = process.env) {
  const postgresHost = env.POSTGRES_HOST ?? "127.0.0.1";
  const postgresPort = parsePort("POSTGRES_PORT", env.POSTGRES_PORT ?? "5432");
  const redisHost = env.REDIS_HOST ?? "127.0.0.1";
  const redisPort = parsePort("REDIS_PORT", env.REDIS_PORT ?? "6379");

  return Object.freeze({
    metadata: Object.freeze({
      suiteId: "cs-003-integration-smoke",
      fixtureVersion: 1,
      createdAt: deterministicTimestamp,
    }),
    timing: Object.freeze({
      retryDelayMs: defaultRetryDelayMs,
      maxAttempts: defaultMaxAttempts,
      attemptTimeoutMs: defaultAttemptTimeoutMs,
    }),
    services: Object.freeze({
      postgres: Object.freeze({
        id: "fixture-postgres-smoke",
        host: postgresHost,
        port: postgresPort,
        label: `postgres at ${postgresHost}:${postgresPort}`,
        sslRequest: createPostgresSslRequest(),
        acceptedResponses: Object.freeze([
          "S".charCodeAt(0),
          "N".charCodeAt(0),
        ]),
        teardown: "close the socket with socket.end() in a finally block",
      }),
      redis: Object.freeze({
        id: "fixture-redis-smoke",
        host: redisHost,
        port: redisPort,
        label: `redis at ${redisHost}:${redisPort}`,
        pingCommand: "*1\r\n$4\r\nPING\r\n",
        expectedResponse: /^\+PONG\r\n/,
        teardown: "close the socket with socket.end() in a finally block",
      }),
    }),
    localSetup: Object.freeze({
      startServicesCommand: "docker compose up -d postgres redis",
      verifyServicesCommand: "docker compose ps",
      optionalTeardownCommand: "docker compose stop postgres redis",
    }),
  });
}
