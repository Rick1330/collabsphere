import { z, ZodError } from "zod";

/** @typedef {{ key: string, message: string }} EnvValidationIssue */

const positiveIntegerPattern = /^\d+$/;
const corsOriginProtocols = ["http:", "https:"];

const issueMessageByCode = (issue) => issue.message || "is invalid.";

/** @param {{ message?: string, path: readonly PropertyKey[] }} issue */
const toValidationIssue = (issue) => ({
  key: String(issue.path[0] ?? "env"),
  message: issueMessageByCode(issue),
});

/**
 * @param {readonly EnvValidationIssue[]} issues
 */
const formatValidationMessage = (issues) => {
  const detail = issues.map((issue) => `${issue.key}: ${issue.message}`).join("; ");
  return `Environment validation failed. Review .env.example and fix: ${detail}`;
};

export class EnvValidationError extends Error {
  /**
   * @param {readonly EnvValidationIssue[]} issues
   */
  constructor(issues) {
    super(formatValidationMessage(issues));
    this.name = "EnvValidationError";
    this.issues = issues;
  }
}

/**
 * @param {ZodError | EnvValidationError} error
 * @returns {EnvValidationIssue[]}
 */
export const formatEnvValidationIssues = (error) => {
  if (error instanceof EnvValidationError) {
    return [...error.issues];
  }

  return error.issues.map(toValidationIssue);
};

/**
 * @param {string} key
 */
export const createRequiredString = (key) =>
  z
    .string({
      error: `${key} is required.`,
    })
    .trim()
    .min(1, `${key} is required.`);

/**
 * @param {string} key
 * @param {readonly string[]=} protocols
 */
export const createAbsoluteUrl = (key, protocols) =>
  createRequiredString(key).superRefine((value, context) => {
    let parsedUrl;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must be a valid absolute URL.`,
      });
      return;
    }

    if (protocols && !protocols.includes(parsedUrl.protocol)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${key} must use one of: ${protocols.join(", ")}.`,
      });
    }
  });

/**
 * @param {string} key
 * @param {readonly string[]=} protocols
 */
export const createOptionalAbsoluteUrl = (key, protocols) =>
  z
    .string()
    .trim()
    .min(1, `${key} must not be empty when provided.`)
    .superRefine((value, context) => {
      let parsedUrl;

      try {
        parsedUrl = new URL(value);
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must be a valid absolute URL.`,
        });
        return;
      }

      if (protocols && !protocols.includes(parsedUrl.protocol)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} must use one of: ${protocols.join(", ")}.`,
        });
      }
    })
    .optional();

/**
 * @param {string} key
 */
export const createPositiveInteger = (key) =>
  createRequiredString(key)
    .refine((value) => positiveIntegerPattern.test(value), {
      message: `${key} must be a positive integer.`,
    })
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: `${key} must be a positive integer.`,
    });

const isBareOrigin = (value) =>
  !value.username &&
  !value.password &&
  value.pathname === "/" &&
  !value.search &&
  !value.hash;

export const createCorsOrigins = () =>
  createRequiredString("CORS_ORIGINS")
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .superRefine((origins, context) => {
      if (origins.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CORS_ORIGINS must include at least one absolute origin.",
        });
        return;
      }

      for (const [index, origin] of origins.entries()) {
        try {
          const parsedUrl = new URL(origin);
          if (!corsOriginProtocols.includes(parsedUrl.protocol)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `CORS_ORIGINS entry ${index + 1} must use http: or https:.`,
            });
            continue;
          }

          if (!isBareOrigin(parsedUrl)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                `CORS_ORIGINS entry ${index + 1} must be a bare origin (scheme, host, optional port).`,
            });
          }
        } catch {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `CORS_ORIGINS entry ${index + 1} must be a valid absolute origin.`,
          });
        }
      }
    })
    .transform((origins) => origins.map((origin) => new URL(origin).origin));
