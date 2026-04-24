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

  const issues: Array<{ field: "page" | "pageSize"; message: string; rule: string }> = [];

  if (resolvedPage <= 0) {
    issues.push({
      field: "page",
      message: "page must be greater than or equal to 1",
      rule: "min",
    });
  }

  if (!ALLOWED_PAGE_SIZES.includes(resolvedPageSize as AllowedPageSize)) {
    issues.push({
      field: "pageSize",
      message: `pageSize must be one of ${ALLOWED_PAGE_SIZES.join(", ")}`,
      rule: "isIn",
    });
  }

  if (issues.length > 0) {
    throw new ValidationAppError({ issues });
  }

  return {
    page: resolvedPage,
    pageSize: resolvedPageSize as AllowedPageSize,
    offset: (resolvedPage - 1) * resolvedPageSize,
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
