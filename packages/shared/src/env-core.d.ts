import type { ZodError, ZodType } from "zod";

export interface EnvValidationIssue {
  key: string;
  message: string;
}

export class EnvValidationError extends Error {
  readonly issues: readonly EnvValidationIssue[];

  constructor(issues: readonly EnvValidationIssue[]);
}

export function formatEnvValidationIssues(
  error: ZodError | EnvValidationError,
): EnvValidationIssue[];

export function createRequiredString(key: string): ZodType<string, string>;
export function createAbsoluteUrl(
  key: string,
  protocols?: readonly string[],
): ZodType<string, string>;
export function createOptionalAbsoluteUrl(
  key: string,
  protocols?: readonly string[],
): ZodType<string | undefined, string | undefined>;
export function createPositiveInteger(key: string): ZodType<number, string>;
export function createCorsOrigins(): ZodType<string[], string>;
