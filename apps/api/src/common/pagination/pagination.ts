import { ValidationAppError } from "../filters/app-error.filter.js";
import type { ResponsePaginationMeta } from "../response/response-envelope.js";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
export const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;

export type AllowedPageSize = (typeof ALLOWED_PAGE_SIZES)[number];

export type PaginationQueryInput = {
  page?: string | null;
  pageSize?: string | null;
};

export type PaginationParams = {
  page: number;
  pageSize: AllowedPageSize;
  offset: number;
  limit: AllowedPageSize;
};

const createValidationIssue = ({
  field,
  message,
  rule,
}: {
  field: "page" | "pageSize" | "totalItems";
  message: string;
  rule: string;
}) => ({
  field,
  message,
  rule,
});

const getPositiveSafeIntegerIssue = ({
  field,
  value,
  label,
}: {
  field: "page" | "pageSize" | "totalItems";
  value: number;
  label: string;
}) => {
  if (Number.isSafeInteger(value) && value > 0) {
    return null;
  }

  return createValidationIssue({
    field,
    message: `${label} must be a positive safe integer`,
    rule: "isSafePositiveInt",
  });
};

const parseIntegerParameter = ({
  value,
  field,
  defaultValue,
}: {
  value?: string | null;
  field: "page" | "pageSize";
  defaultValue: number;
}) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationAppError({
      issues: [
        {
          field,
          message: `${field} must be a positive integer`,
          rule: "isInt",
        },
      ],
    });
  }

  if (!/^\d+$/u.test(trimmed)) {
    throw new ValidationAppError({
      issues: [
        {
          field,
          message: `${field} must be a positive integer`,
          rule: "isInt",
        },
      ],
    });
  }

  return Number.parseInt(trimmed, 10);
};

export const parsePaginationParams = ({
  page,
  pageSize,
}: PaginationQueryInput): PaginationParams => {
  const resolvedPage = parseIntegerParameter({
    value: page,
    field: "page",
    defaultValue: DEFAULT_PAGE,
  });
  const resolvedPageSize = parseIntegerParameter({
    value: pageSize,
    field: "pageSize",
    defaultValue: DEFAULT_PAGE_SIZE,
  });

  const issues: Array<ReturnType<typeof createValidationIssue>> = [];

  if (resolvedPage <= 0) {
    issues.push(
      createValidationIssue({
        field: "page",
        message: "page must be greater than or equal to 1",
        rule: "min",
      }),
    );
  }

  if (!Number.isSafeInteger(resolvedPage)) {
    issues.push(
      createValidationIssue({
        field: "page",
        message: "page must be a safe integer",
        rule: "isSafeInteger",
      }),
    );
  }

  if (!ALLOWED_PAGE_SIZES.includes(resolvedPageSize as AllowedPageSize)) {
    issues.push(
      createValidationIssue({
        field: "pageSize",
        message: `pageSize must be one of ${ALLOWED_PAGE_SIZES.join(", ")}`,
        rule: "isIn",
      }),
    );
  }

  const offset = (resolvedPage - 1) * resolvedPageSize;
  if (!Number.isSafeInteger(offset)) {
    issues.push(
      createValidationIssue({
        field: "page",
        message: "page is too large",
        rule: "maxSafeOffset",
      }),
    );
  }

  if (issues.length > 0) {
    throw new ValidationAppError({ issues });
  }

  return {
    page: resolvedPage,
    pageSize: resolvedPageSize as AllowedPageSize,
    offset,
    limit: resolvedPageSize as AllowedPageSize,
  };
};

export const createPaginationMeta = ({
  page,
  pageSize,
  totalItems,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
}): ResponsePaginationMeta => {
  const issues = [
    getPositiveSafeIntegerIssue({
      field: "page",
      value: page,
      label: "page",
    }),
    getPositiveSafeIntegerIssue({
      field: "pageSize",
      value: pageSize,
      label: "pageSize",
    }),
    Number.isSafeInteger(totalItems) && totalItems >= 0
      ? null
      : createValidationIssue({
          field: "totalItems",
          message: "totalItems must be a non-negative safe integer",
          rule: "isSafeNonNegativeInt",
        }),
  ].filter((issue): issue is ReturnType<typeof createValidationIssue> => issue !== null);

  if (issues.length > 0) {
    throw new ValidationAppError({ issues });
  }

  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
};

export const slicePageItems = <TItem>(
  items: readonly TItem[],
  pagination: Pick<PaginationParams, "offset" | "pageSize">,
) => items.slice(pagination.offset, pagination.offset + pagination.pageSize);
