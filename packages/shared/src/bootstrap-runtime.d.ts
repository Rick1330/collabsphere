import type { Server } from "node:http";

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

export function parseServicePort(options: ParseServicePortOptions): number;
export function startHttpBootstrapServer(options: StartHttpBootstrapServerOptions): void;
export function validateServiceEnv<TEnv, TError extends Error>(
  options: ValidateServiceEnvOptions<TEnv, TError>,
): TEnv;
