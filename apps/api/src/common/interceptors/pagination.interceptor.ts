import { createPaginationMeta, type PaginationParams } from "../pagination/pagination.js";
import {
  createListResponsePayload,
  type ListResponsePayload,
} from "./response-envelope.interceptor.js";

type CreatePaginatedListPayloadOptions<TItem> = {
  items: readonly TItem[];
  totalItems: number;
  pagination: PaginationParams;
};

// Bootstrap-compatible pagination wrapper. The repo's live API surface still
// runs through src/dev.ts rather than a Nest interceptor chain. Callers pass
// already-paged items plus the total item count so the helper stays compatible
// with real paged queries as well as the bootstrap fixture route.
export const createPaginatedListPayload = <TItem>({
  items,
  totalItems,
  pagination,
}: CreatePaginatedListPayloadOptions<TItem>): ListResponsePayload<TItem> => {
  return createListResponsePayload({
    items: [...items],
    total: totalItems,
    pagination: createPaginationMeta({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
    }),
  });
};
