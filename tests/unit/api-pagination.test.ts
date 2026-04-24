import assert from "node:assert/strict";
import test from "node:test";

import { ValidationAppError } from "../../apps/api/src/common/filters/app-error.filter.js";
import { createPaginatedListPayload } from "../../apps/api/src/common/interceptors/pagination.interceptor.js";
import {
  ALLOWED_PAGE_SIZES,
  createPaginationMeta,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  parsePaginationParams,
} from "../../apps/api/src/common/pagination/pagination.js";

test("pagination helpers apply canonical defaults and allowed page sizes", () => {
  assert.equal(DEFAULT_PAGE, 1);
  assert.equal(DEFAULT_PAGE_SIZE, 25);
  assert.deepEqual(ALLOWED_PAGE_SIZES, [10, 25, 50, 100]);

  assert.deepEqual(parsePaginationParams({}), {
    page: 1,
    pageSize: 25,
    offset: 0,
    limit: 25,
  });

  assert.deepEqual(parsePaginationParams({ page: "2", pageSize: "50" }), {
    page: 2,
    pageSize: 50,
    offset: 50,
    limit: 50,
  });
});

test("pagination helpers reject page 0 with VALIDATION_ERROR", () => {
  assert.throws(
    () => parsePaginationParams({ page: "0" }),
    (error: unknown) =>
      error instanceof ValidationAppError &&
      error.code === "VALIDATION_ERROR" &&
      error.details?.some((detail) => detail.field === "page"),
  );
});

test("pagination helpers reject unsupported pageSize values with VALIDATION_ERROR", () => {
  assert.throws(
    () => parsePaginationParams({ pageSize: "150" }),
    (error: unknown) =>
      error instanceof ValidationAppError &&
      error.code === "VALIDATION_ERROR" &&
      error.details?.some((detail) => detail.field === "pageSize"),
  );
});

test("pagination helpers reject unsafe page integers with VALIDATION_ERROR", () => {
  assert.throws(
    () => parsePaginationParams({ page: "9007199254740992" }),
    (error: unknown) =>
      error instanceof ValidationAppError &&
      error.code === "VALIDATION_ERROR" &&
      error.details?.some((detail) => detail.field === "page"),
  );
});

test("pagination metadata calculator derives total pages and navigation flags", () => {
  assert.deepEqual(
    createPaginationMeta({
      page: 2,
      pageSize: 10,
      totalItems: 53,
    }),
    {
      page: 2,
      pageSize: 10,
      totalItems: 53,
      totalPages: 6,
      hasNextPage: true,
      hasPreviousPage: true,
    },
  );

  assert.deepEqual(
    createPaginationMeta({
      page: 1,
      pageSize: 25,
      totalItems: 0,
    }),
    {
      page: 1,
      pageSize: 25,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  );
});

test("paginated list payloads preserve canonical envelope-ready data and meta", () => {
  const allItems = Array.from({ length: 53 }, (_, index) => ({
    id: `fixture_${String(index + 1).padStart(3, "0")}`,
  }));
  const pagination = parsePaginationParams({
    page: "2",
    pageSize: "10",
  });
  const payload = createPaginatedListPayload({
    items: allItems.slice(pagination.offset, pagination.offset + pagination.pageSize),
    totalItems: allItems.length,
    pagination,
  });

  assert.equal(payload.kind, "list");
  assert.equal(payload.total, 53);
  assert.equal(payload.items.length, 10);
  assert.deepEqual(payload.items[0], { id: "fixture_011" });
  assert.deepEqual(payload.pagination, {
    page: 2,
    pageSize: 10,
    totalItems: 53,
    totalPages: 6,
    hasNextPage: true,
    hasPreviousPage: true,
  });
});

test("pagination metadata rejects invalid exported inputs", () => {
  assert.throws(
    () =>
      createPaginationMeta({
        page: 1,
        pageSize: 0,
        totalItems: 10,
      }),
    (error: unknown) =>
      error instanceof ValidationAppError &&
      error.code === "VALIDATION_ERROR" &&
      error.details?.some((detail) => detail.field === "pageSize"),
  );

  assert.throws(
    () =>
      createPaginationMeta({
        page: 1,
        pageSize: 10,
        totalItems: -1,
      }),
    (error: unknown) =>
      error instanceof ValidationAppError &&
      error.code === "VALIDATION_ERROR" &&
      error.details?.some((detail) => detail.field === "totalItems"),
  );
});
