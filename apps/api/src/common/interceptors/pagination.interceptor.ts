import { createPaginationMeta, slicePageItems, type PaginationParams } from "../pagination/pagination.js";
import {
  createListResponsePayload,
  type ListResponsePayload,
} from "./response-envelope.interceptor.js";

type CreatePaginatedListPayloadOptions<TItem> = {
  items: readonly TItem[];
  pagination: PaginationParams;
};

// Bootstrap-compatible pagination wrapper. The repo's live API surface still
// runs through src/dev.ts rather than a Nest interceptor chain.
export const createPaginatedListPayload = <TItem>({
  items,
  pagination,
}: CreatePaginatedListPayloadOptions<TItem>): ListResponsePayload<TItem> => {
  const pagedItems = slicePageItems(items, pagination);
  const totalItems = items.length;

  return createListResponsePayload({
    items: pagedItems,
    total: totalItems,
    pagination: createPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
    }),
  });
};
