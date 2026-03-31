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
    socket.once("close", () => resolve());
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

  private async checkDatabase(): Promise<DependencyCheckResult> {
    const startedAt = Date.now();

    try {
      const socket = await connectSocket(parseHostAndPort(this.databaseUrl, 5432));

      try {
        socket.write(postgresSslRequestBuffer);
        const chunk = await readOnce(socket);

        if (!chunk.length || !postgresAcceptedResponses.has(chunk[0])) {
          return createUnhealthyResult(startedAt, "POSTGRES_UNEXPECTED_HANDSHAKE_RESPONSE");
        }

        return createHealthyResult(startedAt);
      } finally {
        await closeSocket(socket);
      }
    } catch (error) {
      return createUnhealthyResult(startedAt, `POSTGRES_${getErrorCode(error)}`);
    }
  }

  private async checkRedis(): Promise<DependencyCheckResult> {
    const startedAt = Date.now();

    try {
      const socket = await connectSocket(parseHostAndPort(this.redisUrl, 6379));

      try {
        socket.write(redisPingBuffer);
        const chunk = await readOnce(socket);

        if (!chunk.toString("utf8").startsWith("+PONG")) {
          return createUnhealthyResult(startedAt, "REDIS_UNEXPECTED_PING_RESPONSE");
        }

        return createHealthyResult(startedAt);
      } finally {
        await closeSocket(socket);
      }
    } catch (error) {
      return createUnhealthyResult(startedAt, `REDIS_${getErrorCode(error)}`);
    }
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
