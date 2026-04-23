import { useState } from "react";
import type { SortField, SortDirection } from "@/features/tasks/components/task-list-table";
import {
  EMPTY_FILTERS,
  type AdvancedFilterState,
} from "@/features/tasks/components/task-advanced-filters";

export interface TaskListQueryState {
  page: number;
  pageSize: number;
  search: string;
  sortBy: SortField;
  sortOrder: SortDirection;
  filters: AdvancedFilterState;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const DEFAULT: TaskListQueryState = {
  page: 1,
  pageSize: 25,
  search: "",
  sortBy: "status",
  sortOrder: "asc",
  filters: EMPTY_FILTERS,
};

/**
 * Local mirror of the server-side query state. Reset to page 1 on any
 * filter/search/sort change so the user never gets stranded on an empty
 * paginated tail.
 */
export function useTaskListQueryState() {
  const [state, setState] = useState<TaskListQueryState>(DEFAULT);

  const setSearch = (search: string) =>
    setState((s) => ({ ...s, search, page: 1 }));
  const setFilters = (filters: AdvancedFilterState) =>
    setState((s) => ({ ...s, filters, page: 1 }));
  const setSort = (field: SortField) =>
    setState((s) => ({
      ...s,
      page: 1,
      sortBy: field,
      sortOrder:
        s.sortBy === field ? (s.sortOrder === "asc" ? "desc" : "asc") : "asc",
    }));
  const setPage = (page: number) => setState((s) => ({ ...s, page }));
  const setPageSize = (pageSize: number) =>
    setState((s) => ({ ...s, pageSize, page: 1 }));
  const reset = () => setState(DEFAULT);

  return {
    state,
    setSearch,
    setFilters,
    setSort,
    setPage,
    setPageSize,
    reset,
  };
}
