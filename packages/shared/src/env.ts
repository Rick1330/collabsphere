import { ZodError, type ZodIssue } from "zod";

import {
  envRedaction,
  sharedEnvSchema,
  type SanitizedSharedEnv,
  type SharedEnv,
} from "./env.schema.js";

export type { SanitizedSharedEnv, SharedEnv } from "./env.schema.js";
export {
  envRedaction,
  optionalEnvKeys,
  requiredEnvKeys,
  sharedEnvSchema,
} from "./env.schema.js";

export interface EnvValidationIssue {
  key: string;
  message: string;
}

const issueMessageByCode = (issue: ZodIssue) => issue.message || "is invalid.";

const toValidationIssue = (issue: ZodIssue): EnvValidationIssue => ({
  key: String(issue.path[0] ?? "env"),
  message: issueMessageByCode(issue),
});

const formatValidationMessage = (issues: readonly EnvValidationIssue[]) => {
  const detail = issues.map((issue) => `${issue.key}: ${issue.message}`).join("; ");
  return `Environment validation failed. Review .env.example and fix: ${detail}`;
};

const redactUrlCredentials = (value: string) => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return value;
  }

  if (!parsedUrl.username && !parsedUrl.password) {
    return value;
  }

  const authority = `[redacted]@${parsedUrl.host}`;
  return `${parsedUrl.protocol}//${authority}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
};

export class EnvValidationError extends Error {
  readonly issues: readonly EnvValidationIssue[];

  constructor(issues: readonly EnvValidationIssue[]) {
    super(formatValidationMessage(issues));
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

export const formatEnvValidationIssues = (error: ZodError | EnvValidationError) => {
  if (error instanceof EnvValidationError) {
    return [...error.issues];
  }

  return error.issues.map(toValidationIssue);
};

export const parseEnv = (input: Record<string, string | undefined>): SharedEnv => {
  const parsed = sharedEnvSchema.safeParse(input);

  if (!parsed.success) {
    throw new EnvValidationError(formatEnvValidationIssues(parsed.error));
  }

  return parsed.data;
};

export const sanitizeEnv = (config: SharedEnv): SanitizedSharedEnv => ({
  ...config,
  DATABASE_URL: redactUrlCredentials(config.DATABASE_URL),
  REDIS_URL: redactUrlCredentials(config.REDIS_URL),
  JWT_ACCESS_SECRET: envRedaction.redactedValue,
  EMAIL_PROVIDER_API_KEY: envRedaction.redactedValue,
  COLLAB_DATABASE_URL: redactUrlCredentials(config.COLLAB_DATABASE_URL),
  COLLAB_REDIS_URL: config.COLLAB_REDIS_URL
    ? redactUrlCredentials(config.COLLAB_REDIS_URL)
    : undefined,
  COLLAB_JWT_SECRET: envRedaction.redactedValue,
  S3_ACCESS_KEY_ID: envRedaction.redactedValue,
  S3_SECRET_ACCESS_KEY: envRedaction.redactedValue,
});
