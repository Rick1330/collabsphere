import { describe, it, expect } from "vitest";
import {
  DEFAULT_BOARD_COLUMNS,
  buildBoardData,
  canTransition,
  listBoardTasks,
  listTasksMap,
  listWorkspaceMembers,
  STATUS_LABELS,
  type TaskStatus,
} from "./tasks";

describe("api/adapters/tasks", () => {
  it("buildBoardData groups tasks under the configured columns and preserves order", async () => {
    const map = await listTasksMap("alpha");
    const board = buildBoardData(map, DEFAULT_BOARD_COLUMNS);

    expect(board.map((c) => c.status)).toEqual([
      "todo",
      "in_progress",
      "in_review",
      "done",
    ]);

    for (const col of board) {
      for (const t of col.tasks) {
        expect(t.status).toBe(col.status);
      }
      // position ordering is monotonic per column
      const positions = col.tasks.map((t) => t.position);
      const sorted = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sorted);
    }
  });

  it("listBoardTasks returns the same shape as buildBoardData", async () => {
    const board = await listBoardTasks("alpha", DEFAULT_BOARD_COLUMNS);
    expect(Array.isArray(board)).toBe(true);
    expect(board.length).toBe(DEFAULT_BOARD_COLUMNS.length);
    for (const col of board) {
      expect(STATUS_LABELS[col.status]).toBeDefined();
    }
  });

  it("listWorkspaceMembers returns at least one assignable member", async () => {
    const members = await listWorkspaceMembers("alpha");
    expect(members.length).toBeGreaterThan(0);
    expect(members[0]).toHaveProperty("id");
    expect(members[0]).toHaveProperty("fullName");
  });

  it("canTransition enforces the documented workflow", () => {
    const cases: [TaskStatus, TaskStatus, boolean][] = [
      ["todo", "in_progress", true],
      ["in_progress", "in_review", true],
      ["in_review", "done", true],
      ["done", "todo", false], // not allowed
      ["backlog", "in_progress", false],
      ["todo", "todo", true], // same column ok
    ];
    for (const [from, to, expected] of cases) {
      expect(canTransition(from, to)).toBe(expected);
    }
  });
});
