import type { Server } from "node:http";

const defaultHost = "127.0.0.1";

export interface ParseServicePortOptions {
  service: string;
  value?: string | undefined;
  fallback: number;
}

export interface StartHttpBootstrapServerOptions {
  server: Server;
  service: string;
  defaultPort: number;
  readyPath?: string | undefined;
}

export interface ValidateServiceEnvOptions<TEnv, TError extends Error> {
  service: string;
  parser: (input: Record<string, string | undefined>) => TEnv;
  validationErrorClass: new (...args: any[]) => TError;
  input?: Record<string, string | undefined> | undefined;
}

type ListenError = NodeJS.ErrnoException & { code?: string };

const warnInvalidPort = (service: string, value: string | undefined, fallback: number) => {
  console.warn(`[${service}] invalid PORT value "${value}", falling back to ${fallback}`);
  return fallback;
};

export const parseServicePort = ({
  service,
  value = process.env.PORT,
  fallback,
}: ParseServicePortOptions) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  if (!/^\d+$/.test(trimmed)) {
    return warnInvalidPort(service, value, fallback);
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isInteger(parsed)) {
    return warnInvalidPort(service, value, fallback);
  }

  if (parsed < 0) {
    return warnInvalidPort(service, value, fallback);
  }

  if (parsed > 65535) {
    return warnInvalidPort(service, value, fallback);
  }

  return parsed;
};

const listenWithFallback = ({
  server,
  service,
  host,
  candidatePort,
  readyPath,
}: {
  server: Server;
  service: string;
  host: string;
  candidatePort: number;
  readyPath: string;
}) => {
  const onListening = () => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : candidatePort;
    console.log(`[${service}] bootstrap listening on http://${host}:${activePort}${readyPath}`);
  };

  server
    .once("error", (error: ListenError) => {
      server.removeListener("listening", onListening);

      if (error.code === "EADDRINUSE" && candidatePort !== 0) {
        console.warn(`[${service}] port ${candidatePort} in use, retrying on an ephemeral port`);
        listenWithFallback({ server, service, host, candidatePort: 0, readyPath });
        return;
      }

      throw error;
    })
    .once("listening", onListening)
    .listen(candidatePort, host);
};

export const startHttpBootstrapServer = ({
  server,
  service,
  defaultPort,
  readyPath = "",
}: StartHttpBootstrapServerOptions) => {
  const host = process.env.HOST ?? defaultHost;
  const port = parseServicePort({
    service,
    fallback: defaultPort,
  });

  listenWithFallback({
    server,
    service,
    host,
    candidatePort: port,
    readyPath,
  });

  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.log(`[${service}] received ${signal}, shutting down`);
    server.close(() => process.exit(0));
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

export const validateServiceEnv = <TEnv, TError extends Error>({
  service,
  parser,
  validationErrorClass,
  input = process.env,
}: ValidateServiceEnvOptions<TEnv, TError>): TEnv => {
  try {
    return parser(input);
  } catch (error) {
    if (error instanceof validationErrorClass) {
      console.error(`[${service}] ${error.message}`);
      process.exit(1);
    }

    throw error;
  }
};
