import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTaskListQueryState } from "./use-task-list-query-state";

describe("useTaskListQueryState", () => {
  it("starts on page 1 with default sort + empty filters", () => {
    const { result } = renderHook(() => useTaskListQueryState());
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.sortBy).toBe("status");
    expect(result.current.state.sortOrder).toBe("asc");
    expect(result.current.state.search).toBe("");
  });

  it("changing search resets to page 1", () => {
    const { result } = renderHook(() => useTaskListQueryState());
    act(() => result.current.setPage(5));
    expect(result.current.state.page).toBe(5);
    act(() => result.current.setSearch("login"));
    expect(result.current.state.page).toBe(1);
    expect(result.current.state.search).toBe("login");
  });

  it("clicking the active sort column toggles direction", () => {
    const { result } = renderHook(() => useTaskListQueryState());
    act(() => result.current.setSort("status"));
    expect(result.current.state.sortOrder).toBe("desc");
    act(() => result.current.setSort("status"));
    expect(result.current.state.sortOrder).toBe("asc");
  });

  it("changing pageSize resets pagination", () => {
    const { result } = renderHook(() => useTaskListQueryState());
    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(50));
    expect(result.current.state.pageSize).toBe(50);
    expect(result.current.state.page).toBe(1);
  });
});
