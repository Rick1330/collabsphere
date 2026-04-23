import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskStatusBadge } from "./task-status-badge";
import type { TaskStatus } from "@/api/adapters/tasks";

describe("TaskStatusBadge", () => {
  const cases: Array<[TaskStatus, string]> = [
    ["backlog", "BACKLOG"],
    ["todo", "TODO"],
    ["in_progress", "PROGRESS"],
    ["in_review", "REVIEW"],
    ["done", "DONE"],
  ];

  for (const [status, label] of cases) {
    it(`renders the ${status} branch with the ${label} label`, () => {
      render(<TaskStatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }

  it("merges custom className with the variant classes", () => {
    render(<TaskStatusBadge status="done" className="custom-test-class" />);
    const node = screen.getByText("DONE");
    expect(node.className).toMatch(/custom-test-class/);
    // emerald palette comes from the done branch
    expect(node.className).toMatch(/emerald/);
  });
});
