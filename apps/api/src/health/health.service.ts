import net from "node:net";

const postgresSslRequestBuffer = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]);
const postgresAcceptedResponses = new Set([83, 78]); // "S" or "N"
const redisPingBuffer = Buffer.from("*1\r\n$4\r\nPING\r\n", "utf8");

type DependencyStatus = "healthy" | "unhealthy";

export type DependencyCheckResult = {
  status: DependencyStatus;
  latencyMs: number;
  detail?: string;
};

export type HealthResult = {
  status: "healthy" | "unhealthy";
  checks: {
    database: DependencyCheckResult;
    redis: DependencyCheckResult;
  };
};

type HostAndPort = {
  host: string;
  port: number;
};

type ProbeConfig = {
  prefix: "POSTGRES" | "REDIS";
  targetUrl: string;
  defaultPort: number;
  requestBuffer: Buffer;
  isValidResponse: (chunk: Buffer) => boolean;
  invalidResponseCode: string;
};

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "CHECK_FAILED";
  }

  const maybeErrno = error as NodeJS.ErrnoException;
  return maybeErrno.code ?? "CHECK_FAILED";
};

const parseHostAndPort = (value: string, defaultPort: number): HostAndPort => {
  const parsed = new URL(value);

  return {
    host: parsed.hostname,
    port: parsed.port ? Number.parseInt(parsed.port, 10) : defaultPort,
  };
};

const readOnce = (socket: net.Socket) =>
  new Promise<Buffer>((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      cleanup();
      resolve(chunk);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onClose = () => {
      cleanup();
      reject(new Error("Socket closed before dependency responded."));
    };

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    socket.once("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
  });

const connectSocket = (address: HostAndPort) =>
  new Promise<net.Socket>((resolve, reject) => {
    const socket = net.createConnection({
      ...address,
      autoSelectFamily: true,
    });

    const onConnect = () => {
      cleanup();
      resolve(socket);
    };

    const onError = (error: Error) => {
      cleanup();
      socket.destroy();
      reject(error);
    };

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("error", onError);
    };

    socket.once("connect", onConnect);
    socket.once("error", onError);
  });

const closeSocket = (socket: net.Socket) =>
  new Promise<void>((resolve) => {
    if (socket.destroyed) {
      resolve();
      return;
    }

    const onSettled = () => {
      socket.off("close", onSettled);
      socket.off("error", onSettled);
      resolve();
    };

    socket.once("close", onSettled);
    socket.once("error", onSettled);
    socket.end();
  });

const createHealthyResult = (startedAt: number): DependencyCheckResult => ({
  status: "healthy",
  latencyMs: Date.now() - startedAt,
});

const createUnhealthyResult = (startedAt: number, detail: string): DependencyCheckResult => ({
  status: "unhealthy",
  latencyMs: Date.now() - startedAt,
  detail,
});

export class HealthService {
  constructor(
    private readonly databaseUrl: string,
    private readonly redisUrl: string,
  ) {}

  private async runProbe(config: ProbeConfig): Promise<DependencyCheckResult> {
    const startedAt = Date.now();

    try {
      const socket = await connectSocket(parseHostAndPort(config.targetUrl, config.defaultPort));

      try {
        socket.write(config.requestBuffer);
        const chunk = await readOnce(socket);

        if (!config.isValidResponse(chunk)) {
          return createUnhealthyResult(startedAt, config.invalidResponseCode);
        }

        return createHealthyResult(startedAt);
      } finally {
        await closeSocket(socket);
      }
    } catch (error) {
      return createUnhealthyResult(startedAt, `${config.prefix}_${getErrorCode(error)}`);
    }
  }

  private checkDatabase(): Promise<DependencyCheckResult> {
    return this.runProbe({
      prefix: "POSTGRES",
      targetUrl: this.databaseUrl,
      defaultPort: 5432,
      requestBuffer: postgresSslRequestBuffer,
      isValidResponse: (chunk) => chunk.length > 0 && postgresAcceptedResponses.has(chunk[0]),
      invalidResponseCode: "POSTGRES_UNEXPECTED_HANDSHAKE_RESPONSE",
    });
  }

  private async checkRedis(): Promise<DependencyCheckResult> {
    return this.runProbe({
      prefix: "REDIS",
      targetUrl: this.redisUrl,
      defaultPort: 6379,
      requestBuffer: redisPingBuffer,
      isValidResponse: (chunk) => chunk.toString("utf8").startsWith("+PONG"),
      invalidResponseCode: "REDIS_UNEXPECTED_PING_RESPONSE",
    });
  }

  async runChecks(): Promise<HealthResult> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status =
      database.status === "healthy" && redis.status === "healthy" ? "healthy" : "unhealthy";

    return {
      status,
      checks: {
        database,
        redis,
      },
    };
  }
}
